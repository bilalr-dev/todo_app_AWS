#!/bin/bash

# Todo App Test Runner
# This script runs different types of tests for the Todo App

echo "🚀 Todo App Test Runner"
echo "======================="

# Function to run unit tests
run_unit_tests() {
    echo "📋 Running Unit Tests..."
    echo "------------------------"
    npx jest tests/unit/ --verbose --coverage
    
    echo ""
    echo "📊 Generating enhanced test report..."
    node scripts/generate-enhanced-report.js
}

# Function to run specific test suite
run_specific_tests() {
    local test_path=$1
    echo "🎯 Running Specific Tests: $test_path"
    echo "------------------------------------"
    npx jest "$test_path" --verbose
}

# Function to run all tests (when available)
run_all_tests() {
    echo "🔄 Running All Available Tests..."
    echo "--------------------------------"
    npx jest --verbose --coverage
    
    echo ""
    echo "📊 Generating enhanced test report..."
    node scripts/generate-enhanced-report.js
}

# Function to show test coverage
show_coverage() {
    echo "📊 Opening Test Coverage Report..."
    echo "---------------------------------"
    if [ -f "testreports/coverage/index.html" ]; then
        open testreports/coverage/index.html
    else
        echo "Coverage report not found. Run tests first."
    fi
}

# Function to show test report
show_test_report() {
    echo "📄 Opening Test Report..."
    echo "------------------------"
    if [ -f "testreports/test-report.html" ]; then
        open testreports/test-report.html
    else
        echo "Test report not found. Run tests first."
    fi
}

# Function to generate comprehensive report
generate_comprehensive_report() {
    echo "🚀 Generating Comprehensive Test Report..."
    echo "------------------------------------------"
    node generate-comprehensive-report.js
}

# Function to generate detailed report
generate_detailed_report() {
    echo "🚀 Generating Detailed Test Report..."
    echo "------------------------------------"
    node generate-detailed-report.js
}

# Function to generate enhanced report
generate_enhanced_report() {
    echo "🚀 Generating Enhanced Test Report..."
    echo "------------------------------------"
    node scripts/generate-enhanced-report.js
}

# Function to clean test artifacts
clean_tests() {
    echo "🧹 Cleaning Test Artifacts..."
    echo "-----------------------------"
    rm -rf testreports/
    rm -rf coverage/
    echo "Test artifacts cleaned."
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  unit                    Run unit tests only (auto-generates enhanced report)"
    echo "  specific <path>         Run specific test file or directory"
    echo "  all                     Run all available tests (auto-generates enhanced report)"
    echo "  coverage                Show coverage report"
    echo "  report                  Show basic test report"
    echo "  comprehensive           Generate comprehensive test report"
    echo "  detailed                Generate detailed test report with all categories"
    echo "  enhanced                Generate enhanced test report (recommended format)"
    echo "  clean                   Clean test artifacts"
    echo "  help                    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 unit"
    echo "  $0 specific tests/unit/utils/helpers.test.js"
    echo "  $0 specific tests/unit/components/"
    echo "  $0 coverage"
    echo "  $0 comprehensive"
    echo "  $0 detailed"
    echo "  $0 enhanced"
    echo "  $0 clean"
}

# Main script logic
case "$1" in
    "unit")
        run_unit_tests
        ;;
    "specific")
        if [ -z "$2" ]; then
            echo "Error: Please provide a test path"
            echo "Usage: $0 specific <test-path>"
            exit 1
        fi
        run_specific_tests "$2"
        ;;
    "all")
        run_all_tests
        ;;
    "coverage")
        show_coverage
        ;;
    "report")
        show_test_report
        ;;
    "comprehensive")
        generate_comprehensive_report
        ;;
    "detailed")
        generate_detailed_report
        ;;
    "enhanced")
        generate_enhanced_report
        ;;
    "clean")
        clean_tests
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    "")
        echo "No option provided. Running unit tests by default..."
        echo ""
        run_unit_tests
        ;;
    *)
        echo "Unknown option: $1"
        echo ""
        show_help
        exit 1
        ;;
esac

echo ""
echo "✅ Test execution completed!"
