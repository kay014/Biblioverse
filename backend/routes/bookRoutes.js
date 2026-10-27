const express = require("express");
const {
  createBook,
  getAllBooks,
  getBookById,
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
} = require("../controllers/bookController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createBook);
router.get("/", getAllBooks);
router.get("/discover", discoverBooks);
router.get("/saved", authMiddleware, getSavedBooks);
router.get("/library", authMiddleware, getLibrary);
router.get("/search", searchBooks);
router.post("/:id/reviews", authMiddleware, createReview);
router.get("/:id/reviews", getBookReviews);
router.put("/:id/reviews", authMiddleware, updateReview);
router.delete("/:id/reviews", authMiddleware, deleteReview);
router.post("/:id/save", authMiddleware, saveBook);
router.delete("/:id/save", authMiddleware, unsaveBook);
router.patch("/:id/status", authMiddleware, updateReadingStatus);
router.get("/:id", getBookById);

module.exports = router;
