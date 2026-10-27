const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    authors: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      default: "",
    },
    coverImage: {
      type: String,
      default: null,
    },
    isbn: {
      type: String,
      default: null,
    },
    publishedDate: {
      type: String,
      default: null,
    },
    categories: {
      type: [String],
      default: [],
    },
    pageCount: {
      type: Number,
      default: null,
    },
    language: {
      type: String,
      default: null,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    ratingsCount: {
      type: Number,
      default: 0,
    },
    source: {
      type: String,
      required: true,
    },
    sourceId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

bookSchema.index({ source: 1, sourceId: 1 }, { unique: true });

module.exports = mongoose.model("Book", bookSchema);
