// Assertion Library for Console Script Manager
// This library provides comprehensive assertion functions for test validation

/**
 * Assertion Result Class
 * Represents the result of an assertion
 */
class AssertionResult {
  constructor(passed, message, expected = null, actual = null, stack = null) {
    this.passed = passed;
    this.message = message;
    this.expected = expected;
    this.actual = actual;
    this.stack = stack;
    this.timestamp = new Date().toISOString();
  }

  toString() {
    if (this.passed) {
      return `✓ ${this.message}`;
    } else {
      let result = `✗ ${this.message}`;
      if (this.expected !== null && this.actual !== null) {
        result += `\n  Expected: ${this.formatValue(this.expected)}`;
        result += `\n  Actual: ${this.formatValue(this.actual)}`;
      }
      if (this.stack) {
        result += `\n  Stack: ${this.stack}`;
      }
      return result;
    }
  }

  formatValue(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }
}

/**
 * Assertion Context Class
 * Manages assertion execution and result collection
 */
class AssertionContext {
  constructor() {
    this.results = [];
    this.currentTest = null;
  }

  setCurrentTest(testName) {
    this.currentTest = testName;
  }

  addResult(result) {
    this.results.push(result);
    
    // Log to console for immediate feedback
    if (result.passed) {
      console.log(`%c${result.toString()}`, 'color: green');
    } else {
      console.error(`%c${result.toString()}`, 'color: red');
    }
    
    return result;
  }

  getResults() {
    return this.results;
  }

  getSummary() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    
    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? (passed / total) * 100 : 0
    };
  }

  clear() {
    this.results = [];
    this.currentTest = null;
  }
}

/**
 * Main Assertion Library Class
 */
class AssertionLibrary {
  constructor() {
    this.context = new AssertionContext();
  }

  // Core assertion methods
  
  /**
   * Assert that two values are equal
   */
  assertEquals(actual, expected, message = null) {
    const defaultMessage = message || `Expected ${this.formatValue(actual)} to equal ${this.formatValue(expected)}`;
    const passed = actual === expected;
    const result = new AssertionResult(passed, defaultMessage, expected, actual, this.getStack());
    return this.context.addResult(result);
  }

  /**
   * Assert that two values are not equal
   */
  assertNotEquals(actual, expected, message = null) {
    const defaultMessage = message || `Expected ${this.formatValue(actual)} to not equal ${this.formatValue(expected)}`;
    const passed = actual !== expected;
    const result = new AssertionResult(passed, defaultMessage, `not ${expected}`, actual, this.getStack());
    return this.context.addResult(result);
  }

  /**
   * Assert that a value is true
   */
  assertTrue(actual, message = null) {
    const defaultMessage = message || `Expected ${this.formatValue(actual)} to be true`;
    const passed = actual === true;
    const result = new AssertionResult(passed, defaultMessage, true, actual, this.getStack());
    return this.context.addResult(result);
  }

  /**
   * Assert that a value is false
   */
  assertFalse(actual, message = null) {
    const defaultMessage = message || `Expected ${this.formatValue(actual)} to be false`;
    const passed = actual === false;
    const result = new AssertionResult(passed, defaultMessage, false, actual, this.getStack());
    return this.context.addResult(result);
  }

  /**
   * Assert that a value is null
   */
  assertNull(actual, message = null) {
    const defaultMessage = message || `Expected ${this.formatValue(actual)} to be null`;
    const passed = actual === null;
    const result = new AssertionResult(passed, defaultMessage, null, actual, this.getStack());
    return this.context.addResult(result);
  }

  /**
   * Assert that a value is not null
   */
  assertNotNull(actual, message = null) {
    const defaultMessage = message || `Expected ${this.formatValue(actual)} to not be null`;
    const passed = actual !== null;
    const result = new AssertionResult(passed, defaultMessage, 'not null', actual, this.getStack());
    return this.context.addResult(result);
  }

  /**
   * Assert that a value is undefined
   */
  assertUndefined(actual, message = null) {
    const defaultMessage = message || `Expected ${this.formatValue(actual)} to be undefined`;
    const passed = actual === undefined;
    const result = new AssertionResult(passed, defaultMessage, undefined, actual, this.getStack());
    return this.context.addResult(result);
  }

  /**
   * Assert that a value is defined (not undefined)
   */
  assertDefined(actual, message = null) {
    const defaultMessage = message || `Expected ${this.formatValue(actual)} to be defined`;
    const passed = actual !== undefined;
    const result = new AssertionResult(passed, defaultMessage, 'defined', actual, this.getStack());
    return this.context.addResult(result);
  }

  /**
   * Assert that a string contains a substring
   */
  assertContains(haystack, needle, message = null) {
    const defaultMessage = message || `Expected "${haystack}" to contain "${needle}"`;
    const passed = String(haystack).includes(String(needle));
    const result = new AssertionResult(passed, defaultMessage, `contains "${needle}"`, haystack, this.getStack());
    return this.context.addResult(result);
  }

