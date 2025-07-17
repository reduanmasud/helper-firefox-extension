# Test Suite Management System Design

## Overview
This document outlines the design for the Test Suite Management System that will be added to the Console Script Manager extension. This system will transform the extension from a simple script runner into a comprehensive testing framework.

## Data Structure Design

### Test Suite Schema
```javascript
{
  id: string,                    // Unique identifier
  name: string,                  // Suite name
  description: string,           // Optional description
  tags: string[],               // Categorization tags
  setupScript: {                // Optional setup script
    id: string,                 // Reference to script ID
    enabled: boolean
  },
  teardownScript: {             // Optional teardown script
    id: string,                 // Reference to script ID
    enabled: boolean
  },
  testCases: TestCase[],        // Array of test cases
  configuration: {              // Suite-level configuration
    stopOnFailure: boolean,     // Stop execution on first failure
    timeout: number,            // Default timeout for test cases
    retryCount: number,         // Number of retries for failed tests
    parallel: boolean           // Execute test cases in parallel
  },
  createdAt: string,            // ISO timestamp
  updatedAt: string,            // ISO timestamp
  lastExecuted: string,         // ISO timestamp of last execution
  executionHistory: ExecutionResult[] // Recent execution results
}
```

### Test Case Schema
```javascript
{
  id: string,                   // Unique identifier
  name: string,                 // Test case name
  description: string,          // Optional description
  scriptId: string,             // Reference to script ID
  enabled: boolean,             // Whether to include in execution
  order: number,                // Execution order within suite
  expectedResult: {             // Expected outcome
    type: 'success' | 'failure' | 'custom',
    assertions: Assertion[]     // Expected assertions
  },
  timeout: number,              // Override suite timeout
  retryCount: number,           // Override suite retry count
  dependencies: string[],       // IDs of test cases that must pass first
  tags: string[]                // Test case specific tags
}
```

### Execution Result Schema
```javascript
{
  id: string,                   // Unique execution ID
  suiteId: string,              // Reference to test suite
  timestamp: string,            // Execution start time
  duration: number,             // Total execution time in ms
  status: 'passed' | 'failed' | 'error' | 'cancelled',
  summary: {
    total: number,              // Total test cases
    passed: number,             // Passed test cases
    failed: number,             // Failed test cases
    skipped: number,            // Skipped test cases
    errors: number              // Test cases with errors
  },
  testCaseResults: TestCaseResult[],
  environment: {                // Execution environment info
    url: string,                // Page URL
    userAgent: string,          // Browser info
    timestamp: string
  }
}
```

### Test Case Result Schema
```javascript
{
  testCaseId: string,           // Reference to test case
  status: 'passed' | 'failed' | 'error' | 'skipped',
  duration: number,             // Execution time in ms
  output: string,               // Script output
  assertions: AssertionResult[], // Assertion results
  error: {                      // Error details if failed
    message: string,
    stack: string,
    type: string
  },
  screenshots: string[],        // Base64 encoded screenshots
  logs: LogEntry[]              // Captured console logs
}
```

## UI Design Specifications

### Test Suites Tab Layout
```
┌─────────────────────────────────────────────────────────┐
│ Test Suites                                    [+ New]  │
├─────────────────────────────────────────────────────────┤
│ ┌─ My Test Suite 1                          [▶] [⚙] [×]│
│ │  ├─ Setup: Login Script                              │
│ │  ├─ Test Case 1: Verify Homepage                    │
│ │  ├─ Test Case 2: Check Navigation                   │
│ │  └─ Teardown: Logout Script                         │
│ │  Last run: 2 hours ago (3/3 passed)                 │
│ └─────────────────────────────────────────────────────│
│ ┌─ API Testing Suite                        [▶] [⚙] [×]│
│ │  ├─ Test Case 1: GET /users                         │
│ │  ├─ Test Case 2: POST /users                        │
│ │  └─ Test Case 3: DELETE /users                      │
│ │  Last run: Never                                     │
│ └─────────────────────────────────────────────────────│
└─────────────────────────────────────────────────────────┘
```

### Test Suite Editor
```
┌─────────────────────────────────────────────────────────┐
│ Suite Name: [My Test Suite                           ]  │
│ Description: [Optional description                   ]  │
│ Tags: [ui, smoke, regression                         ]  │
├─────────────────────────────────────────────────────────┤
│ Setup Script: [Select Script ▼] [☑ Enabled]            │
│ Teardown Script: [Select Script ▼] [☑ Enabled]         │
├─────────────────────────────────────────────────────────┤
│ Test Cases:                                    [+ Add]  │
│ ┌─ Test Case 1                              [↑] [↓] [×]│
│ │  Name: [Verify Homepage                           ]  │
│ │  Script: [Homepage Test ▼]                          │
│ │  Enabled: [☑]  Timeout: [30s]  Retry: [1]          │
│ └─────────────────────────────────────────────────────│
│ ┌─ Test Case 2                              [↑] [↓] [×]│
│ │  Name: [Check Navigation                          ]  │
│ │  Script: [Navigation Test ▼]                        │
│ │  Enabled: [☑]  Timeout: [30s]  Retry: [1]          │
│ └─────────────────────────────────────────────────────│
├─────────────────────────────────────────────────────────┤
│ Configuration:                                          │
│ [☑] Stop on first failure                              │
│ [☐] Run test cases in parallel                         │
│ Default timeout: [30] seconds                          │
│ Default retry count: [1]                               │
├─────────────────────────────────────────────────────────┤
│                                    [Cancel] [Save]     │
└─────────────────────────────────────────────────────────┘
```

### Test Execution View
```
┌─────────────────────────────────────────────────────────┐
│ Running: My Test Suite                         [⏹ Stop] │
├─────────────────────────────────────────────────────────┤
│ Progress: ████████████░░░░░░░░ 3/5 (60%)               │
│ Elapsed: 00:02:15                                       │
├─────────────────────────────────────────────────────────┤
│ ✓ Setup: Login Script (1.2s)                           │
│ ✓ Test Case 1: Verify Homepage (0.8s)                  │
│ ✓ Test Case 2: Check Navigation (2.1s)                 │
│ ⏳ Test Case 3: Form Submission (running...)            │
│ ⏸ Test Case 4: Error Handling (pending)                │
│ ⏸ Teardown: Logout Script (pending)                    │
└─────────────────────────────────────────────────────────┘
```

## Integration Points

### With Existing Scripts
- Test suites reference existing scripts by ID
- Scripts can be used in multiple test suites
- Setup/teardown scripts are regular scripts with special roles

### With Variables
- Test suites can define suite-level variables
- Variables are inherited by all test cases in the suite
- Test case variables override suite variables

### With Results System
- Enhanced results tab shows both individual script results and test suite results
- Hierarchical display of suite > test case > assertions
- Historical tracking of test suite executions

## Storage Strategy

### Browser Storage Structure
```javascript
{
  scripts: Script[],           // Existing scripts
  variables: Variable[],       // Existing variables
  results: Result[],           // Individual script results
  testSuites: TestSuite[],     // New: Test suite definitions
  suiteResults: ExecutionResult[], // New: Test suite execution results
  settings: {                  // Enhanced settings
    defaultTimeout: number,
    maxResultHistory: number,
    autoScreenshot: boolean
  }
}
```

### Migration Strategy
- Existing scripts and variables remain unchanged
- New storage keys added for test suite functionality
- Backward compatibility maintained for existing features

## Next Steps
1. Implement the data model and storage layer
2. Create the UI components for test suite management
3. Build the test execution engine
4. Integrate with assertion library
5. Enhance results display system
