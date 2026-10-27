const GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes";

const getPreferredCoverImage = (imageLinks = {}) => {
  if (!imageLinks || typeof imageLinks !== "object") {
    return null;
  }

  return (
    imageLinks.thumbnail ||
    imageLinks.smallThumbnail ||
    imageLinks.medium ||
    imageLinks.large ||
    imageLinks.extraLarge ||
    null
  );
};

const getIsbn = (industryIdentifiers = []) => {
  if (!Array.isArray(industryIdentifiers) || industryIdentifiers.length === 0) {
    return null;
  }

  const isbn13 = industryIdentifiers.find((item) => item && item.type === "ISBN_13");
  if (isbn13 && isbn13.identifier) {
    return isbn13.identifier;
  }

  const isbn10 = industryIdentifiers.find((item) => item && item.type === "ISBN_10");
  if (isbn10 && isbn10.identifier) {
    return isbn10.identifier;
  }

  return null;
};

const normalizeGoogleBook = (item) => {
  const volumeInfo = item && item.volumeInfo ? item.volumeInfo : {};

  const title = volumeInfo.title || "Untitled";

  if (!title || title === "Untitled") {
    return null;
  }

  return {
    title,
    authors: Array.isArray(volumeInfo.authors) ? volumeInfo.authors : [],
    description: volumeInfo.description || "",
    coverImage: getPreferredCoverImage(volumeInfo.imageLinks) || null,
    isbn: getIsbn(volumeInfo.industryIdentifiers) || null,
    publishedDate: volumeInfo.publishedDate || null,
    categories: Array.isArray(volumeInfo.categories) ? volumeInfo.categories : [],
    pageCount: volumeInfo.pageCount ?? null,
    language: volumeInfo.language || null,
    averageRating: volumeInfo.averageRating ?? 0,
    ratingsCount: volumeInfo.ratingsCount ?? 0,
    source: "google_books",
    sourceId: item && item.id ? item.id : null,
  };
};

const searchGoogleBooks = async (query) => {
  if (typeof query !== "string" || !query.trim()) {
    throw new Error("Search query is required");
  }

  const trimmedQuery = query.trim();
  const params = new URLSearchParams({ q: trimmedQuery });

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (apiKey) {
    params.set("key", apiKey);
  }

  const response = await fetch(`${GOOGLE_BOOKS_API_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch books from Google Books API");
  }

  const data = await response.json();

  if (!data || !Array.isArray(data.items) || data.totalItems === 0) {
    return [];
  }

  const normalizedBooks = data.items
    .map(normalizeGoogleBook)
    .filter(Boolean)
    .filter((book) => book.sourceId);

  return normalizedBooks;
};

module.exports = {
  searchGoogleBooks,
};
