require("dotenv").config({ path: ".env.test" });
const request = require("supertest");
const app = require("../app");
const Review = require("../models/Review");
const Book = require("../models/Book");
const { connectTestDB, disconnectTestDB, clearDatabase, createTestBook } = require("./setup");

const registerAndLogin = async ({ name, email, password }) => {
  const agent = request.agent(app);
  await agent.post("/api/auth/register").send({ name, email, password });
  await agent.post("/api/auth/login").send({ email, password });
  return agent;
};

describe("Review Endpoints", () => {
  let user1Agent;
  let user2Agent;
  let testBook;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    user1Agent = await registerAndLogin({
      name: "Reviewer One",
      email: "reviewer1@example.com",
      password: "Password123!",
    });

    user2Agent = await registerAndLogin({
      name: "Reviewer Two",
      email: "reviewer2@example.com",
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

  describe("POST /api/books/:id/reviews", () => {
    it("should create a review with authenticated user", async () => {
      const response = await user1Agent.post(`/api/books/${testBook._id}/reviews`).send({
        rating: 5,
        comment: "Excellent book!",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("rating", 5);
      expect(response.body.data).toHaveProperty("comment", "Excellent book!");

      const book = await Book.findById(testBook._id);
      expect(book.ratingsCount).toBe(1);
      expect(book.averageRating).toBe(5);
    });

    it("should reject review without authentication", async () => {
      const response = await request(app).post(`/api/books/${testBook._id}/reviews`).send({
        rating: 5,
        comment: "Great!",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject review with rating below 1", async () => {
      const response = await user1Agent.post(`/api/books/${testBook._id}/reviews`).send({
        rating: 0,
        comment: "Bad",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("between 1 and 5");
    });

    it("should reject review with rating above 5", async () => {
      const response = await user1Agent.post(`/api/books/${testBook._id}/reviews`).send({
        rating: 6,
        comment: "Amazing",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject non-numeric rating", async () => {
      const response = await user1Agent.post(`/api/books/${testBook._id}/reviews`).send({
        rating: "five",
        comment: "Great",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject duplicate review from same user", async () => {
      await user1Agent.post(`/api/books/${testBook._id}/reviews`).send({
        rating: 5,
        comment: "Good",
      });

      const response = await user1Agent.post(`/api/books/${testBook._id}/reviews`).send({
        rating: 4,
        comment: "Actually not as good",
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("already reviewed");
    });

    it("should allow multiple reviews from different users", async () => {
      await user1Agent.post(`/api/books/${testBook._id}/reviews`).send({
        rating: 5,
        comment: "User 1 review",
      });

      const response = await user2Agent.post(`/api/books/${testBook._id}/reviews`).send({
        rating: 3,
        comment: "User 2 review",
      });

      expect(response.status).toBe(201);

      const book = await Book.findById(testBook._id);
      expect(book.ratingsCount).toBe(2);
      expect(book.averageRating).toBe(4);
    });
  });

  describe("GET /api/books/:id/reviews", () => {
    beforeEach(async () => {
      await user1Agent.post(`/api/books/${testBook._id}/reviews`).send({
        rating: 5,
        comment: "Excellent!",
      });

      await user2Agent.post(`/api/books/${testBook._id}/reviews`).send({
        rating: 3,
        comment: "Average",
      });
    });

    it("should return all reviews for a book", async () => {
      const response = await request(app).get(`/api/books/${testBook._id}/reviews`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it("should not require authentication to view reviews", async () => {
      const response = await request(app).get(`/api/books/${testBook._id}/reviews`);

      expect(response.status).toBe(200);
    });

    it("should return nonexistent book error", async () => {
      const fakeId = "000000000000000000000000";
      const response = await request(app).get(`/api/books/${fakeId}/reviews`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/books/:id/reviews", () => {
    beforeEach(async () => {
      await user1Agent.post(`/api/books/${testBook._id}/reviews`).send({
        rating: 5,
        comment: "Initially loved it",
      });
    });

    it("should update user's review", async () => {
      const response = await user1Agent.put(`/api/books/${testBook._id}/reviews`).send({
        rating: 3,
        comment: "Changed my mind",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("rating", 3);

      const book = await Book.findById(testBook._id);
      expect(book.averageRating).toBe(3);
    });

    it("should reject update without authentication", async () => {
      const response = await request(app).put(`/api/books/${testBook._id}/reviews`).send({
        rating: 4,
        comment: "New comment",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject update with invalid rating", async () => {
      const response = await user1Agent.put(`/api/books/${testBook._id}/reviews`).send({
        rating: 10,
        comment: "Invalid",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject update if user hasn't reviewed", async () => {
      const response = await user2Agent.put(`/api/books/${testBook._id}/reviews`).send({
        rating: 4,
        comment: "Trying to update non-existent review",
      });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/books/:id/reviews", () => {
    beforeEach(async () => {
      await user1Agent.post(`/api/books/${testBook._id}/reviews`).send({
        rating: 5,
        comment: "Great book",
      });
    });

    it("should delete user's review", async () => {
      const response = await user1Agent.delete(`/api/books/${testBook._id}/reviews`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const book = await Book.findById(testBook._id);
      expect(book.ratingsCount).toBe(0);
      expect(book.averageRating).toBe(0);

      const reviews = await Review.find({ book: testBook._id });
      expect(reviews.length).toBe(0);
    });

    it("should reject delete without authentication", async () => {
      const response = await request(app).delete(`/api/books/${testBook._id}/reviews`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject delete if user hasn't reviewed", async () => {
      const response = await user2Agent.delete(`/api/books/${testBook._id}/reviews`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
