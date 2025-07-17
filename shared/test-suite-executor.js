// Test Suite Execution Engine
// Handles the complete execution lifecycle of test suites including setup, teardown, and result collection

/**
 * Test Suite Execution Engine
 * Manages the execution of test suites with proper sequencing, error handling, and result collection
 */
class TestSuiteExecutor {
  constructor() {
    this.isExecuting = false;
    this.currentExecution = null;
    this.executionCallbacks = {
      onStart: null,
      onProgress: null,
      onTestCaseStart: null,
      onTestCaseComplete: null,
      onComplete: null,
      onError: null
    };
  }

  /**
   * Set execution callbacks for UI updates
   */
  setCallbacks(callbacks) {
    this.executionCallbacks = { ...this.executionCallbacks, ...callbacks };
  }

  /**
   * Execute a test suite
   */
  async executeTestSuite(testSuite, scripts, variables = []) {
    if (this.isExecuting) {
      throw new Error('Another test suite is currently executing');
    }

    this.isExecuting = true;
    
    // Create execution result object
    const executionResult = {
      id: `execution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      suiteId: testSuite.id,
      timestamp: new Date().toISOString(),
      duration: 0,
      status: 'running',
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        errors: 0
      },
      testCaseResults: [],
      environment: {
        url: window.location?.href || 'unknown',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    };

    this.currentExecution = executionResult;
    const startTime = Date.now();

    try {
      // Notify execution start
      if (this.executionCallbacks.onStart) {
        this.executionCallbacks.onStart(executionResult);
      }

      // Get enabled test cases in order
      const enabledTestCases = testSuite.testCases
        .filter(tc => tc.enabled)
        .sort((a, b) => a.order - b.order);

      executionResult.summary.total = enabledTestCases.length;

      // Execute setup script if configured
      if (testSuite.setupScript.enabled && testSuite.setupScript.id) {
        await this.executeSetupTeardown('setup', testSuite.setupScript.id, scripts, variables);
      }

      // Execute test cases
      for (let i = 0; i < enabledTestCases.length; i++) {
        const testCase = enabledTestCases[i];
        
        try {
          // Check dependencies
          if (testCase.dependencies && testCase.dependencies.length > 0) {
            const dependencyResults = this.checkDependencies(testCase.dependencies, executionResult.testCaseResults);
            if (!dependencyResults.allPassed) {
              // Skip this test case due to failed dependencies
              const skippedResult = this.createTestCaseResult(testCase, 'skipped', 0, 
                `Skipped due to failed dependencies: ${dependencyResults.failedDependencies.join(', ')}`);
              executionResult.testCaseResults.push(skippedResult);
              executionResult.summary.skipped++;
              continue;
            }
          }

          // Execute test case
          const testCaseResult = await this.executeTestCase(testCase, scripts, variables, testSuite.configuration);
          executionResult.testCaseResults.push(testCaseResult);

          // Update summary
          if (testCaseResult.status === 'passed') {
            executionResult.summary.passed++;
          } else if (testCaseResult.status === 'failed') {
            executionResult.summary.failed++;
          } else if (testCaseResult.status === 'error') {
            executionResult.summary.errors++;
          }

          // Notify progress
          if (this.executionCallbacks.onProgress) {
            this.executionCallbacks.onProgress(executionResult, i + 1, enabledTestCases.length);
          }

          // Check if we should stop on failure
          if (testSuite.configuration.stopOnFailure && 
              (testCaseResult.status === 'failed' || testCaseResult.status === 'error')) {
            console.log('Stopping execution due to failure (stopOnFailure is enabled)');
            
            // Mark remaining test cases as skipped
            for (let j = i + 1; j < enabledTestCases.length; j++) {
              const skippedTestCase = enabledTestCases[j];
              const skippedResult = this.createTestCaseResult(skippedTestCase, 'skipped', 0, 
                'Skipped due to previous failure (stopOnFailure enabled)');
              executionResult.testCaseResults.push(skippedResult);
              executionResult.summary.skipped++;
            }
            break;
          }

        } catch (error) {
          console.error('Error executing test case:', error);
          const errorResult = this.createTestCaseResult(testCase, 'error', 0, error.message, error);
          executionResult.testCaseResults.push(errorResult);
          executionResult.summary.errors++;

          if (testSuite.configuration.stopOnFailure) {
            break;
          }
        }
      }

      // Execute teardown script if configured
      if (testSuite.teardownScript.enabled && testSuite.teardownScript.id) {
        await this.executeSetupTeardown('teardown', testSuite.teardownScript.id, scripts, variables);
      }

      // Calculate final status
      executionResult.duration = Date.now() - startTime;
      if (executionResult.summary.errors > 0) {
        executionResult.status = 'error';
      } else if (executionResult.summary.failed > 0) {
        executionResult.status = 'failed';
      } else if (executionResult.summary.passed > 0) {
        executionResult.status = 'passed';
      } else {
        executionResult.status = 'completed';
      }

      // Notify completion
      if (this.executionCallbacks.onComplete) {
        this.executionCallbacks.onComplete(executionResult);
      }

      return executionResult;

    } catch (error) {
      console.error('Test suite execution error:', error);
      executionResult.duration = Date.now() - startTime;
      executionResult.status = 'error';
      
      if (this.executionCallbacks.onError) {
        this.executionCallbacks.onError(error, executionResult);
      }
      
      throw error;
    } finally {
      this.isExecuting = false;
      this.currentExecution = null;
    }
  }

  /**
   * Execute a single test case
   */
  async executeTestCase(testCase, scripts, variables, suiteConfiguration) {
    const script = scripts.find(s => s.id === testCase.scriptId);
    if (!script) {
      throw new Error(`Script not found for test case: ${testCase.name}`);
    }

    const startTime = Date.now();
    const timeout = testCase.timeout || suiteConfiguration.timeout || 30000;
    const retryCount = testCase.retryCount !== null ? testCase.retryCount : suiteConfiguration.retryCount || 1;

    // Notify test case start
    if (this.executionCallbacks.onTestCaseStart) {
      this.executionCallbacks.onTestCaseStart(testCase);
    }

    let lastError = null;
    let attempts = 0;

    // Retry logic
    while (attempts <= retryCount) {
      try {
        const result = await this.executeScriptWithTimeout(script, variables, timeout);
        const duration = Date.now() - startTime;

        // Determine status based on assertions
        const assertionSummary = this.extractAssertionResults(result.output);
        const status = assertionSummary.failed > 0 ? 'failed' : 'passed';

        const testCaseResult = this.createTestCaseResult(
          testCase, 
          status, 
          duration, 
          result.output, 
          null, 
          assertionSummary.results
        );

        // Notify test case completion
        if (this.executionCallbacks.onTestCaseComplete) {
          this.executionCallbacks.onTestCaseComplete(testCase, testCaseResult);
        }

        return testCaseResult;

      } catch (error) {
        lastError = error;
        attempts++;
        
        if (attempts <= retryCount) {
          console.log(`Test case "${testCase.name}" failed, retrying (attempt ${attempts}/${retryCount + 1})`);
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // All retries failed
    const duration = Date.now() - startTime;
    const testCaseResult = this.createTestCaseResult(
      testCase, 
      'error', 
      duration, 
      lastError.message, 
      lastError
    );

    // Notify test case completion
    if (this.executionCallbacks.onTestCaseComplete) {
      this.executionCallbacks.onTestCaseComplete(testCase, testCaseResult);
    }

    return testCaseResult;
  }

  /**
   * Execute setup or teardown script
   */
  async executeSetupTeardown(type, scriptId, scripts, variables) {
    const script = scripts.find(s => s.id === scriptId);
    if (!script) {
      console.warn(`${type} script not found: ${scriptId}`);
      return;
    }

    try {
      console.log(`Executing ${type} script: ${script.name}`);
      await this.executeScriptWithTimeout(script, variables, 30000);
      console.log(`${type} script completed successfully`);
    } catch (error) {
      console.error(`${type} script failed:`, error);
      throw new Error(`${type} script "${script.name}" failed: ${error.message}`);
    }
  }

  /**
   * Execute script with timeout
   */
  async executeScriptWithTimeout(script, variables, timeout) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Script execution timed out after ${timeout}ms`));
      }, timeout);

      // Process script code with variable substitution
      let processedCode = script.code;
      variables.forEach(variable => {
        const placeholder = new RegExp(`\\$\\{${variable.name}\\}`, 'g');
        processedCode = processedCode.replace(placeholder, variable.value);
      });

      // Send script to content script for execution
      browser.tabs.query({ active: true, currentWindow: true })
        .then(tabs => {
          if (tabs.length === 0) {
            throw new Error('No active tab found');
          }

          return browser.tabs.sendMessage(tabs[0].id, {
            action: 'runScript',
            code: processedCode
          });
        })
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Create a test case result object
   */
  createTestCaseResult(testCase, status, duration, output, error = null, assertions = []) {
    return {
      testCaseId: testCase.id,
      status,
      duration,
      output: output || '',
      assertions,
      error: error ? {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name
      } : null,
      screenshots: [], // TODO: Implement screenshot capture
      logs: [], // TODO: Implement log capture
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString()
    };
  }

  /**
   * Check test case dependencies
   */
  checkDependencies(dependencies, completedResults) {
    const failedDependencies = [];
    let allPassed = true;

    dependencies.forEach(depId => {
      const depResult = completedResults.find(r => r.testCaseId === depId);
      if (!depResult || depResult.status !== 'passed') {
        failedDependencies.push(depId);
        allPassed = false;
      }
    });

    return { allPassed, failedDependencies };
  }

  /**
   * Extract assertion results from script output
   */
  extractAssertionResults(output) {
    // This is a simplified implementation
    // In a real implementation, we would capture assertion results from the assertion library
    const results = [];
    let passed = 0;
    let failed = 0;

    if (output && typeof output === 'string') {
      // Look for assertion patterns in the output
      const lines = output.split('\n');
      lines.forEach(line => {
        if (line.includes('✓')) {
          passed++;
          results.push({ passed: true, message: line.trim() });
        } else if (line.includes('✗')) {
          failed++;
          results.push({ passed: false, message: line.trim() });
        }
      });
    }

    return { results, passed, failed, total: passed + failed };
  }

  /**
   * Stop current execution
   */
  stopExecution() {
    if (this.isExecuting && this.currentExecution) {
      this.currentExecution.status = 'cancelled';
      this.isExecuting = false;
      
      if (this.executionCallbacks.onComplete) {
        this.executionCallbacks.onComplete(this.currentExecution);
      }
      
      this.currentExecution = null;
    }
  }

  /**
   * Get current execution status
   */
  getExecutionStatus() {
    return {
      isExecuting: this.isExecuting,
      currentExecution: this.currentExecution
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TestSuiteExecutor };
}
