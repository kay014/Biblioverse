# Biblioverse Backend

## Purpose
This backend powers the Biblioverse application and handles authentication, book catalog operations, saved books, library tracking, review and rating logic, and health monitoring.

## Stack
- Node.js
- Express
- MongoDB + Mongoose
- JWT via HTTP-only cookie authentication
- Swagger/OpenAPI for API documentation
- Google Books API for external book search

## Project Structure
- `app.js` — Express app setup, middleware, CORS, security, and Swagger UI
- `server.js` — startup and MongoDB connection
- `config/` — MongoDB and environment configuration
- `controllers/` — HTTP request handlers
- `middleware/` — auth and error handling
- `models/` — Mongoose schemas
- `routes/` — API endpoint definition
- `services/` — external API integration helpers

## Environment Variables
Create a `.env` file in the backend directory and set values such as:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/biblioverse
JWT_SECRET=your_secret_here
GOOGLE_BOOKS_API_KEY=your_api_key_here
FRONTEND_URL=http://localhost:5173
```

A template is included in `.env.example`.

## Installation
```bash
npm install
```

## Development Startup
```bash
npm run dev
```

## API Documentation
The Swagger/OpenAPI documentation is available at:

```
http://localhost:5000/api-docs
```

This interactive interface allows you to:
- View all available endpoints
- Review request/response schemas
- Test endpoints directly from the browser
- Understand authentication requirements
- See examples and error responses

The OpenAPI specification follows the 3.0.0 standard and documents all endpoints with:
- HTTP methods and paths
- Required and optional parameters
- Request body schemas
- Success and error responses
- Authentication requirements
- Reusable component definitions

## Authentication Flow
Authentication is cookie-based and uses an HTTP-only `token` cookie. The cookie is set on login and cleared on logout. Protected endpoints rely on the cookie rather than a bearer token header.

## Main API Modules
- Auth: register, login, logout, current user
- Books: list, details, local discovery, Google Books search, create
- Saved Books: save/unsave operations
- Library: reading-status tracking
- Reviews: create, update, read, delete
- Health: application status

## Notes
- The app uses the local MongoDB book collection for discovery and filtering.
- Google Books is used only for `/api/books/search`.
- Environment variables are validated at startup.
