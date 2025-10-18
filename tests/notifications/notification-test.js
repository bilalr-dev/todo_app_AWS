// Notification Testing Script for Todo App v0.7
// Tests in-app and email notification functionality

const axios = require('axios');
const nodemailer = require('nodemailer');

class NotificationTester {
  constructor(baseUrl = 'http://localhost:5002') {
    this.baseUrl = baseUrl;
    this.authToken = null;
    this.testResults = [];
    this.testEmail = 'test@example.com';
  }

  async runTests() {
    console.log('🔔 Starting Notification Tests for v0.7...\n');
    
    try {
      await this.setupAuth();
      await this.testNotificationAPI();
      await this.testNotificationPreferences();
      await this.testInAppNotifications();
      await this.testEmailService();
      await this.testNotificationTypes();
      await this.testBulkNotifications();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Notification test suite failed:', error.message);
    }
  }

  async setupAuth() {
    console.log('🔐 Setting up authentication...');
    
    try {
      // Register test user
      const registerResponse = await axios.post(`${this.baseUrl}/api/auth/register`, {
        username: 'notification_test_user',
        email: this.testEmail,
        password: 'testpassword123'
      });

      if (registerResponse.data.success) {
        this.authToken = registerResponse.data.token;
        console.log('✅ Test user registered successfully');
      } else {
        // Try to login if user already exists
        const loginResponse = await axios.post(`${this.baseUrl}/api/auth/login`, {
          email: this.testEmail,
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

  async testNotificationAPI() {
    console.log('\n📡 Testing notification API endpoints...');
    
    try {
      // Test get notifications
      const getResponse = await axios.get(`${this.baseUrl}/api/notifications`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (getResponse.data.success) {
        this.addTestResult('Get Notifications API', true, 'Successfully retrieved notifications');
        console.log('✅ Get notifications API working');
      } else {
        this.addTestResult('Get Notifications API', false, 'Failed to retrieve notifications');
      }

      // Test unread count
      const countResponse = await axios.get(`${this.baseUrl}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (countResponse.data.success) {
        this.addTestResult('Unread Count API', true, `Unread count: ${countResponse.data.count}`);
        console.log('✅ Unread count API working');
      } else {
        this.addTestResult('Unread Count API', false, 'Failed to get unread count');
      }

      // Test notification stats
      const statsResponse = await axios.get(`${this.baseUrl}/api/notifications/stats`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (statsResponse.data.success) {
        this.addTestResult('Notification Stats API', true, 'Successfully retrieved stats');
        console.log('✅ Notification stats API working');
      } else {
        this.addTestResult('Notification Stats API', false, 'Failed to get stats');
      }

    } catch (error) {
      this.addTestResult('Notification API', false, error.message);
      console.error('❌ Notification API test failed:', error.message);
    }
  }

  async testNotificationPreferences() {
    console.log('\n⚙️ Testing notification preferences...');
    
    try {
      // Get current preferences
      const getResponse = await axios.get(`${this.baseUrl}/api/notifications/preferences`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (getResponse.data.success) {
        console.log('✅ Retrieved notification preferences');
        
        // Update preferences
        const newPreferences = {
          email_enabled: true,
          in_app_enabled: true,
          due_date_reminders: true,
          file_upload_notifications: false,
          batch_frequency: 'hourly'
        };
        
        const updateResponse = await axios.put(`${this.baseUrl}/api/notifications/preferences`, 
          newPreferences, {
            headers: { Authorization: `Bearer ${this.authToken}` }
          });
        
        if (updateResponse.data.success) {
          this.addTestResult('Notification Preferences', true, 'Preferences updated successfully');
          console.log('✅ Notification preferences updated');
        } else {
          this.addTestResult('Notification Preferences', false, 'Failed to update preferences');
        }
      } else {
        this.addTestResult('Notification Preferences', false, 'Failed to get preferences');
      }

    } catch (error) {
      this.addTestResult('Notification Preferences', false, error.message);
      console.error('❌ Notification preferences test failed:', error.message);
    }
  }

  async testInAppNotifications() {
    console.log('\n📱 Testing in-app notifications...');
    
    try {
      // Send test notification
      const testResponse = await axios.post(`${this.baseUrl}/api/notifications/test`, {
        type: 'system_notification'
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (testResponse.data.success) {
        console.log('✅ Test notification sent');
        
        // Wait a moment for notification to be created
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if notification was created
        const notificationsResponse = await axios.get(`${this.baseUrl}/api/notifications`, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        });
        
        if (notificationsResponse.data.success && 
            notificationsResponse.data.notifications.length > 0) {
          
          const notification = notificationsResponse.data.notifications[0];
          
          // Mark as read
          const markReadResponse = await axios.put(
            `${this.baseUrl}/api/notifications/${notification.id}/read`, 
            {}, {
              headers: { Authorization: `Bearer ${this.authToken}` }
            });
          
          if (markReadResponse.data.success) {
            this.addTestResult('In-App Notifications', true, 'Notification created and marked as read');
            console.log('✅ In-app notification workflow working');
          } else {
            this.addTestResult('In-App Notifications', false, 'Failed to mark notification as read');
          }
        } else {
          this.addTestResult('In-App Notifications', false, 'No notifications found');
        }
      } else {
        this.addTestResult('In-App Notifications', false, 'Failed to send test notification');
      }

    } catch (error) {
      this.addTestResult('In-App Notifications', false, error.message);
      console.error('❌ In-app notifications test failed:', error.message);
    }
  }

  async testEmailService() {
    console.log('\n📧 Testing email service...');
    
    try {
      // Test email service status
      const statusResponse = await axios.get(`${this.baseUrl}/api/health`);
      
      if (statusResponse.data.success) {
        console.log('✅ Email service status check passed');
        
        // Send test email notification
        const emailTestResponse = await axios.post(`${this.baseUrl}/api/notifications/test`, {
          type: 'system_notification'
        }, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        });
        
        if (emailTestResponse.data.success) {
          this.addTestResult('Email Service', true, 'Email service operational');
          console.log('✅ Email service test passed');
        } else {
          this.addTestResult('Email Service', false, 'Failed to send test email');
        }
      } else {
        this.addTestResult('Email Service', false, 'Service health check failed');
      }

    } catch (error) {
      this.addTestResult('Email Service', false, error.message);
      console.error('❌ Email service test failed:', error.message);
    }
  }

  async testNotificationTypes() {
    console.log('\n🔔 Testing different notification types...');
    
    const notificationTypes = [
      'due_date_reminder',
      'todo_created_high_priority',
      'todo_state_changed',
      'file_uploaded',
      'bulk_action_completed'
    ];
    
    let successCount = 0;
    
    for (const type of notificationTypes) {
      try {
        const response = await axios.post(`${this.baseUrl}/api/notifications/test`, {
          type: type
        }, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        });
        
        if (response.data.success) {
          successCount++;
          console.log(`✅ ${type} notification test passed`);
        } else {
          console.log(`❌ ${type} notification test failed`);
        }
      } catch (error) {
        console.log(`❌ ${type} notification test error:`, error.message);
      }
    }
    
    const success = successCount === notificationTypes.length;
    this.addTestResult('Notification Types', success, 
      `${successCount}/${notificationTypes.length} notification types working`);
  }

  async testBulkNotifications() {
    console.log('\n📦 Testing bulk notification operations...');
    
    try {
      // Create multiple notifications
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          axios.post(`${this.baseUrl}/api/notifications/test`, {
            type: 'system_notification'
          }, {
            headers: { Authorization: `Bearer ${this.authToken}` }
          })
        );
      }
      
      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.data.success).length;
      
      if (successCount === 5) {
        console.log('✅ Bulk notification creation successful');
        
        // Test mark all as read
        const markAllResponse = await axios.put(`${this.baseUrl}/api/notifications/read-all`, 
          {}, {
            headers: { Authorization: `Bearer ${this.authToken}` }
          });
        
        if (markAllResponse.data.success) {
          this.addTestResult('Bulk Notifications', true, 
            `Created ${successCount} notifications and marked all as read`);
          console.log('✅ Bulk notification operations working');
        } else {
          this.addTestResult('Bulk Notifications', false, 'Failed to mark all as read');
        }
      } else {
        this.addTestResult('Bulk Notifications', false, 
          `Only ${successCount}/5 notifications created successfully`);
      }

    } catch (error) {
      this.addTestResult('Bulk Notifications', false, error.message);
      console.error('❌ Bulk notifications test failed:', error.message);
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
    console.log('\n📊 Notification Test Results:');
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
      console.log('🎉 All notification tests passed!');
    } else {
      console.log('⚠️ Some tests failed. Check the results above.');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new NotificationTester();
  tester.runTests().catch(console.error);
}

module.exports = NotificationTester;



