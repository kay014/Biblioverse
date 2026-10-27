require("dotenv").config({ path: ".env.test" });
const request = require("supertest");
const app = require("../app");
const { connectTestDB, disconnectTestDB, clearDatabase, createTestBook } = require("./setup");

describe("Book Discovery Endpoint", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    // Create test books with various attributes
    await createTestBook({
      title: "Harry Potter and the Philosopher Stone",
      authors: ["J.K. Rowling"],
      categories: ["Fantasy", "Adventure"],
      language: "en",
      averageRating: 4.8,
      ratingsCount: 100,
      source: "test",
      sourceId: "hp-1",
    });

    await createTestBook({
      title: "The Hobbit",
      authors: ["J.R.R. Tolkien"],
      categories: ["Fantasy"],
      language: "en",
      averageRating: 4.5,
      ratingsCount: 80,
      source: "test",
      sourceId: "hobbit-1",
    });

    await createTestBook({
      title: "1984",
      authors: ["George Orwell"],
      categories: ["Dystopian", "Fiction"],
      language: "en",
      averageRating: 4.2,
      ratingsCount: 70,
      source: "test",
      sourceId: "1984-1",
    });

    await createTestBook({
      title: "Les Misérables",
      authors: ["Victor Hugo"],
      categories: ["Historical", "Fiction"],
      language: "fr",
      averageRating: 4.0,
      ratingsCount: 60,
      source: "test",
      sourceId: "lesmi-1",
    });
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe("GET /api/books/discover", () => {
    it("should return all books without filters", async () => {
      const response = await request(app).get("/api/books/discover");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(4);
      expect(response.body.pagination.totalBooks).toBe(4);
    });

    it("should filter by search query (q)", async () => {
      const response = await request(app).get("/api/books/discover?q=Harry");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toContain("Harry");
    });

    it("should search across title, authors, and description", async () => {
      const response = await request(app).get("/api/books/discover?q=Rowling");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].authors).toContain("J.K. Rowling");
    });

    it("should filter by author", async () => {
      const response = await request(app).get("/api/books/discover?author=Tolkien");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].authors).toContain("J.R.R. Tolkien");
    });

    it("should filter by category", async () => {
      const response = await request(app).get("/api/books/discover?category=Fantasy");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
    });

    it("should filter by language", async () => {
      const response = await request(app).get("/api/books/discover?language=fr");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].language).toBe("fr");
    });

    it("should filter by minRating", async () => {
      const response = await request(app).get("/api/books/discover?minRating=4.5");

      expect(response.status).toBe(200);
      expect(response.body.data.every((b) => b.averageRating >= 4.5)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it("should sort by rating (default)", async () => {
      const response = await request(app).get("/api/books/discover?sort=rating");

      expect(response.status).toBe(200);
      expect(response.body.data[0].averageRating).toBeGreaterThanOrEqual(
        response.body.data[1].averageRating
      );
    });

    it("should sort by newest", async () => {
      const response = await request(app).get("/api/books/discover?sort=newest");

      expect(response.status).toBe(200);
      // Should have books ordered by creation date (newest first)
      expect(response.body.data.length).toBe(4);
    });

    it("should sort by title", async () => {
      const response = await request(app).get("/api/books/discover?sort=title");

      expect(response.status).toBe(200);
      expect(response.body.data[0].title).toBe("1984");
    });

    it("should combine multiple filters", async () => {
      const response = await request(app).get(
        "/api/books/discover?q=Fantasy&language=en&minRating=4.5"
      );

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.every((b) => b.language === "en")).toBe(true);
    });

    it("should reject invalid minRating below 0", async () => {
      const response = await request(app).get("/api/books/discover?minRating=-1");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject invalid minRating above 5", async () => {
      const response = await request(app).get("/api/books/discover?minRating=6");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject invalid page", async () => {
      const response = await request(app).get("/api/books/discover?page=0");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject invalid limit", async () => {
      const response = await request(app).get("/api/books/discover?limit=100");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject invalid sort parameter", async () => {
      const response = await request(app).get("/api/books/discover?sort=invalid");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should handle pagination", async () => {
      const response = await request(app).get("/api/books/discover?limit=2&page=1");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.totalPages).toBe(2);
    });
  });
});
