// Custom Jest reporter for detailed HTML reports
const fs = require('fs');
const path = require('path');

class CustomReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options;
    this.outputPath = options.outputPath || './testreports';
    this.results = [];
  }

  onRunStart(results, options) {
    console.log('🧪 Starting test run...');
    this.startTime = Date.now();
  }

  onTestResult(test, testResult, aggregatedResult) {
    this.results.push({
      testFilePath: testResult.testFilePath,
      testResults: testResult.testResults,
      perfStats: testResult.perfStats,
      failureMessage: testResult.failureMessage,
    });
  }

  onRunComplete(contexts, results) {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    console.log('📊 Generating detailed test report...');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }

    // Generate comprehensive HTML report
    const htmlReport = this.generateHTMLReport(results, duration);
    const reportPath = path.join(this.outputPath, 'test-report.html');
    
    fs.writeFileSync(reportPath, htmlReport);
    console.log(`📄 Test report generated: ${reportPath}`);
    
    // Generate JSON report for programmatic access
    const jsonReport = this.generateJSONReport(results, duration);
    const jsonPath = path.join(this.outputPath, 'test-results.json');
    
    fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
    console.log(`📊 Test data exported: ${jsonPath}`);
  }

  generateHTMLReport(results, duration) {
    const testSuites = this.categorizeTests(results);
    const summary = this.generateSummary(results, duration);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo App - Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; text-align: center; }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { font-size: 1.2em; opacity: 0.9; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        .summary-card h3 { color: #667eea; margin-bottom: 10px; }
        .summary-card .number { font-size: 2em; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .pending { color: #6c757d; }
        .test-suite { background: white; margin-bottom: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .test-suite-header { background: #f8f9fa; padding: 15px 20px; border-bottom: 1px solid #dee2e6; }
        .test-suite-header h3 { color: #495057; }
        .test-list { padding: 0; }
        .test-item { padding: 15px 20px; border-bottom: 1px solid #f1f3f4; display: flex; justify-content: space-between; align-items: center; }
        .test-item:last-child { border-bottom: none; }
        .test-name { font-weight: 500; }
        .test-status { padding: 4px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold; }
        .test-status.passed { background: #d4edda; color: #155724; }
        .test-status.failed { background: #f8d7da; color: #721c24; }
        .test-status.skipped { background: #fff3cd; color: #856404; }
        .test-status.pending { background: #e2e3e5; color: #383d41; }
        .test-duration { color: #6c757d; font-size: 0.9em; }
        .failure-details { background: #f8f9fa; padding: 15px; margin-top: 10px; border-left: 4px solid #dc3545; }
        .failure-details pre { background: #fff; padding: 10px; border-radius: 5px; overflow-x: auto; font-size: 0.9em; }
        .footer { text-align: center; margin-top: 40px; padding: 20px; color: #6c757d; }
        .tabs { display: flex; margin-bottom: 20px; }
        .tab { padding: 10px 20px; background: #e9ecef; border: none; cursor: pointer; border-radius: 5px 5px 0 0; margin-right: 5px; }
        .tab.active { background: white; border-bottom: 2px solid #667eea; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Todo App Test Report</h1>
            <p>Comprehensive test suite execution results</p>
        </div>

        <div class="summary">
            <div class="summary-card">
                <h3>Total Tests</h3>
                <div class="number">${summary.total}</div>
            </div>
            <div class="summary-card">
                <h3>Passed</h3>
                <div class="number passed">${summary.passed}</div>
            </div>
            <div class="summary-card">
                <h3>Failed</h3>
                <div class="number failed">${summary.failed}</div>
            </div>
            <div class="summary-card">
                <h3>Skipped</h3>
                <div class="number skipped">${summary.skipped}</div>
            </div>
            <div class="summary-card">
                <h3>Duration</h3>
                <div class="number">${(duration / 1000).toFixed(2)}s</div>
            </div>
            <div class="summary-card">
                <h3>Success Rate</h3>
                <div class="number ${summary.failed === 0 ? 'passed' : 'failed'}">${summary.successRate}%</div>
            </div>
        </div>

        <div class="tabs">
            <button class="tab active" onclick="showTab('all')">All Tests</button>
            <button class="tab" onclick="showTab('unit')">Unit Tests</button>
            <button class="tab" onclick="showTab('integration')">Integration Tests</button>
            <button class="tab" onclick="showTab('e2e')">E2E Tests</button>
            <button class="tab" onclick="showTab('performance')">Performance Tests</button>
            <button class="tab" onclick="showTab('security')">Security Tests</button>
        </div>

        ${Object.entries(testSuites).map(([category, tests]) => `
        <div class="tab-content ${category === 'all' ? 'active' : ''}" id="${category}">
            <div class="test-suite">
                <div class="test-suite-header">
                    <h3>${this.getCategoryTitle(category)} (${tests.length} tests)</h3>
                </div>
                <div class="test-list">
                    ${tests.map(test => `
                    <div class="test-item">
                        <div>
                            <div class="test-name">${test.title}</div>
                            ${test.failureMessages.length > 0 ? `
                            <div class="failure-details">
                                <pre>${test.failureMessages.join('\n')}</pre>
                            </div>
                            ` : ''}
                        </div>
                        <div>
                            <span class="test-status ${test.status}">${test.status}</span>
                            <span class="test-duration">${test.duration}ms</span>
                        </div>
                    </div>
                    `).join('')}
                </div>
            </div>
        </div>
        `).join('')}

        <div class="footer">
            <p>Report generated on ${new Date().toLocaleString()}</p>
            <p>Todo App Test Suite v1.0.0</p>
        </div>
    </div>

    <script>
        function showTab(tabName) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab content
            document.getElementById(tabName).classList.add('active');
            
            // Add active class to clicked tab
            event.target.classList.add('active');
        }
    </script>
</body>
</html>`;
  }

  generateJSONReport(results, duration) {
    return {
      timestamp: new Date().toISOString(),
      duration: duration,
      summary: this.generateSummary(results, duration),
      testSuites: this.categorizeTests(results),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      coverage: results.coverageMap ? results.coverageMap.getCoverageSummary() : null,
    };
  }

  categorizeTests(results) {
    const categories = {
      all: [],
      unit: [],
      integration: [],
      e2e: [],
      performance: [],
      security: [],
      ui: [],
      smoke: [],
    };

    results.testResults.forEach(testResult => {
      testResult.testResults.forEach(test => {
        const testData = {
          title: test.title,
          status: test.status,
          duration: test.duration,
          failureMessages: test.failureMessages,
          filePath: testResult.testFilePath,
        };

        categories.all.push(testData);

        // Categorize based on file path
        const filePath = testResult.testFilePath.toLowerCase();
        if (filePath.includes('unit')) categories.unit.push(testData);
        if (filePath.includes('integration')) categories.integration.push(testData);
        if (filePath.includes('e2e')) categories.e2e.push(testData);
        if (filePath.includes('performance')) categories.performance.push(testData);
        if (filePath.includes('security')) categories.security.push(testData);
        if (filePath.includes('ui')) categories.ui.push(testData);
        if (filePath.includes('smoke')) categories.smoke.push(testData);
      });
    });

    return categories;
  }

  generateSummary(results, duration) {
    const total = results.numTotalTests;
    const passed = results.numPassedTests;
    const failed = results.numFailedTests;
    const skipped = results.numPendingTests;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

    return {
      total,
      passed,
      failed,
      skipped,
      successRate,
      duration: duration,
    };
  }

  getCategoryTitle(category) {
    const titles = {
      all: 'All Tests',
      unit: 'Unit Tests',
      integration: 'Integration Tests',
      e2e: 'End-to-End Tests',
      performance: 'Performance Tests',
      security: 'Security Tests',
      ui: 'UI/UX Tests',
      smoke: 'Smoke Tests',
    };
    return titles[category] || category;
  }
}

module.exports = CustomReporter;
