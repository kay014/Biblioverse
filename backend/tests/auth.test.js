require("dotenv").config({ path: ".env.test" });
const request = require("supertest");
const app = require("../app");
const User = require("../models/User");
const { connectTestDB, disconnectTestDB, clearDatabase } = require("./setup");

describe("Auth Endpoints", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Jane Doe",
          email: "jane@example.com",
          password: "Password123!",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("name", "Jane Doe");
      expect(response.body.data).toHaveProperty("email", "jane@example.com");
      expect(response.body.data).not.toHaveProperty("password");

      const user = await User.findOne({ email: "jane@example.com" });
      expect(user).toBeTruthy();
    });

    it("should reject registration without name", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          email: "test@example.com",
          password: "Password123!",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("required");
    });

    it("should reject registration without email", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          password: "Password123!",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject registration without password", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "test@example.com",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject registration with short password", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "short",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("at least 8 characters");
    });

    it("should reject duplicate email registration", async () => {
      const firstUser = {
        name: "User One",
        email: "duplicate@example.com",
        password: "Password123!",
      };

      await request(app).post("/api/auth/register").send(firstUser);

      const secondUser = {
        name: "User Two",
        email: "duplicate@example.com",
        password: "DifferentPassword123!",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(secondUser);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("already exists");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Register a user first
      await request(app).post("/api/auth/register").send({
        name: "Login Test User",
        email: "logintest@example.com",
        password: "Password123!",
      });
    });

    it("should login successfully with valid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "logintest@example.com",
          password: "Password123!",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("name");
      expect(response.body.data).toHaveProperty("email", "logintest@example.com");
      expect(response.body.data).not.toHaveProperty("password");
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should reject login with wrong password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "logintest@example.com",
          password: "WrongPassword123!",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject login with nonexistent email", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "Password123!",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject login without email", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          password: "Password123!",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject login without password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "logintest@example.com",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/auth/me", () => {
    let loginResponse;

    beforeEach(async () => {
      // Register and login
      await request(app).post("/api/auth/register").send({
        name: "Me Test User",
        email: "metest@example.com",
        password: "Password123!",
      });

      loginResponse = await request(app).post("/api/auth/login").send({
        email: "metest@example.com",
        password: "Password123!",
      });
    });

    it("should return authenticated user", async () => {
      const cookies = loginResponse.headers["set-cookie"][0];

      const response = await request(app)
        .get("/api/auth/me")
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("name", "Me Test User");
      expect(response.body.data).toHaveProperty("email", "metest@example.com");
      expect(response.body.data).not.toHaveProperty("password");
    });

    it("should reject unauthenticated request", async () => {
      const response = await request(app).get("/api/auth/me");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/logout", () => {
    let loginResponse;

    beforeEach(async () => {
      // Register and login
      await request(app).post("/api/auth/register").send({
        name: "Logout Test User",
        email: "logouttest@example.com",
        password: "Password123!",
      });

      loginResponse = await request(app).post("/api/auth/login").send({
        email: "logouttest@example.com",
        password: "Password123!",
      });
    });

    it("should logout successfully", async () => {
      const cookies = loginResponse.headers["set-cookie"][0];

      const response = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should fail protected endpoint after logout", async () => {
      const cookies = loginResponse.headers["set-cookie"];

      // Logout
      await request(app)
        .post("/api/auth/logout")
        .set("Cookie", cookies);

      // Try to access protected endpoint
      const response = await request(app).get("/api/auth/me").set("Cookie", cookies);

      expect(response.status).toBe(401);
    });
  });
});
