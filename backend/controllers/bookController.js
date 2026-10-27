const mongoose = require("mongoose");
const Book = require("../models/Book");
const SavedBook = require("../models/SavedBook");
const Review = require("../models/Review");
const { searchGoogleBooks } = require("../services/bookService");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const allowedReadingStatuses = ["want_to_read", "reading", "finished"];

const updateBookRatingStats = async (bookId) => {
  const reviews = await Review.find({ book: bookId });
  const ratingsCount = reviews.length;
  const averageRating = ratingsCount
    ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / ratingsCount).toFixed(1))
    : 0;

  await Book.findByIdAndUpdate(
    bookId,
    {
      averageRating,
      ratingsCount,
    },
    { new: true }
  );

  return {
    averageRating,
    ratingsCount,
  };
};

const searchBooks = async (req, res) => {
  try {
    const query = req.query.q;

    if (typeof query !== "string" || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const books = await searchGoogleBooks(query);

    const savedBooks = await Promise.all(
        books.map((book) =>
        Book.findOneAndUpdate(
            {
            source: book.source,
            sourceId: book.sourceId,
          },
        {
            $set: book,
        },
        {
            new: true,
            upsert: true,
            runValidators: true,
        }
    )
    )
);

return res.status(200).json({
  success: true,
  message: "Books fetched and stored successfully",
  data: savedBooks,
});
  } catch (error) {
    const message = error && error.message ? error.message : "Failed to fetch books";

    if (message === "Search query is required") {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (message === "Failed to fetch books from Google Books API") {
      return res.status(502).json({
        success: false,
        message: "Failed to fetch books from external source",
      });
    }

    console.error("Search books failed:", message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch books",
    });
  }
};

const createBook = async (req, res) => {
  try {
    const { title, source, sourceId } = req.body;

    if (!title || !source || !sourceId) {
      return res.status(400).json({
        success: false,
        message: "Title, source, and sourceId are required",
      });
    }

    const newBook = await Book.create({
      ...req.body,
      title,
      source,
      sourceId,
    });

    return res.status(201).json({
      success: true,
      message: "Book created successfully",
      data: newBook,
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Book already exists",
      });
    }

    if (error && error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Book creation failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Book creation failed",
    });
  }
};

const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    if (error && error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    console.error("Fetch book failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch book",
    });
  }
};

const getAllBooks = async (req, res) => {
  try {
    const rawPage = Number(req.query.page ?? 1);
    const rawLimit = Number(req.query.limit ?? 20);

    if (!Number.isInteger(rawPage) || rawPage < 1) {
      return res.status(400).json({
        success: false,
        message: "Page must be greater than or equal to 1",
      });
    }

    if (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 50) {
      return res.status(400).json({
        success: false,
        message: "Limit must be between 1 and 50",
      });
    }

    const page = rawPage;
    const limit = rawLimit;
    const skip = (page - 1) * limit;

    const [books, totalBooks] = await Promise.all([
      Book.find({}).skip(skip).limit(limit),
      Book.countDocuments({}),
    ]);

    const totalPages = Math.ceil(totalBooks / limit);

    return res.status(200).json({
      success: true,
      data: books,
      pagination: {
        page,
        limit,
        totalBooks,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Fetch all books failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch books",
    });
  }
};

const discoverBooks = async (req, res) => {
  try {
    const rawPage = Number(req.query.page ?? 1);
    const rawLimit = Number(req.query.limit ?? 20);

    if (!Number.isInteger(rawPage) || rawPage < 1) {
      return res.status(400).json({
        success: false,
        message: "Page must be greater than or equal to 1",
      });
    }

    if (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 50) {
      return res.status(400).json({
        success: false,
        message: "Limit must be between 1 and 50",
      });
    }

    const rawMinRating = req.query.minRating;
    const minRatingValue = rawMinRating !== undefined ? Number(rawMinRating) : null;

    if (rawMinRating !== undefined && (!Number.isFinite(minRatingValue) || minRatingValue < 0 || minRatingValue > 5)) {
      return res.status(400).json({
        success: false,
        message: "minRating must be between 0 and 5",
      });
    }

    const allowedSorts = {
      rating: { averageRating: -1, ratingsCount: -1, createdAt: -1 },
      newest: { createdAt: -1 },
      title: { title: 1 },
    };

    const sortParam = req.query.sort || "rating";
    const sortOption = allowedSorts[sortParam];

    if (sortParam && !sortOption) {
      return res.status(400).json({
        success: false,
        message: "Invalid sort option",
      });
    }

    const filter = {};
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

    if (q) {
      const safeQuery = escapeRegex(q);
      filter.$or = [
        { title: { $regex: safeQuery, $options: "i" } },
        { authors: { $regex: safeQuery, $options: "i" } },
        { description: { $regex: safeQuery, $options: "i" } },
      ];
    }

    const author = typeof req.query.author === "string" ? req.query.author.trim() : "";
    if (author) {
      filter.authors = { $regex: escapeRegex(author), $options: "i" };
    }

    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
    if (category) {
      filter.categories = { $regex: escapeRegex(category), $options: "i" };
    }

    const language = typeof req.query.language === "string" ? req.query.language.trim() : "";
    if (language) {
      filter.language = { $regex: escapeRegex(language), $options: "i" };
    }

    if (minRatingValue !== null) {
      filter.averageRating = { $gte: minRatingValue };
    }

    const page = rawPage;
    const limit = rawLimit;
    const skip = (page - 1) * limit;

    const sort = sortOption || { averageRating: -1, ratingsCount: -1, createdAt: -1 };

    const [books, totalBooks] = await Promise.all([
      Book.find(filter).sort(sort).skip(skip).limit(limit),
      Book.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalBooks / limit);

    return res.status(200).json({
      success: true,
      data: books,
      pagination: {
        page,
        limit,
        totalBooks,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Discover books failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to discover books",
    });
  }
};

const saveBook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user && req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const savedBook = await SavedBook.create({
      user: userId,
      book: id,
      status: "want_to_read",
    });

    return res.status(201).json({
      success: true,
      message: "Book saved successfully",
      data: savedBook,
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Book already saved",
      });
    }

    console.error("Save book failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to save book",
    });
  }
};

