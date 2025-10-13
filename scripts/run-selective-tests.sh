#!/bin/bash

# Selective Test Runner for Todo App
# This script can run specific test categories and generate proper reports

echo "🚀 Todo App Selective Test Runner"
echo "================================="

# Function to run unit tests only
run_unit_tests() {
    echo "🧪 Running Unit Tests Only..."
    echo "-----------------------------"
    npx jest tests/unit/ --verbose --coverage --silent
    return $?
}

# Function to run integration tests only
run_integration_tests() {
    echo "🔗 Running Integration Tests Only..."
    echo "------------------------------------"
    npx jest tests/integration/ --verbose --silent --forceExit
    return $?
}

# Function to run security tests only
run_security_tests() {
    echo "🔒 Running Security Tests Only..."
    echo "---------------------------------"
    npx jest tests/security/ --verbose --silent --forceExit
    return $?
}

# Function to run performance tests only
run_performance_tests() {
    echo "⚡ Running Performance Tests Only..."
    echo "------------------------------------"
    npx jest tests/performance/ --verbose --silent --forceExit
    return $?
}

# Function to run smoke tests only
run_smoke_tests() {
    echo "💨 Running Smoke Tests Only..."
    echo "------------------------------"
    npx jest tests/smoke/ --verbose --silent --forceExit
    return $?
}

# Function to run UI tests only (without E2E)
run_ui_tests() {
    echo "🎨 Running UI/UX Tests Only..."
    echo "------------------------------"
    npx jest tests/ui/ --verbose --silent
    return $?
}

# Function to run working tests (unit + integration + security + performance + smoke)
run_working_tests() {
    echo "✅ Running All Working Tests..."
    echo "==============================="
    
    local results=()
    local total_tests=0
    local passed_tests=0
    local failed_tests=0
    
    # Run each working test category
    echo "Starting selective test execution..."
    echo ""
    
    # Unit Tests
    echo "🧪 Unit Tests..."
    if run_unit_tests; then
        echo "✅ Unit Tests: PASSED"
        results+=("unit:passed")
    else
        echo "❌ Unit Tests: FAILED"
        results+=("unit:failed")
    fi
    echo ""
    
    # Integration Tests
    echo "🔗 Integration Tests..."
    if run_integration_tests; then
        echo "✅ Integration Tests: PASSED"
        results+=("integration:passed")
    else
        echo "❌ Integration Tests: FAILED"
        results+=("integration:failed")
    fi
    echo ""
    
    # Security Tests
    echo "🔒 Security Tests..."
    if run_security_tests; then
        echo "✅ Security Tests: PASSED"
        results+=("security:passed")
    else
        echo "❌ Security Tests: FAILED"
        results+=("security:failed")
    fi
    echo ""
    
    # Performance Tests
    echo "⚡ Performance Tests..."
    if run_performance_tests; then
        echo "✅ Performance Tests: PASSED"
        results+=("performance:passed")
    else
        echo "❌ Performance Tests: FAILED"
        results+=("performance:failed")
    fi
    echo ""
    
    # Smoke Tests
    echo "💨 Smoke Tests..."
    if run_smoke_tests; then
        echo "✅ Smoke Tests: PASSED"
        results+=("smoke:passed")
    else
        echo "❌ Smoke Tests: FAILED"
        results+=("smoke:failed")
    fi
    echo ""
    
    # UI Tests
    echo "🎨 UI/UX Tests..."
    if run_ui_tests; then
        echo "✅ UI/UX Tests: PASSED"
        results+=("ui:passed")
    else
        echo "❌ UI/UX Tests: FAILED"
        results+=("ui:failed")
    fi
    echo ""
    
    # Generate enhanced report with working tests only
    echo "📊 Generating Enhanced Test Report..."
    echo "====================================="
    node scripts/generate-enhanced-report.js
    
    # Summary
    echo ""
    echo "📋 Test Execution Summary:"
    echo "=========================="
    for result in "${results[@]}"; do
        IFS=':' read -r category status <<< "$result"
        if [ "$status" = "passed" ]; then
            echo "✅ $category: PASSED"
        else
            echo "❌ $category: FAILED"
        fi
    done
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  unit                    Run unit tests only"
    echo "  integration             Run integration tests only"
    echo "  security                Run security tests only"
    echo "  performance             Run performance tests only"
    echo "  smoke                   Run smoke tests only"
    echo "  ui                      Run UI/UX tests only"
    echo "  working                 Run all working tests (excludes E2E)"
    echo "  help                    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 unit"
    echo "  $0 integration"
    echo "  $0 working"
    echo ""
    echo "Note: E2E tests are excluded from 'working' as they require running servers."
}

# Main script logic
case "$1" in
    "unit")
        run_unit_tests
        echo ""
        echo "📊 Generating Enhanced Test Report..."
        node scripts/generate-enhanced-report.js
        ;;
    "integration")
        run_integration_tests
        ;;
    "security")
        run_security_tests
        ;;
    "performance")
        run_performance_tests
        ;;
    "smoke")
        run_smoke_tests
        ;;
    "ui")
        run_ui_tests
        ;;
    "working")
        run_working_tests
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    "")
        echo "No option provided. Running working tests by default..."
        echo ""
        run_working_tests
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
