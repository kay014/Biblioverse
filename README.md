# 📚 Biblioverse — Discover, Read & Connect

Biblioverse is a full-stack book discovery and reading-tracker platform designed for readers who want to explore books, organize their reading lists, track their progress, and share their thoughts with a community of book lovers.

Built with React.js, Node.js, Express.js, and MongoDB, Biblioverse combines book discovery, personalized library management, and community reviews in one place.

## ✨ Features

### 📖 Book Discovery
- Discover books across different genres and categories.
- Search for books and explore their details.
- Retrieve book information using the Google Books API.
- Browse curated book collections.

### 👤 Authentication & Security
- User registration and login.
- JWT-based authentication using HTTP-only cookies.
- Protected routes for authenticated users.
- Secure logout and session handling.
- Security headers, CORS configuration, and rate limiting.

### 📚 Personal Library
- Save books to your personal library.
- Organize books by reading status.
- Track books you want to read, are currently reading, or have finished.
- Remove books from your saved collection.

### ⭐ Reviews & Community
- Write reviews and rate books.
- View reviews submitted by readers.
- Update or delete your own reviews.
- Explore books and reviews shared by the community.

### 🛠️ Developer-Friendly Backend
- RESTful API architecture.
- Modular routes, controllers, models, and services.
- Centralized error handling.
- API documentation using Swagger.
- Automated backend tests and Postman API collection.

## 🧰 Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens (JWT), HTTP-only cookies |
| External API | Google Books API |
| Security | Helmet, CORS, rate limiting |
| API Documentation | Swagger / OpenAPI |
| Testing | Jest, Supertest, Postman |
| Version Control | Git, GitHub |

## 📁 Project Structure

```text
Biblioverse/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── tests/
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── routes/
│   │   └── services/
│   ├── package.json
│   └── .env.example
│
├── Biblioverse_Backend_API.postman_collection.json
├── BACKEND_VERIFICATION_REPORT.md
├── FINAL_SUMMARY.md
└── README.md
```

## 🚀 Getting Started

Follow these steps to run Biblioverse locally.

### Prerequisites

Install the following before starting:

- Node.js and npm
- MongoDB running locally or a MongoDB Atlas connection
- Google Books API key
- Git

### 1. Clone the repository

```bash
git clone https://github.com/kay014/Biblioverse.git
cd Biblioverse
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory using `.env.example` as a reference.

Configure your own values:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/biblioverse
JWT_SECRET=your_secure_random_secret
GOOGLE_BOOKS_API_KEY=your_google_books_api_key
FRONTEND_URL=http://localhost:5175
```

Replace the example secrets with your own values. Never commit your actual `.env` file.

Start the backend:

```bash
npm start
```

If the project does not define a start script, use:

```bash
node server.js
```

The backend is configured to run on:

`http://localhost:5000`

### 3. Set up the frontend

Open a second terminal from the project root:

```bash
cd frontend
npm install
```

Create a `.env` file inside the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Vite will display the local URL in the terminal. The configured development port is 5175, if available.

### 4. Open the application

Visit the local URL printed by Vite in your browser.

Ensure MongoDB is running and that the backend and frontend environment variables match your local setup.

## 🔌 API Overview

The backend exposes RESTful endpoints grouped by functionality.

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Retrieve the authenticated user |
| GET | `/api/health` | Check API health |

### Books & Discovery

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/books` | Retrieve books |
| GET | `/api/books/:id` | Retrieve a book by ID |
| GET | `/api/books/search?q=...` | Search for books |
| GET | `/api/books/discover` | Discover books |
| POST | `/api/books` | Create a book |

### Personal Library

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/books/library` | Retrieve the user's library |
| GET | `/api/books/saved` | Retrieve saved books |
| POST | `/api/books/:id/save` | Save a book |
| DELETE | `/api/books/:id/save` | Remove a saved book |
| PATCH | `/api/books/:id/status` | Update reading status |

### Reviews

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/books/:id/reviews` | Create a review |
| GET | `/api/books/:id/reviews` | Retrieve book reviews |
| PUT | `/api/books/:id/reviews` | Update a review |
| DELETE | `/api/books/:id/reviews?bookId=...` | Delete a review |

Authenticated endpoints require a valid user session. Refer to the implementation and API documentation for the exact request formats and validation rules.

## 📑 API Documentation

Swagger documentation is configured at:

`http://localhost:5000/api-docs`

Start the backend first, then open this URL to explore the documented API.

## 🧪 Testing

### Automated backend verification

From the project root:

```bash
node backend_verification.js
```

### Backend test suite

```bash
cd backend
npm test
```

The available tests cover authentication, books, discovery, library operations, reviews, saved books, search, and security.

### Postman

1. Open Postman.
2. Import `Biblioverse_Backend_API.postman_collection.json`.
3. Configure the base URL as `http://localhost:5000`.
4. Run the requests in the appropriate sequence.

The project verification summary dated September 1, 2026, reports that all 17 requests in its verification flow passed. Results may vary with subsequent code changes and the local environment.

## 🔐 Security Notes

- Keep API keys, JWT secrets, database credentials, and cookies out of version control.
- Use `.env` files for local secrets and commit only sanitized `.env.example` files.
- Use a strong, randomly generated JWT secret.
- Configure production CORS origins and secure cookie settings appropriately.
- Never expose private credentials in screenshots, documentation, or public repositories.

## 🎯 Project Goals

Biblioverse was developed to bring together book discovery, reading organization, and community engagement while applying practical full-stack development concepts, including:

- REST API design and integration.
- Authentication and authorization.
- Database modeling and CRUD operations.
- Frontend and backend integration.
- Error handling and API testing.
- Secure configuration and environment management.

## 👩‍💻 Author

**Komal**

Full-Stack Development Project

GitHub: [@kay014](https://github.com/kay014)

---

*Biblioverse — Every book opens a new world.* 📚
