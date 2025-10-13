// HTML test results processor for detailed reporting
const fs = require('fs');
const path = require('path');

class HTMLReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options;
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
      console: testResult.console,
    });
  }

  onRunComplete(contexts, results) {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    console.log('📊 Generating HTML test report...');
    
    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), '..', 'testreports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate comprehensive HTML report
    const htmlReport = this.generateHTMLReport(results, duration);
    const reportPath = path.join(outputDir, 'test-report.html');
    
    fs.writeFileSync(reportPath, htmlReport);
    console.log(`📄 HTML test report generated: ${reportPath}`);
    
    // Generate summary report
    const summaryReport = this.generateSummaryReport(results, duration);
    const summaryPath = path.join(outputDir, 'test-summary.html');
    
    fs.writeFileSync(summaryPath, summaryReport);
    console.log(`📊 Test summary generated: ${summaryPath}`);
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
    <title>Todo App - Comprehensive Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: #f8f9fa; 
        }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px; 
            border-radius: 15px; 
            margin-bottom: 30px; 
            text-align: center; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .header h1 { font-size: 3em; margin-bottom: 15px; font-weight: 700; }
        .header p { font-size: 1.3em; opacity: 0.9; }
        .summary { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin-bottom: 40px; 
        }
        .summary-card { 
            background: white; 
            padding: 25px; 
            border-radius: 15px; 
            box-shadow: 0 5px 20px rgba(0,0,0,0.1); 
            text-align: center; 
            transition: transform 0.3s ease;
        }
        .summary-card:hover { transform: translateY(-5px); }
        .summary-card h3 { color: #667eea; margin-bottom: 15px; font-size: 1.1em; }
        .summary-card .number { font-size: 2.5em; font-weight: bold; margin-bottom: 10px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .pending { color: #6c757d; }
        .test-suite { 
            background: white; 
            margin-bottom: 25px; 
            border-radius: 15px; 
            box-shadow: 0 5px 20px rgba(0,0,0,0.1); 
            overflow: hidden; 
        }
        .test-suite-header { 
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); 
            padding: 20px 25px; 
            border-bottom: 1px solid #dee2e6; 
        }
        .test-suite-header h3 { color: #495057; font-size: 1.3em; }
        .test-list { padding: 0; }
        .test-item { 
            padding: 20px 25px; 
            border-bottom: 1px solid #f1f3f4; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            transition: background-color 0.2s ease;
        }
        .test-item:hover { background-color: #f8f9fa; }
        .test-item:last-child { border-bottom: none; }
        .test-name { font-weight: 500; font-size: 1.1em; }
        .test-status { 
            padding: 6px 15px; 
            border-radius: 25px; 
            font-size: 0.85em; 
            font-weight: bold; 
            text-transform: uppercase;
        }
        .test-status.passed { background: #d4edda; color: #155724; }
        .test-status.failed { background: #f8d7da; color: #721c24; }
        .test-status.skipped { background: #fff3cd; color: #856404; }
        .test-status.pending { background: #e2e3e5; color: #383d41; }
        .test-duration { color: #6c757d; font-size: 0.9em; margin-left: 10px; }
        .failure-details { 
            background: #f8f9fa; 
            padding: 20px; 
            margin-top: 15px; 
            border-left: 4px solid #dc3545; 
            border-radius: 5px;
        }
        .failure-details pre { 
            background: #fff; 
            padding: 15px; 
            border-radius: 5px; 
            overflow-x: auto; 
            font-size: 0.9em; 
            border: 1px solid #dee2e6;
        }
        .footer { 
            text-align: center; 
            margin-top: 50px; 
            padding: 30px; 
            color: #6c757d; 
            background: white;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }
        .tabs { 
            display: flex; 
            margin-bottom: 25px; 
            background: white;
            border-radius: 10px;
            padding: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .tab { 
            padding: 12px 25px; 
            background: transparent; 
            border: none; 
            cursor: pointer; 
            border-radius: 8px; 
            margin-right: 5px; 
            transition: all 0.3s ease;
            font-weight: 500;
        }
        .tab.active { 
            background: #667eea; 
            color: white;
            box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
        }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .coverage-section {
            background: white;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }
        .coverage-bar {
            background: #e9ecef;
            border-radius: 10px;
            height: 20px;
            margin: 10px 0;
            overflow: hidden;
        }
        .coverage-fill {
            height: 100%;
            border-radius: 10px;
            transition: width 0.3s ease;
        }
        .coverage-high { background: #28a745; }
        .coverage-medium { background: #ffc107; }
        .coverage-low { background: #dc3545; }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .metric-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }
        .metric-label {
            color: #6c757d;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Todo App Test Report</h1>
            <p>Comprehensive test suite execution results</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
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
            <button class="tab" onclick="showTab('ui')">UI/UX Tests</button>
            <button class="tab" onclick="showTab('smoke')">Smoke Tests</button>
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

        <div class="coverage-section">
            <h3>📊 Test Coverage</h3>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">${summary.coverage?.statements || 0}%</div>
                    <div class="metric-label">Statements</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${summary.coverage?.branches || 0}%</div>
                    <div class="metric-label">Branches</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${summary.coverage?.functions || 0}%</div>
                    <div class="metric-label">Functions</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${summary.coverage?.lines || 0}%</div>
                    <div class="metric-label">Lines</div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p><strong>Todo App Test Suite v1.0.0</strong></p>
            <p>Report generated on ${new Date().toLocaleString()}</p>
            <p>Test Environment: ${process.env.NODE_ENV || 'development'}</p>
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

        // Add some interactivity
        document.addEventListener('DOMContentLoaded', function() {
            // Animate coverage bars
            const coverageBars = document.querySelectorAll('.coverage-fill');
            coverageBars.forEach(bar => {
                const width = bar.style.width;
                bar.style.width = '0%';
                setTimeout(() => {
                    bar.style.width = width;
                }, 500);
            });
        });
    </script>
</body>
</html>`;
  }

  generateSummaryReport(results, duration) {
    const summary = this.generateSummary(results, duration);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo App - Test Summary</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f8f9fa; 
        }
        .container { max-width: 800px; margin: 0 auto; }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px; 
            border-radius: 10px; 
            text-align: center; 
            margin-bottom: 30px; 
        }
        .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px; 
        }
        .summary-card { 
            background: white; 
            padding: 20px; 
            border-radius: 10px; 
            text-align: center; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .number { font-size: 2em; font-weight: bold; margin-bottom: 10px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .pending { color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Test Summary</h1>
            <p>Quick overview of test results</p>
        </div>
        
        <div class="summary-grid">
            <div class="summary-card">
                <div class="number">${summary.total}</div>
                <div>Total Tests</div>
            </div>
            <div class="summary-card">
                <div class="number passed">${summary.passed}</div>
                <div>Passed</div>
            </div>
            <div class="summary-card">
                <div class="number failed">${summary.failed}</div>
                <div>Failed</div>
            </div>
            <div class="summary-card">
                <div class="number skipped">${summary.skipped}</div>
                <div>Skipped</div>
            </div>
            <div class="summary-card">
                <div class="number">${(duration / 1000).toFixed(2)}s</div>
                <div>Duration</div>
            </div>
            <div class="summary-card">
                <div class="number ${summary.failed === 0 ? 'passed' : 'failed'}">${summary.successRate}%</div>
                <div>Success Rate</div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="test-report.html" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                View Detailed Report
            </a>
        </div>
    </div>
</body>
</html>`;
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
      coverage: results.coverageMap ? results.coverageMap.getCoverageSummary() : null,
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

module.exports = HTMLReporter;
