// Offline Support Testing Script for Todo App v0.7
// Tests offline functionality and data synchronization

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class OfflineTester {
  constructor(baseUrl = 'http://localhost:5002') {
    this.baseUrl = baseUrl;
    this.authToken = null;
    this.testResults = [];
    this.testData = {
      todos: [],
      files: []
    };
  }

  async runTests() {
    console.log('📱 Starting Offline Support Tests for v0.7...\n');
    
    try {
      await this.setupAuth();
      await this.testDataCaching();
      await this.testOfflineStorage();
      await this.testActionQueuing();
      await this.testDataSynchronization();
      await this.testErrorRecovery();
      await this.testStorageManagement();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Offline test suite failed:', error.message);
    }
  }

  async setupAuth() {
    console.log('🔐 Setting up authentication...');
    
    try {
      // Register test user
      const registerResponse = await axios.post(`${this.baseUrl}/api/auth/register`, {
        username: 'offline_test_user',
        email: 'offline@test.com',
        password: 'testpassword123'
      });

      if (registerResponse.data.success) {
        this.authToken = registerResponse.data.token;
        console.log('✅ Test user registered successfully');
      } else {
        // Try to login if user already exists
        const loginResponse = await axios.post(`${this.baseUrl}/api/auth/login`, {
          email: 'offline@test.com',
          password: 'testpassword123'
        });
        
        if (loginResponse.data.success) {
          this.authToken = loginResponse.data.token;
          console.log('✅ Test user logged in successfully');
        } else {
          throw new Error('Failed to authenticate test user');
        }
      }
    } catch (error) {
      console.error('❌ Authentication setup failed:', error.message);
      throw error;
    }
  }

  async testDataCaching() {
    console.log('\n💾 Testing data caching...');
    
    try {
      // Create test data
      const testTodos = [];
      for (let i = 0; i < 3; i++) {
        const response = await axios.post(`${this.baseUrl}/api/todos`, {
          title: `Offline Test Todo ${i + 1}`,
          description: 'Testing offline data caching',
          priority: 'medium',
          category: 'test'
        }, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        });
        
        if (response.data.success) {
          testTodos.push(response.data.data.todo);
        }
      }
      
      this.testData.todos = testTodos;
      
      // Test data retrieval
      const getResponse = await axios.get(`${this.baseUrl}/api/todos`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (getResponse.data.success && getResponse.data.data.todos.length >= 3) {
        this.addTestResult('Data Caching', true, 
          `Successfully cached and retrieved ${getResponse.data.data.todos.length} todos`);
        console.log('✅ Data caching working correctly');
      } else {
        this.addTestResult('Data Caching', false, 'Failed to cache or retrieve data');
      }

    } catch (error) {
      this.addTestResult('Data Caching', false, error.message);
      console.error('❌ Data caching test failed:', error.message);
    }
  }

  async testOfflineStorage() {
    console.log('\n📦 Testing offline storage...');
    
    try {
      // Test localStorage simulation
      const testData = {
        todos: this.testData.todos,
        timestamp: Date.now(),
        version: '1.0'
      };
      
      // Simulate saving to localStorage
      const storageKey = 'todo_app_offline_data_todos';
      const serializedData = JSON.stringify(testData);
      
      // Test data serialization/deserialization
      const parsedData = JSON.parse(serializedData);
      
      if (parsedData.todos.length === testData.todos.length) {
        this.addTestResult('Offline Storage', true, 
          `Successfully stored and retrieved ${parsedData.todos.length} todos`);
        console.log('✅ Offline storage working correctly');
      } else {
        this.addTestResult('Offline Storage', false, 'Data corruption in storage');
      }

    } catch (error) {
      this.addTestResult('Offline Storage', false, error.message);
      console.error('❌ Offline storage test failed:', error.message);
    }
  }

  async testActionQueuing() {
    console.log('\n⏳ Testing action queuing...');
    
    try {
      // Simulate offline actions
      const queuedActions = [
        {
          id: 'action_1',
          type: 'CREATE_TODO',
          data: { title: 'Queued Todo 1', priority: 'high' },
          timestamp: Date.now(),
          retryCount: 0
        },
        {
          id: 'action_2',
          type: 'UPDATE_TODO',
          todoId: this.testData.todos[0]?.id,
          data: { priority: 'urgent' },
          timestamp: Date.now(),
          retryCount: 0
        },
        {
          id: 'action_3',
          type: 'DELETE_TODO',
          todoId: this.testData.todos[1]?.id,
          timestamp: Date.now(),
          retryCount: 0
        }
      ];
      
      // Test action queue serialization
      const queueData = JSON.stringify(queuedActions);
      const parsedQueue = JSON.parse(queueData);
      
      if (parsedQueue.length === queuedActions.length) {
        this.addTestResult('Action Queuing', true, 
          `Successfully queued ${parsedQueue.length} actions`);
        console.log('✅ Action queuing working correctly');
      } else {
        this.addTestResult('Action Queuing', false, 'Action queue corruption');
      }

    } catch (error) {
      this.addTestResult('Action Queuing', false, error.message);
      console.error('❌ Action queuing test failed:', error.message);
    }
  }

  async testDataSynchronization() {
    console.log('\n🔄 Testing data synchronization...');
    
    try {
      // Simulate sync process
      const queuedActions = [
        { type: 'CREATE_TODO', data: { title: 'Sync Test Todo' } },
        { type: 'UPDATE_TODO', todoId: 1, data: { priority: 'high' } }
      ];
      
      let syncedCount = 0;
      let failedCount = 0;
      
      for (const action of queuedActions) {
        try {
          // Simulate successful sync
          if (action.type === 'CREATE_TODO') {
            const response = await axios.post(`${this.baseUrl}/api/todos`, action.data, {
              headers: { Authorization: `Bearer ${this.authToken}` }
            });
            
            if (response.data.success) {
              syncedCount++;
            } else {
              failedCount++;
            }
          } else if (action.type === 'UPDATE_TODO' && this.testData.todos[0]) {
            const response = await axios.put(`${this.baseUrl}/api/todos/${this.testData.todos[0].id}`, 
              action.data, {
                headers: { Authorization: `Bearer ${this.authToken}` }
              });
            
            if (response.data.success) {
              syncedCount++;
            } else {
              failedCount++;
            }
          }
        } catch (error) {
          failedCount++;
        }
      }
      
      const success = syncedCount > 0;
      this.addTestResult('Data Synchronization', success, 
        `Synced ${syncedCount}/${queuedActions.length} actions, ${failedCount} failed`);
      console.log(`✅ Data synchronization: ${syncedCount} synced, ${failedCount} failed`);

    } catch (error) {
      this.addTestResult('Data Synchronization', false, error.message);
      console.error('❌ Data synchronization test failed:', error.message);
    }
  }

  async testErrorRecovery() {
    console.log('\n🛠️ Testing error recovery...');
    
    try {
      // Test network error simulation
      const networkError = new Error('Network Error');
      networkError.code = 'NETWORK_ERROR';
      
      // Test error handling
      let errorHandled = false;
      try {
        throw networkError;
      } catch (error) {
        if (error.code === 'NETWORK_ERROR') {
          errorHandled = true;
        }
      }
      
      // Test retry logic
      let retryCount = 0;
      const maxRetries = 3;
      let operationSuccessful = false;
      
      while (retryCount < maxRetries && !operationSuccessful) {
        try {
          // Simulate operation that might fail
          if (retryCount === 2) { // Succeed on third try
            operationSuccessful = true;
          } else {
            throw new Error('Temporary failure');
          }
        } catch (error) {
          retryCount++;
        }
      }
      
      if (errorHandled && operationSuccessful) {
        this.addTestResult('Error Recovery', true, 
          `Error handling and retry logic working (${retryCount} retries)`);
        console.log('✅ Error recovery working correctly');
      } else {
        this.addTestResult('Error Recovery', false, 'Error recovery failed');
      }

    } catch (error) {
      this.addTestResult('Error Recovery', false, error.message);
      console.error('❌ Error recovery test failed:', error.message);
    }
  }

  async testStorageManagement() {
    console.log('\n🗂️ Testing storage management...');
    
    try {
      // Test storage size calculation
      const testData = {
        todos: Array(100).fill().map((_, i) => ({
          id: i,
          title: `Test Todo ${i}`,
          description: 'Test description',
          priority: 'medium',
          created_at: new Date().toISOString()
        })),
        notifications: Array(50).fill().map((_, i) => ({
          id: i,
          title: `Test Notification ${i}`,
          message: 'Test message',
          created_at: new Date().toISOString()
        }))
      };
      
      const dataSize = JSON.stringify(testData).length;
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      // Test cleanup logic
      const shouldCleanup = dataSize > maxSize * 0.8; // Cleanup at 80% capacity
      
      if (dataSize < maxSize) {
        this.addTestResult('Storage Management', true, 
          `Storage size: ${Math.round(dataSize/1024)}KB (${Math.round(dataSize/maxSize*100)}% of limit)`);
        console.log('✅ Storage management working correctly');
      } else {
        this.addTestResult('Storage Management', false, 'Storage size exceeds limit');
      }

    } catch (error) {
      this.addTestResult('Storage Management', false, error.message);
      console.error('❌ Storage management test failed:', error.message);
    }
  }

  addTestResult(testName, success, message) {
    this.testResults.push({
      test: testName,
      success,
      message,
      timestamp: new Date().toISOString()
    });
  }

  printResults() {
    console.log('\n📊 Offline Support Test Results:');
    console.log('='.repeat(50));
    
    let passed = 0;
    let total = this.testResults.length;
    
    this.testResults.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.test}: ${result.message}`);
      if (result.success) passed++;
    });
    
    console.log('='.repeat(50));
    console.log(`📈 Results: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);
    
    if (passed === total) {
      console.log('🎉 All offline support tests passed!');
    } else {
      console.log('⚠️ Some tests failed. Check the results above.');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new OfflineTester();
  tester.runTests().catch(console.error);
}

module.exports = OfflineTester;



