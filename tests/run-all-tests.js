#!/usr/bin/env node

// Comprehensive Test Runner for Todo App v0.7
// Runs all test suites for real-time features, notifications, and offline support

const WebSocketTester = require('./websocket/websocket-test');
const NotificationTester = require('./notifications/notification-test');
const OfflineTester = require('./offline/offline-test');

class TestRunner {
  constructor() {
    this.results = {
      websocket: { passed: 0, total: 0, tests: [] },
      notifications: { passed: 0, total: 0, tests: [] },
      offline: { passed: 0, total: 0, tests: [] }
    };
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Test Suite for Todo App v0.7');
    console.log('='.repeat(60));
    console.log('Testing: Real-time WebSocket, Notifications, Offline Support\n');

    try {
      // Run WebSocket tests
      console.log('📡 Phase 1: WebSocket & Real-time Features');
      console.log('-'.repeat(40));
      await this.runWebSocketTests();

      // Run Notification tests
      console.log('\n🔔 Phase 2: Notification System');
      console.log('-'.repeat(40));
      await this.runNotificationTests();

      // Run Offline tests
      console.log('\n📱 Phase 3: Offline Support');
      console.log('-'.repeat(40));
      await this.runOfflineTests();

      // Print final results
      this.printFinalResults();

    } catch (error) {
      console.error('❌ Test suite execution failed:', error.message);
      process.exit(1);
    }
  }

  async runWebSocketTests() {
    try {
      const tester = new WebSocketTester();
      await tester.runTests();
      
      // Capture results
      this.results.websocket.tests = tester.testResults;
      this.results.websocket.passed = tester.testResults.filter(t => t.success).length;
      this.results.websocket.total = tester.testResults.length;
      
    } catch (error) {
      console.error('❌ WebSocket tests failed:', error.message);
      this.results.websocket.tests = [{ test: 'WebSocket Tests', success: false, message: error.message }];
      this.results.websocket.total = 1;
    }
  }

  async runNotificationTests() {
    try {
      const tester = new NotificationTester();
      await tester.runTests();
      
      // Capture results
      this.results.notifications.tests = tester.testResults;
      this.results.notifications.passed = tester.testResults.filter(t => t.success).length;
      this.results.notifications.total = tester.testResults.length;
      
    } catch (error) {
      console.error('❌ Notification tests failed:', error.message);
      this.results.notifications.tests = [{ test: 'Notification Tests', success: false, message: error.message }];
      this.results.notifications.total = 1;
    }
  }

  async runOfflineTests() {
    try {
      const tester = new OfflineTester();
      await tester.runTests();
      
      // Capture results
      this.results.offline.tests = tester.testResults;
      this.results.offline.passed = tester.testResults.filter(t => t.success).length;
      this.results.offline.total = tester.testResults.length;
      
    } catch (error) {
      console.error('❌ Offline tests failed:', error.message);
      this.results.offline.tests = [{ test: 'Offline Tests', success: false, message: error.message }];
      this.results.offline.total = 1;
    }
  }

  printFinalResults() {
    const endTime = Date.now();
    const duration = Math.round((endTime - this.startTime) / 1000);
    
    console.log('\n🎯 FINAL TEST RESULTS');
    console.log('='.repeat(60));
    
    let totalPassed = 0;
    let totalTests = 0;
    
    // WebSocket Results
    console.log('\n📡 WebSocket & Real-time Features:');
    console.log(`   ✅ Passed: ${this.results.websocket.passed}/${this.results.websocket.total}`);
    if (this.results.websocket.total > 0) {
      const percentage = Math.round(this.results.websocket.passed / this.results.websocket.total * 100);
      console.log(`   📊 Success Rate: ${percentage}%`);
    }
    
    // Notification Results
    console.log('\n🔔 Notification System:');
    console.log(`   ✅ Passed: ${this.results.notifications.passed}/${this.results.notifications.total}`);
    if (this.results.notifications.total > 0) {
      const percentage = Math.round(this.results.notifications.passed / this.results.notifications.total * 100);
      console.log(`   📊 Success Rate: ${percentage}%`);
    }
    
    // Offline Results
    console.log('\n📱 Offline Support:');
    console.log(`   ✅ Passed: ${this.results.offline.passed}/${this.results.offline.total}`);
    if (this.results.offline.total > 0) {
      const percentage = Math.round(this.results.offline.passed / this.results.offline.total * 100);
      console.log(`   📊 Success Rate: ${percentage}%`);
    }
    
    // Overall Results
    totalPassed = this.results.websocket.passed + this.results.notifications.passed + this.results.offline.passed;
    totalTests = this.results.websocket.total + this.results.notifications.total + this.results.offline.total;
    
    console.log('\n🏆 OVERALL RESULTS:');
    console.log(`   ✅ Total Passed: ${totalPassed}/${totalTests}`);
    if (totalTests > 0) {
      const overallPercentage = Math.round(totalPassed / totalTests * 100);
      console.log(`   📊 Overall Success Rate: ${overallPercentage}%`);
    }
    console.log(`   ⏱️  Total Duration: ${duration} seconds`);
    
    // Test Status
    console.log('\n📋 TEST STATUS:');
    if (totalPassed === totalTests && totalTests > 0) {
      console.log('   🎉 ALL TESTS PASSED! v0.7 is ready for production!');
      console.log('   ✅ Real-time features working');
      console.log('   ✅ Notification system operational');
      console.log('   ✅ Offline support functional');
    } else if (totalPassed >= totalTests * 0.8) {
      console.log('   ⚠️  MOSTLY PASSING - Minor issues detected');
      console.log('   🔧 Review failed tests and fix issues');
    } else {
      console.log('   ❌ SIGNIFICANT ISSUES DETECTED');
      console.log('   🛠️  Major fixes required before production');
    }
    
    // Failed Tests Summary
    const failedTests = [];
    Object.values(this.results).forEach(suite => {
      suite.tests.forEach(test => {
        if (!test.success) {
          failedTests.push(`${test.test}: ${test.message}`);
        }
      });
    });
    
    if (failedTests.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      failedTests.forEach(test => {
        console.log(`   • ${test}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Exit with appropriate code
    if (totalPassed === totalTests && totalTests > 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;