const unsaveBook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user && req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const result = await SavedBook.findOneAndDelete({
      user: userId,
      book: id,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Book is not saved",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Book removed from saved books",
    });
  } catch (error) {
    console.error("Unsave book failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to remove saved book",
    });
  }
};

const getSavedBooks = async (req, res) => {
  try {
    const userId = req.user && req.user.userId;

    const savedBooks = await SavedBook.find({ user: userId }).populate("book").sort({ createdAt: -1 });

    const books = savedBooks.map((savedBook) => savedBook.book).filter(Boolean);

    return res.status(200).json({
      success: true,
      data: books,
    });
  } catch (error) {
    console.error("Fetch saved books failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch saved books",
    });
  }
};

const getLibrary = async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    const requestedStatus = req.query && req.query.status;

    if (requestedStatus !== undefined && !allowedReadingStatuses.includes(requestedStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reading status",
      });
    }

    const filter = { user: userId };
    if (requestedStatus) {
      filter.status = requestedStatus;
    }

    const savedBooks = await SavedBook.find(filter)
      .populate("book")
      .sort({ createdAt: -1 });

    const library = savedBooks
      .filter((savedBook) => savedBook.book)
      .map((savedBook) => ({
        book: savedBook.book,
        status: savedBook.status,
        savedAt: savedBook.createdAt,
      }));

    return res.status(200).json({
      success: true,
      data: library,
    });
  } catch (error) {
    console.error("Fetch library failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch library",
    });
  }
};

const updateReadingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user && req.user.userId;
    const { status } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    if (!allowedReadingStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reading status",
      });
    }

    const savedBook = await SavedBook.findOne({ user: userId, book: id }).populate("book");

    if (!savedBook) {
      return res.status(404).json({
        success: false,
        message: "Book is not in your library",
      });
    }

    savedBook.status = status;
    await savedBook.save();

    return res.status(200).json({
      success: true,
      message: "Reading status updated successfully",
      data: {
        book: savedBook.book,
        status: savedBook.status,
      },
    });
  } catch (error) {
    console.error("Update reading status failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update reading status",
    });
  }
};

const createReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user && req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const rating = Number(req.body && req.body.rating);

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";

    const review = await Review.create({
      user: userId,
      book: id,
      rating,
      comment,
    });

    await updateBookRatingStats(id);

    return res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: review,
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this book",
      });
    }

    console.error("Create review failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Review creation failed",
    });
  }
};

const getBookReviews = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const reviews = await Review.find({ book: id })
      .populate("user", "_id name email profileImage")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("Fetch book reviews failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
    });
  }
};

const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user && req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const review = await Review.findOne({
      user: userId,
      book: id,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const rating = Number(req.body && req.body.rating);

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    review.rating = rating;
    review.comment = typeof req.body.comment === "string" ? req.body.comment.trim() : review.comment;

    await review.save();
    await updateBookRatingStats(id);

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: review,
    });
  } catch (error) {
    console.error("Update review failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Review update failed",
    });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user && req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const review = await Review.findOne({
      user: userId,
      book: id,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    await review.deleteOne();
    await updateBookRatingStats(id);

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete review failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Review deletion failed",
    });
  }
};

module.exports = {
  createBook,
  getBookById,
  getAllBooks,
  discoverBooks,
  searchBooks,
  saveBook,
  unsaveBook,
  getSavedBooks,
  getLibrary,
  updateReadingStatus,
  createReview,
  getBookReviews,
  updateReview,
  deleteReview,
};
