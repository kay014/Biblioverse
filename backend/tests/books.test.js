require("dotenv").config({ path: ".env.test" });
const request = require("supertest");
const app = require("../app");
const Book = require("../models/Book");
const User = require("../models/User");
const { connectTestDB, disconnectTestDB, clearDatabase, createTestBook } = require("./setup");

describe("Book Endpoints", () => {
  let loginResponse;
  let authCookie;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    // Register and login a test user
    await request(app).post("/api/auth/register").send({
      name: "Book Test User",
      email: "booktest@example.com",
      password: "Password123!",
    });

    loginResponse = await request(app).post("/api/auth/login").send({
      email: "booktest@example.com",
      password: "Password123!",
    });

    authCookie = loginResponse.headers["set-cookie"];
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe("GET /api/books", () => {
    beforeEach(async () => {
      // Create multiple test books
      for (let i = 1; i <= 25; i++) {
        await createTestBook({
          title: `Book ${i}`,
          authors: [`Author ${i}`],
          source: "test",
          sourceId: `book-${i}`,
        });
      }
    });

    it("should return paginated list of books", async () => {
      const response = await request(app).get("/api/books");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toHaveProperty("page", 1);
      expect(response.body.pagination).toHaveProperty("limit", 20);
      expect(response.body.pagination).toHaveProperty("totalBooks", 25);
      expect(response.body.pagination).toHaveProperty("totalPages", 2);
    });

    it("should respect page parameter", async () => {
      const response = await request(app).get("/api/books?page=2");

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it("should respect limit parameter", async () => {
      const response = await request(app).get("/api/books?limit=10");

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.data.length).toBe(10);
      expect(response.body.pagination.totalPages).toBe(3);
    });

    it("should reject invalid page", async () => {
      const response = await request(app).get("/api/books?page=0");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject invalid limit", async () => {
      const response = await request(app).get("/api/books?limit=100");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject negative limit", async () => {
      const response = await request(app).get("/api/books?limit=-5");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/books", () => {
    it("should create a book when authenticated", async () => {
      const response = await request(app)
        .post("/api/books")
        .set("Cookie", authCookie)
        .send({
          title: "New Book",
          authors: ["New Author"],
          source: "test",
          sourceId: "new-book-1",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("title", "New Book");

      const book = await Book.findOne({ sourceId: "new-book-1" });
      expect(book).toBeTruthy();
    });

    it("should reject book creation without authentication", async () => {
      const response = await request(app)
        .post("/api/books")
        .send({
          title: "New Book",
          authors: ["New Author"],
          source: "test",
          sourceId: "new-book-1",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject book creation without required fields", async () => {
      const response = await request(app)
        .post("/api/books")
        .set("Cookie", authCookie)
        .send({
          title: "New Book",
          // Missing source and sourceId
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject duplicate source + sourceId", async () => {
      const bookData = {
        title: "Book One",
        authors: ["Author"],
        source: "test",
        sourceId: "duplicate-1",
      };

      // Create first book
      await request(app)
        .post("/api/books")
        .set("Cookie", authCookie)
        .send(bookData);

      // Try to create duplicate
      const response = await request(app)
        .post("/api/books")
        .set("Cookie", authCookie)
        .send(bookData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/books/:id", () => {
    let testBook;

    beforeEach(async () => {
      testBook = await createTestBook();
    });

    it("should return a book by valid ID", async () => {
      const response = await request(app).get(`/api/books/${testBook._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("title", testBook.title);
    });

    it("should reject invalid book ID format", async () => {
      const response = await request(app).get("/api/books/invalid-id");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for nonexistent book", async () => {
      const fakeId = "000000000000000000000000";
      const response = await request(app).get(`/api/books/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
