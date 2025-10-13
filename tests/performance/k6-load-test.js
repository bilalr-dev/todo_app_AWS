// K6 load testing script for Todo App
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests must complete below 1s
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
    errors: ['rate<0.1'],              // Custom error rate must be below 10%
  },
};

const BASE_URL = 'http://localhost:5002';

// Test data
const testUsers = [
  { email: 'demo@todoapp.com', password: 'demo123' },
];

export function setup() {
  // Setup function runs once before the test
  console.log('Setting up load test...');
  return { baseUrl: BASE_URL };
}

export default function(data) {
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  
  // Login
  const loginResponse = http.post(`${data.baseUrl}/api/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const loginSuccess = check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 1s': (r) => r.timings.duration < 1000,
    'login has token': (r) => JSON.parse(r.body).data.token !== undefined,
  });
  
  errorRate.add(!loginSuccess);
  
  if (!loginSuccess) {
    return;
  }
  
  const token = JSON.parse(loginResponse.body).data.token;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Get todos
  const todosResponse = http.get(`${data.baseUrl}/api/todos`, { headers });
  
  const todosSuccess = check(todosResponse, {
    'todos status is 200': (r) => r.status === 200,
    'todos response time < 500ms': (r) => r.timings.duration < 500,
    'todos has data': (r) => JSON.parse(r.body).data.todos !== undefined,
  });
  
  errorRate.add(!todosSuccess);
  
  // Create a new todo
  const todoData = {
    title: `Load Test Todo ${Math.random()}`,
    description: 'This is a load test todo',
    priority: 'medium',
    category: 'work',
    due_date: '2024-12-31',
  };
  
  const createResponse = http.post(`${data.baseUrl}/api/todos`, JSON.stringify(todoData), { headers });
  
  const createSuccess = check(createResponse, {
    'create status is 201': (r) => r.status === 201,
    'create response time < 800ms': (r) => r.timings.duration < 800,
    'create has todo id': (r) => JSON.parse(r.body).data.todo.id !== undefined,
  });
  
  errorRate.add(!createSuccess);
  
  if (createSuccess) {
    const todoId = JSON.parse(createResponse.body).data.todo.id;
    
    // Update the todo
    const updateData = {
      title: `Updated Load Test Todo ${Math.random()}`,
      completed: true,
    };
    
    const updateResponse = http.put(`${data.baseUrl}/api/todos/${todoId}`, JSON.stringify(updateData), { headers });
    
    const updateSuccess = check(updateResponse, {
      'update status is 200': (r) => r.status === 200,
      'update response time < 600ms': (r) => r.timings.duration < 600,
    });
    
    errorRate.add(!updateSuccess);
    
    // Toggle completion
    const toggleResponse = http.patch(`${data.baseUrl}/api/todos/${todoId}/toggle`, null, { headers });
    
    const toggleSuccess = check(toggleResponse, {
      'toggle status is 200': (r) => r.status === 200,
      'toggle response time < 400ms': (r) => r.timings.duration < 400,
    });
    
    errorRate.add(!toggleSuccess);
    
    // Delete the todo
    const deleteResponse = http.del(`${data.baseUrl}/api/todos/${todoId}`, null, { headers });
    
    const deleteSuccess = check(deleteResponse, {
      'delete status is 200': (r) => r.status === 200,
      'delete response time < 500ms': (r) => r.timings.duration < 500,
    });
    
    errorRate.add(!deleteSuccess);
  }
  
  // Search todos
  const searchResponse = http.get(`${data.baseUrl}/api/todos/search?q=Getting`, { headers });
  
  const searchSuccess = check(searchResponse, {
    'search status is 200': (r) => r.status === 200,
    'search response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  errorRate.add(!searchSuccess);
  
  // Get stats
  const statsResponse = http.get(`${data.baseUrl}/api/todos/stats`, { headers });
  
  const statsSuccess = check(statsResponse, {
    'stats status is 200': (r) => r.status === 200,
    'stats response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  errorRate.add(!statsSuccess);
  
  // Get profile
  const profileResponse = http.get(`${data.baseUrl}/api/auth/profile`, { headers });
  
  const profileSuccess = check(profileResponse, {
    'profile status is 200': (r) => r.status === 200,
    'profile response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  errorRate.add(!profileSuccess);
  
  // Logout
  const logoutResponse = http.post(`${data.baseUrl}/api/auth/logout`, null, { headers });
  
  const logoutSuccess = check(logoutResponse, {
    'logout status is 200': (r) => r.status === 200,
    'logout response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  errorRate.add(!logoutSuccess);
  
  // Sleep between iterations
  sleep(1);
}

export function teardown(data) {
  console.log('Load test completed');
}