  /**
   * Assert that a string does not contain a substring
   */
  assertNotContains(haystack, needle, message = null) {
    const defaultMessage = message || `Expected "${haystack}" to not contain "${needle}"`;
    const passed = !String(haystack).includes(String(needle));
    const result = new AssertionResult(passed, defaultMessage, `does not contain "${needle}"`, haystack, this.getStack());
    return this.context.addResult(result);
  }

  /**
   * Assert that a string matches a regular expression
   */
  assertMatches(actual, pattern, message = null) {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    const defaultMessage = message || `Expected "${actual}" to match pattern ${regex}`;
    const passed = regex.test(String(actual));
    const result = new AssertionResult(passed, defaultMessage, `matches ${regex}`, actual, this.getStack());
    return this.context.addResult(result);
  }

  /**
   * Assert that an array contains a specific element
   */
  assertArrayContains(array, element, message = null) {
    const defaultMessage = message || `Expected array to contain ${this.formatValue(element)}`;
    const passed = Array.isArray(array) && array.includes(element);
    const result = new AssertionResult(passed, defaultMessage, `contains ${element}`, array, this.getStack());
    return this.context.addResult(result);
  }

  /**
   * Assert that an array has a specific length
   */
  assertArrayLength(array, expectedLength, message = null) {
    const actualLength = Array.isArray(array) ? array.length : 'not an array';
    const defaultMessage = message || `Expected array length to be ${expectedLength}, got ${actualLength}`;
    const passed = Array.isArray(array) && array.length === expectedLength;
    const result = new AssertionResult(passed, defaultMessage, expectedLength, actualLength, this.getStack());
    return this.context.addResult(result);
  }

  /**
   * Assert that a function throws an error
   */
  assertThrows(fn, expectedError = null, message = null) {
    let threw = false;
    let actualError = null;
    
    try {
      fn();
    } catch (error) {
      threw = true;
      actualError = error;
    }
    
    let passed = threw;
    let defaultMessage = message || 'Expected function to throw an error';
    
    if (expectedError && threw) {
      if (typeof expectedError === 'string') {
        passed = actualError.message.includes(expectedError);
        defaultMessage = message || `Expected error message to contain "${expectedError}"`;
      } else if (expectedError instanceof RegExp) {
        passed = expectedError.test(actualError.message);
        defaultMessage = message || `Expected error message to match ${expectedError}`;
      } else if (typeof expectedError === 'function') {
        passed = actualError instanceof expectedError;
        defaultMessage = message || `Expected error to be instance of ${expectedError.name}`;
      }
    }
    
    const result = new AssertionResult(
      passed, 
      defaultMessage, 
      expectedError || 'throws error', 
      threw ? actualError.message : 'no error thrown',
      this.getStack()
    );
    return this.context.addResult(result);
  }

  // DOM-specific assertions

  /**
   * Assert that an element exists in the DOM
   */
  assertElementExists(selector, message = null) {
    const element = document.querySelector(selector);
    const defaultMessage = message || `Expected element "${selector}" to exist`;
    const passed = element !== null;
    const result = new AssertionResult(passed, defaultMessage, 'element exists', element ? 'found' : 'not found', this.getStack());
    return this.context.addResult(result);
  }

  /**
   * Assert that an element is visible
   */
  assertElementVisible(selector, message = null) {
    const element = document.querySelector(selector);
    const defaultMessage = message || `Expected element "${selector}" to be visible`;
    
    let passed = false;
    if (element) {
      const style = window.getComputedStyle(element);
      passed = style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               element.offsetWidth > 0 && 
               element.offsetHeight > 0;
    }
    
    const result = new AssertionResult(passed, defaultMessage, 'visible', passed ? 'visible' : 'not visible', this.getStack());
    return this.context.addResult(result);
  }

  /**
   * Assert that an element has specific text content
   */
  assertElementText(selector, expectedText, message = null) {
    const element = document.querySelector(selector);
    const actualText = element ? element.textContent.trim() : null;
    const defaultMessage = message || `Expected element "${selector}" to have text "${expectedText}"`;
    const passed = actualText === expectedText;
    const result = new AssertionResult(passed, defaultMessage, expectedText, actualText, this.getStack());
    return this.context.addResult(result);
  }

  /**
   * Assert that an element has a specific attribute value
   */
  assertElementAttribute(selector, attribute, expectedValue, message = null) {
    const element = document.querySelector(selector);
    const actualValue = element ? element.getAttribute(attribute) : null;
    const defaultMessage = message || `Expected element "${selector}" to have ${attribute}="${expectedValue}"`;
    const passed = actualValue === expectedValue;
    const result = new AssertionResult(passed, defaultMessage, expectedValue, actualValue, this.getStack());
    return this.context.addResult(result);
  }

  // Utility methods

  formatValue(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }

  getStack() {
    try {
      throw new Error();
    } catch (e) {
      return e.stack;
    }
  }

  // Context management

  getResults() {
    return this.context.getResults();
  }

  getSummary() {
    return this.context.getSummary();
  }

  clearResults() {
    this.context.clear();
  }

  setCurrentTest(testName) {
    this.context.setCurrentTest(testName);
  }
}

// Create global instance
const assert = new AssertionLibrary();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AssertionLibrary, AssertionResult, AssertionContext, assert };
}
