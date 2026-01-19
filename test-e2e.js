/**
 * Simple E2E Test - Authentication Flow
 * Tests basic API connectivity and authentication
 */

const http = require('http');

// Test configuration
const API_HOST = 'localhost';
const API_PORT = 3000;

console.log('🧪 Starting E2E Test...\n');

// Helper function to make HTTP requests
function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Test 1: Health check
async function testHealthCheck() {
  console.log('✓ Test 1: API Health Check');
  const options = {
    hostname: API_HOST,
    port: API_PORT,
    path: '/api',
    method: 'GET',
  };
  
  try {
    const result = await makeRequest(options);
    if (result.status === 200 || result.status === 404) {
      console.log('  ✅ API is running\n');
      return true;
    }
  } catch (e) {
    console.log('  ❌ API is not running. Start servers first: npm run serve:all\n');
    return false;
  }
}

// Test 2: Login authentication
async function testLogin() {
  console.log('✓ Test 2: Login Authentication');
  const options = {
    hostname: API_HOST,
    port: API_PORT,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const credentials = {
    email: 'owner@turbovets.com',
    password: 'Password123!'
  };
  
  try {
    const result = await makeRequest(options, credentials);
    if (result.status === 201 && result.data.access_token) {
      console.log('  ✅ Login successful');
      console.log(`  ✅ JWT token received: ${result.data.access_token.substring(0, 20)}...`);
      console.log(`  ✅ User: ${result.data.user.email}\n`);
      return true;
    } else {
      console.log('  ❌ Login failed:', result.data);
      return false;
    }
  } catch (e) {
    console.log('  ❌ Login error:', e.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('⚠️  Please start the servers first: npm run serve:all');
    process.exit(1);
  }
  
  const loginOk = await testLogin();
  
  if (loginOk) {
    console.log('✅ All E2E tests passed!\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed\n');
    process.exit(1);
  }
}

runTests();
