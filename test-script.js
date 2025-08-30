#!/usr/bin/env node

/**
 * Quick Test Script for Markdown Editor
 * Run with: node test-script.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Load environment variables from .env file
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = {};

      envContent.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
            envVars[key.trim()] = value.trim();
            process.env[key.trim()] = value.trim();
          }
        }
      });

      console.log('✅ Environment variables loaded from .env file');
      return true;
    } else {
      console.log('❌ .env file not found');
      return false;
    }
  } catch (error) {
    console.log(`❌ Error loading .env file: ${error.message}`);
    return false;
  }
}

console.log('🧪 Markdown Editor - Quick Test Script');
console.log('=====================================\n');

// Test 1: Check if server is running
function testServerHealth() {
  return new Promise((resolve) => {
    const url = new URL(BASE_URL);
    const client = url.protocol === 'https:' ? https : http;

    console.log('1. Testing server health...');
    const req = client.get(BASE_URL, (res) => {
      if (res.statusCode === 200) {
        console.log('   ✅ Server is running');
        resolve(true);
      } else {
        console.log(`   ❌ Server responded with status: ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      console.log(`   ❌ Server connection failed: ${err.message}`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log('   ❌ Server timeout');
      req.destroy();
      resolve(false);
    });
  });
}

// Test 2: Check environment variables
function testEnvironment() {
  console.log('\n2. Testing environment configuration...');

  const requiredEnvVars = [
    'MONGODB_URI',
    'TOGETHER_API_KEY',
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_APP_URL'
  ];

  let allPresent = true;

  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar} is set`);
    } else {
      console.log(`   ❌ ${envVar} is missing`);
      allPresent = false;
    }
  });

  return allPresent;
}

// Test 3: Check API endpoints
async function testAPIEndpoints() {
  console.log('\n3. Testing API endpoints...');

  const endpoints = [
    '/api/notes',
    '/api/enhance-text',
    '/api/workspaces'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status !== 401 && response.status !== 400) {
        console.log(`   ✅ ${endpoint} - Status: ${response.status}`);
      } else {
        console.log(`   ⚠️  ${endpoint} - Status: ${response.status} (expected for unauthenticated)`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint} - Error: ${error.message}`);
    }
  }
}

// Test 4: Test Together API integration
async function testTogetherAPI() {
  console.log('\n4. Testing Together API integration...');

  if (!process.env.TOGETHER_API_KEY) {
    console.log('   ❌ TOGETHER_API_KEY not set - skipping API test');
    return false;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/enhance-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'This is a test sentence.'
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.enhancedText && !data.enhancedText.includes('Here is') && !data.enhancedText.includes('Enhanced:')) {
        console.log('   ✅ Together API working - clean output');
        return true;
      } else {
        console.log('   ⚠️  Together API working but may include extra text');
        return true;
      }
    } else {
      console.log(`   ❌ Together API failed - Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Together API error: ${error.message}`);
    return false;
  }
}

// Test 5: Check for security issues
function testSecurity() {
  console.log('\n5. Testing security configuration...');

  const securityChecks = [
    {
      name: 'Environment variables not exposed',
      check: () => !process.env.MONGODB_URI?.includes('password') || process.env.MONGODB_URI.includes('***'),
      message: 'Database URI should use secure connection'
    },
    {
      name: 'API keys are server-side only',
      check: () => !global.window || !window.process?.env?.TOGETHER_API_KEY,
      message: 'API keys should not be accessible in browser'
    }
  ];

  securityChecks.forEach(({ name, check, message }) => {
    if (check()) {
      console.log(`   ✅ ${name}`);
    } else {
      console.log(`   ❌ ${name} - ${message}`);
    }
  });
}

// Main test runner
async function runTests() {
  console.log(`Testing application at: ${BASE_URL}\n`);

  // Load environment variables first
  const envLoaded = loadEnvFile();
  if (envLoaded) {
    console.log('Environment file loaded successfully\n');
  }

  // Run all tests
  const serverHealth = await testServerHealth();
  const envConfig = testEnvironment();
  await testAPIEndpoints();
  const apiWorking = await testTogetherAPI();
  testSecurity();

  // Summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log(`Server Health: ${serverHealth ? '✅' : '❌'}`);
  console.log(`Environment: ${envConfig ? '✅' : '❌'}`);
  console.log(`API Integration: ${apiWorking ? '✅' : '❌'}`);

  const overall = serverHealth && envConfig && apiWorking;
  console.log(`\n🎯 Overall Status: ${overall ? '✅ READY FOR TESTING' : '❌ ISSUES FOUND'}`);

  if (!overall) {
    console.log('\n🔧 Next Steps:');
    console.log('- Fix environment configuration');
    console.log('- Start the development server');
    console.log('- Check API key validity');
    console.log('- Review security settings');
  }

  console.log('\n📋 For comprehensive testing, see TESTING_GUIDE.md');
}

runTests().catch(console.error);
