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

describe("Library Endpoints", () => {
  let user1Agent;
  let user2Agent;
  let testBook1;
  let testBook2;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    user1Agent = await registerAndLogin({
      name: "Library User One",
      email: "libuser1@example.com",
      password: "Password123!",
    });

    user2Agent = await registerAndLogin({
      name: "Library User Two",
      email: "libuser2@example.com",
      password: "Password123!",
    });

    testBook1 = await createTestBook({
      source: "test",
      sourceId: "libbook-1",
    });

    testBook2 = await createTestBook({
      source: "test",
      sourceId: "libbook-2",
    });
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe("GET /api/books/library", () => {
    beforeEach(async () => {
      await user1Agent.post(`/api/books/${testBook1._id}/save`);
      await user1Agent.patch(`/api/books/${testBook1._id}/status`).send({ status: "reading" });
      await user1Agent.post(`/api/books/${testBook2._id}/save`);
      await user1Agent.patch(`/api/books/${testBook2._id}/status`).send({ status: "finished" });
    });

    it("should return user's library", async () => {
      const response = await user1Agent.get("/api/books/library");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty("book");
      expect(response.body.data[0]).toHaveProperty("status");
      expect(response.body.data[0]).toHaveProperty("savedAt");
    });

    it("should filter by reading status", async () => {
      const response = await user1Agent.get("/api/books/library?status=reading");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].status).toBe("reading");
    });

    it("should filter by finished status", async () => {
      const response = await user1Agent.get("/api/books/library?status=finished");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].status).toBe("finished");
    });

    it("should filter by want_to_read status", async () => {
      const response = await user1Agent.get("/api/books/library?status=want_to_read");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(0);
    });

    it("should reject invalid status filter", async () => {
      const response = await user1Agent.get("/api/books/library?status=invalid");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated request", async () => {
      const response = await request(app).get("/api/books/library");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should isolate libraries between users", async () => {
      const user1Response = await user1Agent.get("/api/books/library");
      expect(user1Response.body.data.length).toBe(2);

      const user2Response = await user2Agent.get("/api/books/library");
      expect(user2Response.body.data.length).toBe(0);
    });
  });

  describe("PATCH /api/books/:id/status", () => {
    beforeEach(async () => {
      await user1Agent.post(`/api/books/${testBook1._id}/save`);
    });

    it("should update reading status", async () => {
      const response = await user1Agent.patch(`/api/books/${testBook1._id}/status`).send({ status: "reading" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("reading");

      const savedBook = await SavedBook.findOne({
        book: testBook1._id,
      });
      expect(savedBook.status).toBe("reading");
    });

    it("should update to finished status", async () => {
      const response = await user1Agent.patch(`/api/books/${testBook1._id}/status`).send({ status: "finished" });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("finished");
    });

    it("should update to want_to_read status", async () => {
      await user1Agent.patch(`/api/books/${testBook1._id}/status`).send({ status: "reading" });

      const response = await user1Agent.patch(`/api/books/${testBook1._id}/status`).send({ status: "want_to_read" });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("want_to_read");
    });

    it("should reject invalid status", async () => {
      const response = await user1Agent.patch(`/api/books/${testBook1._id}/status`).send({ status: "invalid" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated request", async () => {
      const response = await request(app).patch(`/api/books/${testBook1._id}/status`).send({ status: "reading" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject update for book not in library", async () => {
      const unsavedBook = await createTestBook({
        source: "test",
        sourceId: "unsaved-book",
      });

      const response = await user1Agent.patch(`/api/books/${unsavedBook._id}/status`).send({ status: "reading" });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("not in your library");
    });

    it("should reject invalid book ID", async () => {
      const response = await user1Agent.patch("/api/books/invalid-id/status").send({ status: "reading" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should isolate status changes between users", async () => {
      await user1Agent.patch(`/api/books/${testBook1._id}/status`).send({ status: "reading" });
      await user2Agent.post(`/api/books/${testBook1._id}/save`);

      const user2Library = await user2Agent.get("/api/books/library");
      expect(user2Library.body.data[0].status).toBe("want_to_read");

      const user1Library = await user1Agent.get("/api/books/library");
      expect(user1Library.body.data[0].status).toBe("reading");
    });
  });
});
