#!/usr/bin/env node

// Test script for v0.3 - JWT Authentication System
const axios = require('axios');

const BASE_URL = 'http://localhost:3003';
let authToken = '';
let refreshToken = '';
let userId = '';

// Test data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'TestPass123'
};

const testTodo = {
  title: 'Test Todo',
  description: 'This is a test todo',
  priority: 'high',
  category: 'testing'
};

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null, useAuth = true) => {
  const config = {
    method,
    url: `${BASE_URL}${url}`,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (useAuth && authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
};

// Test functions
const testHealthCheck = async () => {
  console.log('\n🔍 Testing Health Check...');
  const result = await makeRequest('GET', '/api/health', null, false);
  
  if (result.success && result.data.success) {
    console.log('✅ Health check passed');
    console.log(`   Database: ${result.data.database.connected ? 'Connected' : 'Disconnected'}`);
    return true;
  } else {
    console.log('❌ Health check failed');
    console.log('   Error:', result.error);
    return false;
  }
};

const testUserRegistration = async () => {
  console.log('\n🔍 Testing User Registration...');
  const result = await makeRequest('POST', '/api/auth/register', testUser, false);
  
  
  if (result.success && result.data.success) {
    console.log('✅ User registration passed');
    authToken = result.data.data.token;
    refreshToken = result.data.data.refreshToken;
    userId = result.data.data.user.id;
    console.log(`   User ID: ${userId}`);
    console.log(`   Token received: ${authToken ? 'Yes' : 'No'}`);
    return true;
  } else if (!result.success && result.error && result.error.error && result.error.error.code === 'USER_EXISTS') {
    console.log('✅ User registration passed (user already exists - expected)');
    // Try to login instead to get tokens
    const loginResult = await makeRequest('POST', '/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    }, false);
    
    if (loginResult.success && loginResult.data.success) {
      authToken = loginResult.data.data.token;
      refreshToken = loginResult.data.data.refreshToken;
      userId = loginResult.data.data.user.id;
      console.log(`   User ID: ${userId}`);
      console.log(`   Token received: ${authToken ? 'Yes' : 'No'}`);
      return true;
    }
  }
  
  console.log('❌ User registration failed');
  console.log('   Error:', result.error);
  return false;
};

const testUserLogin = async () => {
  console.log('\n🔍 Testing User Login...');
  const loginData = {
    email: testUser.email,
    password: testUser.password
  };
  
  const result = await makeRequest('POST', '/api/auth/login', loginData, false);
  
  if (result.success && result.data.success) {
    console.log('✅ User login passed');
    authToken = result.data.data.token;
    refreshToken = result.data.data.refreshToken;
    console.log(`   New token received: ${authToken ? 'Yes' : 'No'}`);
    return true;
  } else {
    console.log('❌ User login failed');
    console.log('   Error:', result.error);
    return false;
  }
};

const testGetProfile = async () => {
  console.log('\n🔍 Testing Get Profile...');
  const result = await makeRequest('GET', '/api/auth/profile');
  
  if (result.success && result.data.success) {
    console.log('✅ Get profile passed');
    console.log(`   Username: ${result.data.data.user.username}`);
    console.log(`   Email: ${result.data.data.user.email}`);
    return true;
  } else {
    console.log('❌ Get profile failed');
    console.log('   Error:', result.error);
    return false;
  }
};

const testCreateTodo = async () => {
  console.log('\n🔍 Testing Create Todo...');
  const result = await makeRequest('POST', '/api/todos', testTodo);
  
  if (result.success && result.data.success) {
    console.log('✅ Create todo passed');
    console.log(`   Todo ID: ${result.data.data.todo.id}`);
    console.log(`   Title: ${result.data.data.todo.title}`);
    return result.data.data.todo.id;
  } else {
    console.log('❌ Create todo failed');
    console.log('   Error:', result.error);
    return null;
  }
};

const testGetTodos = async () => {
  console.log('\n🔍 Testing Get Todos...');
  const result = await makeRequest('GET', '/api/todos');
  
  if (result.success && result.data.success) {
    console.log('✅ Get todos passed');
    console.log(`   Todos count: ${result.data.data.todos.length}`);
    console.log(`   Pagination: ${result.data.data.pagination.total} total`);
    return true;
  } else {
    console.log('❌ Get todos failed');
    console.log('   Error:', result.error);
    return false;
  }
};

const testUpdateTodo = async (todoId) => {
  console.log('\n🔍 Testing Update Todo...');
  const updateData = {
    title: 'Updated Test Todo',
    completed: true
  };
  
  const result = await makeRequest('PUT', `/api/todos/${todoId}`, updateData);
  
  if (result.success && result.data.success) {
    console.log('✅ Update todo passed');
    console.log(`   Updated title: ${result.data.data.todo.title}`);
    console.log(`   Completed: ${result.data.data.todo.completed}`);
    return true;
  } else {
    console.log('❌ Update todo failed');
    console.log('   Error:', result.error);
    return false;
  }
};

const testToggleTodo = async (todoId) => {
  console.log('\n🔍 Testing Toggle Todo...');
  const result = await makeRequest('PATCH', `/api/todos/${todoId}/toggle`);
  
  if (result.success && result.data.success) {
    console.log('✅ Toggle todo passed');
    console.log(`   Completed: ${result.data.data.todo.completed}`);
    return true;
  } else {
    console.log('❌ Toggle todo failed');
    console.log('   Error:', result.error);
    return false;
  }
};

const testSearchTodos = async () => {
  console.log('\n🔍 Testing Search Todos...');
  const searchData = {
    query: 'test',
    limit: 10
  };
  
  const result = await makeRequest('POST', '/api/todos/search', searchData);
  
  if (result.success && result.data.success) {
    console.log('✅ Search todos passed');
    console.log(`   Results: ${result.data.data.todos.length}`);
    return true;
  } else {
    console.log('❌ Search todos failed');
    console.log('   Error:', result.error);
    return false;
  }
};

const testGetTodoStats = async () => {
  console.log('\n🔍 Testing Get Todo Stats...');
  const result = await makeRequest('GET', '/api/todos/stats');
  
  if (result.success && result.data.success) {
    console.log('✅ Get todo stats passed');
    console.log(`   Total: ${result.data.data.stats.total}`);
    console.log(`   Completed: ${result.data.data.stats.completed}`);
    console.log(`   Pending: ${result.data.data.stats.pending}`);
    return true;
  } else {
    console.log('❌ Get todo stats failed');
    console.log('   Error:', result.error);
    return false;
  }
};

const testRefreshToken = async () => {
  console.log('\n🔍 Testing Refresh Token...');
  const result = await makeRequest('POST', '/api/auth/refresh', { refreshToken }, false);
  
  if (result.success && result.data.success) {
    console.log('✅ Refresh token passed');
    authToken = result.data.data.token;
    refreshToken = result.data.data.refreshToken;
    console.log(`   New token received: ${authToken ? 'Yes' : 'No'}`);
    return true;
  } else {
    console.log('❌ Refresh token failed');
    console.log('   Error:', result.error);
    return false;
  }
};

const testDeleteTodo = async (todoId) => {
  console.log('\n🔍 Testing Delete Todo...');
  const result = await makeRequest('DELETE', `/api/todos/${todoId}`);
  
  if (result.success && result.data.success) {
    console.log('✅ Delete todo passed');
    return true;
  } else {
    console.log('❌ Delete todo failed');
    console.log('   Error:', result.error);
    return false;
  }
};

const testUnauthorizedAccess = async () => {
  console.log('\n🔍 Testing Unauthorized Access...');
  const result = await makeRequest('GET', '/api/todos', null, false);
  
  if (!result.success && result.status === 401) {
    console.log('✅ Unauthorized access properly blocked');
    return true;
  } else {
    console.log('❌ Unauthorized access not properly blocked');
    console.log('   Status:', result.status);
    return false;
  }
};

const testInvalidToken = async () => {
  console.log('\n🔍 Testing Invalid Token...');
  const originalToken = authToken;
  authToken = 'invalid-token';
  
  const result = await makeRequest('GET', '/api/todos');
  
  authToken = originalToken; // Restore token
  
  if (!result.success && result.status === 401) {
    console.log('✅ Invalid token properly rejected');
    return true;
  } else {
    console.log('❌ Invalid token not properly rejected');
    console.log('   Status:', result.status);
    return false;
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting v0.3 Authentication System Tests...\n');
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'User Registration', fn: testUserRegistration },
    { name: 'User Login', fn: testUserLogin },
    { name: 'Get Profile', fn: testGetProfile },
    { name: 'Create Todo', fn: testCreateTodo },
    { name: 'Get Todos', fn: testGetTodos },
    { name: 'Update Todo', fn: (todoId) => testUpdateTodo(todoId) },
    { name: 'Toggle Todo', fn: (todoId) => testToggleTodo(todoId) },
    { name: 'Search Todos', fn: testSearchTodos },
    { name: 'Get Todo Stats', fn: testGetTodoStats },
    { name: 'Refresh Token', fn: testRefreshToken },
    { name: 'Unauthorized Access', fn: testUnauthorizedAccess },
    { name: 'Invalid Token', fn: testInvalidToken },
    { name: 'Delete Todo', fn: (todoId) => testDeleteTodo(todoId) }
  ];
  
  let passed = 0;
  let failed = 0;
  let todoId = null;
  
  for (const test of tests) {
    try {
      let result;
      if (test.name === 'Create Todo') {
        result = await test.fn();
        if (result) todoId = result;
      } else if (test.name === 'Update Todo' || test.name === 'Toggle Todo' || test.name === 'Delete Todo') {
        result = await test.fn(todoId);
      } else {
        result = await test.fn();
      }
      
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} failed with error:`, error.message);
      failed++;
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! v0.3 is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
};

// Run tests
runTests().catch(console.error);
