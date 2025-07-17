// Test Suite Data Models and Utilities
// This file contains the data structures and utility functions for the test suite management system

/**
 * Test Suite Data Model
 */
class TestSuite {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.name = data.name || '';
    this.description = data.description || '';
    this.tags = data.tags || [];
    this.setupScript = data.setupScript || { id: null, enabled: false };
    this.teardownScript = data.teardownScript || { id: null, enabled: false };
    this.testCases = (data.testCases || []).map(tc => new TestCase(tc));
    this.configuration = {
      stopOnFailure: data.configuration?.stopOnFailure ?? true,
      timeout: data.configuration?.timeout ?? 30000,
      retryCount: data.configuration?.retryCount ?? 1,
      parallel: data.configuration?.parallel ?? false,
      ...data.configuration
    };
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.lastExecuted = data.lastExecuted || null;
    this.executionHistory = (data.executionHistory || []).map(eh => new ExecutionResult(eh));
  }

  generateId() {
    return 'suite_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  addTestCase(testCase) {
    const newTestCase = new TestCase({
      ...testCase,
      order: this.testCases.length
    });
    this.testCases.push(newTestCase);
    this.updatedAt = new Date().toISOString();
    return newTestCase;
  }

  removeTestCase(testCaseId) {
    this.testCases = this.testCases.filter(tc => tc.id !== testCaseId);
    this.reorderTestCases();
    this.updatedAt = new Date().toISOString();
  }

  reorderTestCases() {
    this.testCases.forEach((tc, index) => {
      tc.order = index;
    });
  }

  moveTestCase(testCaseId, newIndex) {
    const testCase = this.testCases.find(tc => tc.id === testCaseId);
    if (!testCase) return false;

    this.testCases = this.testCases.filter(tc => tc.id !== testCaseId);
    this.testCases.splice(newIndex, 0, testCase);
    this.reorderTestCases();
    this.updatedAt = new Date().toISOString();
    return true;
  }

  getEnabledTestCases() {
    return this.testCases.filter(tc => tc.enabled).sort((a, b) => a.order - b.order);
  }

  validate() {
    const errors = [];
    
    if (!this.name.trim()) {
      errors.push('Suite name is required');
    }
    
    if (this.testCases.length === 0) {
      errors.push('At least one test case is required');
    }
    
    this.testCases.forEach((tc, index) => {
      const tcErrors = tc.validate();
      tcErrors.forEach(error => {
        errors.push(`Test Case ${index + 1}: ${error}`);
      });
    });
    
    return errors;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      tags: this.tags,
      setupScript: this.setupScript,
      teardownScript: this.teardownScript,
      testCases: this.testCases.map(tc => tc.toJSON()),
      configuration: this.configuration,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastExecuted: this.lastExecuted,
      executionHistory: this.executionHistory.map(eh => eh.toJSON())
    };
  }
}

/**
 * Test Case Data Model
 */
class TestCase {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.name = data.name || '';
    this.description = data.description || '';
    this.scriptId = data.scriptId || null;
    this.enabled = data.enabled ?? true;
    this.order = data.order ?? 0;
    this.expectedResult = {
      type: data.expectedResult?.type || 'success',
      assertions: data.expectedResult?.assertions || [],
      ...data.expectedResult
    };
    this.timeout = data.timeout || null; // null means use suite default
    this.retryCount = data.retryCount || null; // null means use suite default
    this.dependencies = data.dependencies || [];
    this.tags = data.tags || [];
  }

  generateId() {
    return 'testcase_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  validate() {
    const errors = [];
    
    if (!this.name.trim()) {
      errors.push('Test case name is required');
    }
    
    if (!this.scriptId) {
      errors.push('Script selection is required');
    }
    
    if (this.timeout !== null && (this.timeout < 1000 || this.timeout > 300000)) {
      errors.push('Timeout must be between 1 and 300 seconds');
    }
    
    if (this.retryCount !== null && (this.retryCount < 0 || this.retryCount > 5)) {
      errors.push('Retry count must be between 0 and 5');
    }
    
    return errors;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      scriptId: this.scriptId,
      enabled: this.enabled,
      order: this.order,
      expectedResult: this.expectedResult,
      timeout: this.timeout,
      retryCount: this.retryCount,
      dependencies: this.dependencies,
      tags: this.tags
    };
  }
}

/**
 * Execution Result Data Model
 */
class ExecutionResult {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.suiteId = data.suiteId || null;
    this.timestamp = data.timestamp || new Date().toISOString();
    this.duration = data.duration || 0;
    this.status = data.status || 'running';
    this.summary = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: 0,
      ...data.summary
    };
    this.testCaseResults = (data.testCaseResults || []).map(tcr => new TestCaseResult(tcr));
    this.environment = {
      url: '',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      ...data.environment
    };
  }

  generateId() {
    return 'execution_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  addTestCaseResult(testCaseResult) {
    this.testCaseResults.push(new TestCaseResult(testCaseResult));
    this.updateSummary();
  }

  updateSummary() {
    this.summary = {
      total: this.testCaseResults.length,
      passed: this.testCaseResults.filter(tcr => tcr.status === 'passed').length,
      failed: this.testCaseResults.filter(tcr => tcr.status === 'failed').length,
      skipped: this.testCaseResults.filter(tcr => tcr.status === 'skipped').length,
      errors: this.testCaseResults.filter(tcr => tcr.status === 'error').length
    };

    // Determine overall status
    if (this.summary.errors > 0) {
      this.status = 'error';
    } else if (this.summary.failed > 0) {
      this.status = 'failed';
    } else if (this.summary.total > 0 && this.summary.passed === this.summary.total) {
      this.status = 'passed';
    } else {
      this.status = 'running';
    }
  }

  toJSON() {
    return {
      id: this.id,
      suiteId: this.suiteId,
      timestamp: this.timestamp,
      duration: this.duration,
      status: this.status,
      summary: this.summary,
      testCaseResults: this.testCaseResults.map(tcr => tcr.toJSON()),
      environment: this.environment
    };
  }
}

/**
 * Test Case Result Data Model
 */
class TestCaseResult {
  constructor(data = {}) {
    this.testCaseId = data.testCaseId || null;
    this.status = data.status || 'pending';
    this.duration = data.duration || 0;
    this.output = data.output || '';
    this.assertions = data.assertions || [];
    this.error = data.error || null;
    this.screenshots = data.screenshots || [];
    this.logs = data.logs || [];
    this.startTime = data.startTime || null;
    this.endTime = data.endTime || null;
  }

  toJSON() {
    return {
      testCaseId: this.testCaseId,
      status: this.status,
      duration: this.duration,
      output: this.output,
      assertions: this.assertions,
      error: this.error,
      screenshots: this.screenshots,
      logs: this.logs,
      startTime: this.startTime,
      endTime: this.endTime
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TestSuite, TestCase, ExecutionResult, TestCaseResult };
}
