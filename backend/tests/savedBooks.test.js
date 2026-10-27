require("dotenv").config({ path: ".env.test" });
const request = require("supertest");
const app = require("../app");
const SavedBook = require("../models/SavedBook");
const { connectTestDB, disconnectTestDB, clearDatabase, createTestBook } = require("./setup");

const registerAndLogin = async ({ name, email, password }) => {
  const agent = request.agent(app);
  await agent.post("/api/auth/register").send({ name, email, password });
  await agent.post("/api/auth/login").send({ email, password });
  return agent;
};

describe("Saved Books Endpoints", () => {
  let agent1;
  let agent2;
  let testBook;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    agent1 = await registerAndLogin({
      name: "User One",
      email: "user1@example.com",
      password: "Password123!",
    });

    agent2 = await registerAndLogin({
      name: "User Two",
      email: "user2@example.com",
      password: "Password123!",
    });

    testBook = await createTestBook();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe("POST /api/books/:id/save", () => {
    it("should save a book for authenticated user", async () => {
      const response = await agent1.post(`/api/books/${testBook._id}/save`);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("status", "want_to_read");

      const savedBook = await SavedBook.findOne({
        book: testBook._id,
      });
      expect(savedBook).toBeTruthy();
    });

    it("should reject save without authentication", async () => {
      const response = await request(app).post(`/api/books/${testBook._id}/save`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject save with invalid book ID", async () => {
      const response = await agent1.post("/api/books/invalid-id/save");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject save for nonexistent book", async () => {
      const fakeId = "000000000000000000000000";
      const response = await agent1.post(`/api/books/${fakeId}/save`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject duplicate save", async () => {
      await agent1.post(`/api/books/${testBook._id}/save`);

      const response = await agent1.post(`/api/books/${testBook._id}/save`);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("already saved");
    });
  });

  describe("DELETE /api/books/:id/save", () => {
    beforeEach(async () => {
      await agent1.post(`/api/books/${testBook._id}/save`);
    });

    it("should unsave a book", async () => {
      const response = await agent1.delete(`/api/books/${testBook._id}/save`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const savedBook = await SavedBook.findOne({
        book: testBook._id,
      });
      expect(savedBook).toBeFalsy();
    });

    it("should reject unsave without authentication", async () => {
      const response = await request(app).delete(`/api/books/${testBook._id}/save`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject unsave of book that isn't saved", async () => {
      const anotherBook = await createTestBook({
        source: "test",
        sourceId: "another-book",
      });

      const response = await agent1.delete(`/api/books/${anotherBook._id}/save`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/books/saved", () => {
    beforeEach(async () => {
      await agent1.post(`/api/books/${testBook._id}/save`);

      const book2 = await createTestBook({
        source: "test",
        sourceId: "book2",
      });

      await agent1.post(`/api/books/${book2._id}/save`);
    });

    it("should return saved books for authenticated user", async () => {
      const response = await agent1.get("/api/books/saved");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it("should reject request without authentication", async () => {
      const response = await request(app).get("/api/books/saved");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should only return user-specific saved books", async () => {
      const response = await agent2.get("/api/books/saved");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(0);
    });

    it("should isolate saved books between users", async () => {
      const user1Response = await agent1.get("/api/books/saved");
      expect(user1Response.body.data.length).toBe(2);

      const user2Response = await agent2.get("/api/books/saved");
      expect(user2Response.body.data.length).toBe(0);

      await agent2.post(`/api/books/${testBook._id}/save`);

      const user2Updated = await agent2.get("/api/books/saved");
      expect(user2Updated.body.data.length).toBe(1);
    });
  });
});
