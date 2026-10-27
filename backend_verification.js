const http = require('http');

const BASE_URL = 'http://localhost:5000';
let authToken = null;
let userId = null;
let bookId = null;
let savedBookId = null;

const tests = [];
const results = [];

// Helper function for making HTTP requests
function makeRequest(method, path, body = null, useAuth = false) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (useAuth && authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
      options.headers['Cookie'] = `token=${authToken}`;
    }

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data),
            headers: res.headers,
          });
        } catch {
          resolve({
            status: res.statusCode,
            data: data || 'No response body',
            headers: res.headers,
          });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ status: 0, error: e.message });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function test(name, method, path, body = null, useAuth = false, expectedStatus = null) {
  const result = await makeRequest(method, path, body, useAuth);
  const pass = expectedStatus ? result.status === expectedStatus : result.status >= 200 && result.status < 300;
  tests.push({ name, pass, status: result.status, data: result.data });
  console.log(`${pass ? '✓' : '✗'} ${name} (${result.status})`);
  return result;
}

async function runTests() {
  console.log('\n=== BIBLIOVERSE BACKEND VERIFICATION ===\n');

  // 1. HEALTH CHECK
  console.log('--- Health Check ---');
  await test('Health endpoint', 'GET', '/api/health', null, false, 200);

  // 2. AUTHENTICATION
  console.log('\n--- Authentication ---');
  
  const registerRes = await test('Register user', 'POST', '/api/auth/register', {
    name: 'Test User',
    email: `testuser_${Date.now()}@test.com`,
    password: 'Test@123456',
  }, false, 201);

  if (registerRes.data?.success) {
    userId = registerRes.data.data?.userId;
    console.log(`  → User ID: ${userId}`);
  }

  const loginRes = await test('Login user', 'POST', '/api/auth/login', {
    email: registerRes.data?.data?.email || `testuser_${Date.now() - 1000}@test.com`,
    password: 'Test@123456',
  }, false, 200);

  if (loginRes.data?.success && loginRes.headers['set-cookie']) {
    const cookieMatch = loginRes.headers['set-cookie'][0].match(/token=([^;]+)/);
    if (cookieMatch) {
      authToken = cookieMatch[1];
      console.log(`  → Auth token obtained`);
    }
  }

  await test('Get current user', 'GET', '/api/auth/me', null, true, 200);

  // 3. BOOKS - SEARCH
  console.log('\n--- Books - Search ---');
  const searchRes = await test('Search books', 'GET', '/api/books/search?q=harry', null, false, 200);
  if (searchRes.data?.data?.length > 0) {
    bookId = searchRes.data.data[0]._id;
    console.log(`  → Found ${searchRes.data.data.length} books, using ID: ${bookId}`);
  }

  // 4. BOOKS - GET BY ID
  console.log('\n--- Books - Get By ID ---');
  if (bookId) {
    await test('Get book by ID', 'GET', `/api/books/${bookId}`, null, false, 200);
  }

  // 5. BOOKS - DISCOVER
  console.log('\n--- Books - Discover ---');
  await test('Discover books', 'GET', '/api/books/discover', null, false, 200);

  // 6. BOOKS - SAVE/UNSAVE
  console.log('\n--- Books - Save/Unsave ---');
  if (bookId && authToken) {
    const saveRes = await test('Save book', 'POST', `/api/books/${bookId}/save`, {}, true, 201);
    if (saveRes.data?.success) {
      savedBookId = bookId;
      console.log(`  → Book saved`);
    }
  }

  // 7. LIBRARY
  console.log('\n--- Library ---');
  const libraryRes = await test('Get library', 'GET', '/api/books/library', null, true, 200);
  if (libraryRes.data?.data?.length > 0) {
    console.log(`  → Library contains ${libraryRes.data.data.length} books`);
  }

  // 8. READING STATUS
  console.log('\n--- Reading Status ---');
  if (bookId && authToken) {
    await test('Update reading status', 'PATCH', `/api/books/${bookId}/status`, {
      status: 'reading',
    }, true, 200);
  }

  // 9. REVIEWS
  console.log('\n--- Reviews ---');
  if (bookId && authToken) {
    const reviewRes = await test('Create review', 'POST', `/api/books/${bookId}/reviews`, {
      rating: 5,
      text: 'Amazing book! Highly recommend.',
    }, true, 201);
    console.log(`  → Review status: ${reviewRes.data?.success ? 'Created' : 'Failed'}`);
  }

  if (bookId) {
    const reviewsRes = await test('Get book reviews', 'GET', `/api/books/${bookId}/reviews`, null, false, 200);
    if (reviewsRes.data?.data?.length > 0) {
      console.log(`  → Book has ${reviewsRes.data.data.length} review(s)`);
    }
  }

  // 10. LOGOUT
  console.log('\n--- Logout ---');
  if (authToken) {
    await test('Logout', 'POST', '/api/auth/logout', {}, true, 200);
  }

  // SUMMARY
  console.log('\n=== VERIFICATION SUMMARY ===\n');
  const passed = tests.filter(t => t.pass).length;
  const total = tests.length;
  console.log(`Passed: ${passed}/${total}`);
  console.log(`\nDetailed Results:`);
  tests.forEach(t => {
    console.log(`${t.pass ? '✓' : '✗'} ${t.name} (${t.status})`);
  });
}

// Wait for server to be ready, then run tests
setTimeout(runTests, 1000);
