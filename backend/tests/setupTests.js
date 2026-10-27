// Set NODE_ENV to test before any other setup
process.env.NODE_ENV = "test";

// Load test environment variables
require("dotenv").config({ path: ".env.test" });
