const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/books/search?q=harry',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('RESPONSE:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('RESPONSE (raw):', data);
    }
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`PROBLEM WITH REQUEST: ${e.message}`);
  process.exit(1);
});

setTimeout(() => {
  console.error('Request timeout');
  process.exit(1);
}, 10000);

req.end();
