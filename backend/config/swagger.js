const swaggerJsdoc = require("swagger-jsdoc");

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Biblioverse API",
    version: "1.0.0",
    description:
      "API documentation for the Biblioverse backend. Authentication uses an HTTP-only cookie named token. Protected endpoints require authentication via an HTTP-only cookie set during login.",
  },
  servers: [
    {
      url: process.env.NODE_ENV === "production" ? process.env.API_URL || "https://api.biblioverse.com" : "http://localhost:5000",
      description: process.env.NODE_ENV === "production" ? "Production server" : "Local development server",
    },
  ],
  tags: [
    { name: "Auth", description: "Registration, login, logout, and current-user retrieval." },
    { name: "Books", description: "Book listing, search, discovery, details, and save operations." },
    { name: "Reviews", description: "Book review creation, update, deletion, and retrieval." },
    { name: "Library", description: "User-specific saved books and reading statuses." },
    { name: "Health", description: "Service health checks." },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "64bde1b6ee1d7c6f64dba234" },
          name: { type: "string", example: "Jane Doe" },
          email: { type: "string", format: "email", example: "jane@example.com" },
          profileImage: { type: ["string", "null"], nullable: true, example: null },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Book: {
        type: "object",
        properties: {
          _id: { type: "string", example: "64bde1b6ee1d7c6f64dba234" },
          title: { type: "string", example: "Harry Potter and the Philosopher Stone" },
          authors: { type: "array", items: { type: "string" }, example: ["J.K. Rowling"] },
          description: { type: "string", example: "The first magical adventure." },
          coverImage: { type: ["string", "null"], nullable: true, example: "https://example.com/hp1.jpg" },
          isbn: { type: ["string", "null"], nullable: true, example: "9780000000004" },
          publishedDate: { type: ["string", "null"], nullable: true, example: "1997" },
          categories: { type: "array", items: { type: "string" }, example: ["Fantasy", "Adventure"] },
          pageCount: { type: ["integer", "null"], nullable: true, example: 223 },
          language: { type: ["string", "null"], nullable: true, example: "en" },
          averageRating: { type: "number", example: 4.8 },
          ratingsCount: { type: "integer", example: 120 },
          source: { type: "string", example: "phase16" },
          sourceId: { type: "string", example: "hp-1" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Review: {
        type: "object",
        properties: {
          _id: { type: "string", example: "64bde1b6ee1d7c6f64dba234" },
          user: { type: "string", example: "64bde1b6ee1d7c6f64dba234" },
          book: { type: "string", example: "64bde1b6ee1d7c6f64dba234" },
          rating: { type: "number", example: 5, minimum: 1, maximum: 5 },
          comment: { type: "string", example: "Loved it." },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      SavedBook: {
        type: "object",
        properties: {
          _id: { type: "string", example: "64bde1b6ee1d7c6f64dba234" },
          user: { type: "string", example: "64bde1b6ee1d7c6f64dba234" },
          book: { type: "string", example: "64bde1b6ee1d7c6f64dba234" },
          status: {
            type: "string",
            enum: ["want_to_read", "reading", "finished"],
            example: "want_to_read",
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      LibraryItem: {
        type: "object",
        properties: {
          book: { $ref: "#/components/schemas/Book" },
          status: {
            type: "string",
            enum: ["want_to_read", "reading", "finished"],
            example: "reading",
          },
          savedAt: { type: "string", format: "date-time" },
        },
      },
      PaginationMetadata: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
          totalBooks: { type: "integer", example: 9 },
          totalPages: { type: "integer", example: 1 },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Request failed" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Jane Doe" },
          email: { type: "string", format: "email", example: "jane@example.com" },
          password: { type: "string", format: "password", example: "Password123!" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "jane@example.com" },
          password: { type: "string", format: "password", example: "Password123!" },
        },
      },
      BookCreateRequest: {
        type: "object",
        required: ["title", "source", "sourceId"],
        properties: {
          title: { type: "string", example: "The Hobbit" },
          authors: { type: "array", items: { type: "string" }, example: ["J.R.R. Tolkien"] },
          description: { type: "string", example: "A fantasy adventure story." },
          coverImage: { type: ["string", "null"], example: "https://example.com/hobbit.jpg" },
          isbn: { type: ["string", "null"], example: "9780000000005" },
          publishedDate: { type: ["string", "null"], example: "1937" },
          categories: { type: "array", items: { type: "string" }, example: ["Fantasy"] },
          pageCount: { type: ["integer", "null"], example: 310 },
          language: { type: ["string", "null"], example: "en" },
          source: { type: "string", example: "manual" },
          sourceId: { type: "string", example: "custom-001" },
        },
      },
      ReviewRequest: {
        type: "object",
        required: ["rating"],
        properties: {
          rating: { type: "number", minimum: 1, maximum: 5, example: 5 },
          comment: { type: "string", example: "Loved it." },
        },
      },
      ReadingStatusUpdate: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: ["want_to_read", "reading", "finished"],
            example: "finished",
          },
        },
      },
    },
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Check backend health",
        responses: {
          200: {
            description: "Application is running",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Biblioverse API is running" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "User registered successfully" },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          409: {
            description: "User already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in a user and set the auth cookie",
        description:
          "Authenticates a user and sets the HTTP-only `token` cookie used by protected routes.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Login successful" },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out the current user",
        description: "Clears the existing authentication cookie.",
        responses: {
          200: {
            description: "Logout successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Logged out successfully" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get the authenticated user",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Current user fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Current user fetched successfully" },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/books": {
      get: {
        tags: ["Books"],
        summary: "List books with pagination",
        parameters: [
          {
            in: "query",
            name: "page",
            schema: { type: "integer", minimum: 1, default: 1 },
            description: "Page number. Default is 1.",
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
            description: "Books per page. Default is 20 and max is 50.",
          },
        ],
        responses: {
          200: {
            description: "Paginated list of books",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Book" },
                    },
                    pagination: { $ref: "#/components/schemas/PaginationMetadata" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
        },
      },
      post: {
        tags: ["Books"],
        summary: "Create a book record",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BookCreateRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Book created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Book created successfully" },
                    data: { $ref: "#/components/schemas/Book" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          409: {
            description: "Book already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/books/discover": {
      get: {
        tags: ["Books"],
        summary: "Discover books from the local MongoDB collection",
        description:
          "Filters and sorts books stored in the local database. This endpoint does not call Google Books.",
        parameters: [
          {
            in: "query",
            name: "q",
            schema: { type: "string" },
            description: "Case-insensitive search across title, authors, and description.",
          },
          {
            in: "query",
            name: "author",
            schema: { type: "string" },
            description: "Case-insensitive author filter.",
          },
          {
            in: "query",
            name: "category",
            schema: { type: "string" },
            description: "Case-insensitive category filter.",
          },
          {
            in: "query",
            name: "language",
            schema: { type: "string" },
            description: "Case-insensitive language filter.",
          },
          {
            in: "query",
            name: "minRating",
            schema: { type: "number", minimum: 0, maximum: 5 },
            description: "Minimum average rating from 0 to 5.",
          },
          {
            in: "query",
            name: "sort",
            schema: { type: "string", enum: ["rating", "newest", "title"] },
            description: "Allowed sort values: rating, newest, title.",
          },
          {
            in: "query",
            name: "page",
            schema: { type: "integer", minimum: 1, default: 1 },
            description: "Page number.",
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
            description: "Results per page.",
          },
        ],
        responses: {
          200: {
            description: "Filtered and paginated local book results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Book" },
                    },
                    pagination: { $ref: "#/components/schemas/PaginationMetadata" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/api/books/search": {
      get: {
        tags: ["Books"],
        summary: "Search books through the Google Books API",
        description:
          "Uses the external Google Books API. The local database is updated with any returned books.",
        parameters: [
          {
            in: "query",
            name: "q",
            required: true,
            schema: { type: "string" },
            description: "Search query string.",
          },
        ],
        responses: {
          200: {
            description: "Books returned and stored locally",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Books fetched and stored successfully" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Book" },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing or empty search query",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          502: {
            description: "External Google Books fetch failed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string", example: "Failed to fetch books from external source" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/books/{id}": {
      get: {
        tags: ["Books"],
        summary: "Get a specific book by ID",
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
            description: "MongoDB Book ID.",
          },
        ],
        responses: {
          200: {
            description: "Single book",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Book" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/books/{id}/save": {
      post: {
        tags: ["Books"],
        summary: "Save a book for the authenticated user",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
            description: "Book ID to save.",
          },
        ],
        responses: {
          201: {
            description: "Book saved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Book saved successfully" },
                    data: { $ref: "#/components/schemas/SavedBook" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
          409: {
            description: "Book already saved",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Books"],
        summary: "Remove a saved book",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
            description: "Book ID to unsave.",
          },
        ],
        responses: {
          200: {
            description: "Book removed from saved books",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Book removed from saved books" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/books/saved": {
      get: {
        tags: ["Books"],
        summary: "Get the authenticated user's saved books",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "List of saved books",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Book" },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/books/library": {
      get: {
        tags: ["Library"],
        summary: "Get the authenticated user's library with statuses",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "status",
            schema: { type: "string", enum: ["want_to_read", "reading", "finished"] },
            description: "Optional status filter for the library.",
          },
        ],
        responses: {
          200: {
            description: "User library items",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/LibraryItem" },
                    },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/books/{id}/status": {
      patch: {
        tags: ["Library"],
        summary: "Update a saved book reading status",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
            description: "Book ID in the user's library.",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReadingStatusUpdate" },
            },
          },
        },
        responses: {
          200: {
            description: "Reading status updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Reading status updated successfully" },
                    data: {
                      type: "object",
                      properties: {
                        book: { $ref: "#/components/schemas/Book" },
                        status: {
                          type: "string",
                          enum: ["want_to_read", "reading", "finished"],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/books/{id}/reviews": {
      post: {
        tags: ["Reviews"],
        summary: "Create a review for a book",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
            description: "Book ID.",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReviewRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Review created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Review created successfully" },
                    data: { $ref: "#/components/schemas/Review" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
          409: {
            description: "Duplicate review. One review per authenticated user per book.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      get: {
        tags: ["Reviews"],
        summary: "Get reviews for a book",
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
            description: "Book ID.",
          },
        ],
        responses: {
          200: {
            description: "Reviews for the specified book",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Review" },
                    },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      put: {
        tags: ["Reviews"],
        summary: "Update the authenticated user's review for a book",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
            description: "Book ID.",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReviewRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Review updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Review updated successfully" },
                    data: { $ref: "#/components/schemas/Review" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Reviews"],
        summary: "Delete the authenticated user's review for a book",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
            description: "Book ID.",
          },
        ],
        responses: {
          200: {
            description: "Review deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Review deleted successfully" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
  },
  responses: {
    BadRequest: {
      description: "Validation or request error",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ErrorResponse" },
        },
      },
    },
    Unauthorized: {
      description: "Authentication required or invalid token",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ErrorResponse" },
        },
      },
    },
    NotFound: {
      description: "Resource not found",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ErrorResponse" },
        },
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: [],
};

module.exports = swaggerJsdoc(options);
