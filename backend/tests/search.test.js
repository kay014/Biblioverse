require("dotenv").config({ path: ".env.test" });
const request = require("supertest");
const app = require("../app");
const { connectTestDB, disconnectTestDB, clearDatabase } = require("./setup");

// Mock the Google Books service
jest.mock("../services/bookService", () => ({
  searchGoogleBooks: jest.fn(),
}));

const { searchGoogleBooks } = require("../services/bookService");

describe("Google Books Search Endpoint", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe("GET /api/books/search", () => {
    it("should return books from mocked Google Books API", async () => {
      searchGoogleBooks.mockResolvedValue([
        {
          title: "Test Book 1",
          authors: ["Test Author"],
          source: "google_books",
          sourceId: "google-1",
          averageRating: 4.5,
          ratingsCount: 100,
        },
        {
          title: "Test Book 2",
          authors: ["Another Author"],
          source: "google_books",
          sourceId: "google-2",
          averageRating: 4.0,
          ratingsCount: 50,
        },
      ]);

      const response = await request(app).get("/api/books/search?q=test");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(searchGoogleBooks).toHaveBeenCalledWith("test");
    });

    it("should reject empty search query", async () => {
      const response = await request(app).get("/api/books/search?q=");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("required");
    });

    it("should reject missing search query", async () => {
      const response = await request(app).get("/api/books/search");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should handle external API failure", async () => {
      searchGoogleBooks.mockRejectedValue(
        new Error("Failed to fetch books from Google Books API")
      );

      const response = await request(app).get("/api/books/search?q=test");

      expect(response.status).toBe(502);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("external source");
    });

    it("should handle empty results from Google Books", async () => {
      searchGoogleBooks.mockResolvedValue([]);

      const response = await request(app).get("/api/books/search?q=noresults");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    it("should normalize search results", async () => {
      searchGoogleBooks.mockResolvedValue([
        {
          title: "Book Title",
          authors: ["Author"],
          source: "google_books",
          sourceId: "id-1",
        },
      ]);

      const response = await request(app).get("/api/books/search?q=test");

      expect(response.status).toBe(200);
      expect(response.body.data[0]).toHaveProperty("title");
      expect(response.body.data[0]).toHaveProperty("source", "google_books");
    });

    it("should trim whitespace from search query", async () => {
      searchGoogleBooks.mockResolvedValue([]);

      const response = await request(app).get("/api/books/search?q=%20%20test%20%20");

      expect(response.status).toBe(200);
      expect(searchGoogleBooks).toHaveBeenCalled();
    });
  });
});
