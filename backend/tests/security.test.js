require("dotenv").config({ path: ".env.test" });
const request = require("supertest");
const app = require("../app");
const { connectTestDB, disconnectTestDB, clearDatabase } = require("./setup");

describe("Health, Error Handling, and Security Tests", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe("Health Check", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/api/health");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("running");
    });

    it("should be publicly accessible", async () => {
      // No authentication required
      const response = await request(app).get("/api/health");

      expect(response.status).toBe(200);
    });
  });

  describe("404 Error Handling", () => {
    it("should return 404 for unknown route", async () => {
      const response = await request(app).get("/api/unknown-route");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });

    it("should use error response structure for 404", async () => {
      const response = await request(app).get("/api/this-does-not-exist");

      expect(response.body).toHaveProperty("success");
      expect(response.body).toHaveProperty("message");
    });
  });

  describe("Security Headers", () => {
    it("should include security headers from Helmet", async () => {
      const response = await request(app).get("/api/health");

      // Check for common Helmet headers
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBeDefined();
    });

    it("should have CSP header", async () => {
      const response = await request(app).get("/api/health");

      expect(response.headers["content-security-policy"]).toBeDefined();
    });
  });

  describe("Authentication Requirements", () => {
    it("should reject POST /api/books without auth", async () => {
      const response = await request(app)
        .post("/api/books")
        .send({
          title: "Test",
          source: "test",
          sourceId: "test-1",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject GET /api/auth/me without auth", async () => {
      const response = await request(app).get("/api/auth/me");

      expect(response.status).toBe(401);
    });

    it("should reject POST /api/books/:id/save without auth", async () => {
      const response = await request(app)
        .post("/api/books/000000000000000000000000/save");

      expect(response.status).toBe(401);
    });

    it("should reject GET /api/books/library without auth", async () => {
      const response = await request(app).get("/api/books/library");

      expect(response.status).toBe(401);
    });
  });

  describe("Request Body Limits", () => {
    it("should reject overly large payloads", async () => {
      // Create a payload larger than 1MB
      const largePayload = JSON.stringify({
        name: "a".repeat(2000000),
        email: "test@example.com",
        password: "Password123!",
      });

      const response = await request(app)
        .post("/api/auth/register")
        .set("Content-Type", "application/json")
        .send(JSON.parse(largePayload));

      // May be 413 (Payload Too Large) or other error
      expect([400, 413, 500]).toContain(response.status);
    });
  });

  describe("CORS Configuration", () => {
    it("should allow requests with appropriate origin", async () => {
      const response = await request(app)
        .get("/api/health")
        .set("Origin", "http://localhost:5173");

      expect(response.status).toBe(200);
    });

    it("should include CORS headers", async () => {
      const response = await request(app)
        .get("/api/health")
        .set("Origin", "http://localhost:5173");

      expect(response.headers["access-control-allow-credentials"]).toBeDefined();
    });
  });

  describe("Swagger Regression", () => {
    it("should load Swagger UI", async () => {
      const response = await request(app).get("/api-docs/");

      expect(response.status).toBe(200);
      expect(response.text).toContain("Swagger");
    });

    it("should not expose secrets in documentation", async () => {
      const response = await request(app).get("/api-docs/");

      expect(response.text).not.toContain("JWT_SECRET");
      expect(response.text).not.toContain("MONGO_URI");
      expect(response.text).not.toContain("GOOGLE_BOOKS_API_KEY");
    });
  });

  describe("Rate Limiting", () => {
    it("should have rate limiting configured", async () => {
      // Make a request to verify the middleware is active
      const response = await request(app).get("/api/health");

      // Should have rate limit headers
      expect(
        response.headers["ratelimit-limit"] ||
        response.headers["x-ratelimit-limit"]
      ).toBeDefined();
    });
  });

  describe("Error Response Format", () => {
    it("should use consistent error response format", async () => {
      const response = await request(app).get("/api/unknown");

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message");
      expect(typeof response.body.message).toBe("string");
    });

    it("should not expose stack traces in error responses", async () => {
      // Try to trigger an error
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          // Invalid/missing data
        });

      expect(response.body).not.toHaveProperty("stack");
      expect(JSON.stringify(response.body)).not.toContain("at ");
    });
  });
});
