const mongoose = require("mongoose");
const User = require("../models/User");
const Book = require("../models/Book");
const SavedBook = require("../models/SavedBook");
const Review = require("../models/Review");

const connectTestDB = async () => {
  const mongoUri = process.env.MONGO_TEST_URI || "mongodb://127.0.0.1:27017/biblioverse-test";
  try {
    await mongoose.connect(mongoUri);
  } catch (error) {
    console.error("Test DB connection failed:", error.message);
    throw error;
  }
};

const disconnectTestDB = async () => {
  try {
    await mongoose.disconnect();
  } catch (error) {
    console.error("Test DB disconnection failed:", error.message);
    throw error;
  }
};

const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await Book.deleteMany({});
    await SavedBook.deleteMany({});
    await Review.deleteMany({});
  } catch (error) {
    console.error("Database clearance failed:", error.message);
    throw error;
  }
};

const createTestUser = async (userData = {}) => {
  const defaultData = {
    name: "Test User",
    email: "testuser@example.com",
    password: "HashedPassword123!", // Would be hashed in real controller
  };

  return User.create({ ...defaultData, ...userData });
};

const createTestBook = async (bookData = {}) => {
  const defaultData = {
    title: "Test Book",
    authors: ["Test Author"],
    source: "test",
    sourceId: `test-${Date.now()}`,
  };

  return Book.create({ ...defaultData, ...bookData });
};

module.exports = {
  connectTestDB,
  disconnectTestDB,
  clearDatabase,
  createTestUser,
  createTestBook,
};
