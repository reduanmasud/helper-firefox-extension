// Content script for Console Script Manager extension

// Global variables
let isSelectingElement = false;
let highlightedElement = null;
let highlightOverlay = null;

// Listen for messages from popup or background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // Handle element selection mode
  if (message.action === 'startElementSelection') {
    console.log('Starting element selection in content script');
    startElementSelection();
    sendResponse({ success: true });
    return true;
  }
  
  // Handle XPath testing
  if (message.action === 'testXPath') {
    try {
      const result = testXPath(message.xpath);
      sendResponse(result);
    } catch (error) {
      sendResponse({ success: false, error: error.toString() });
    }
    return true;
  }
  
  // Handle script execution
  if (message.action === 'runScript') {
    try {
      // Execute the script in the page context
      const result = executeScript(message.code);
      sendResponse({ success: true, output: result });
    } catch (error) {
      sendResponse({ success: false, output: error.toString() });
    }
    return true;
  }
});

// Helper function to check if an element is part of the overlay system
function isOverlayElement(element) {
  if (!element) return false;

  // Check if it's one of our overlay elements
  if (element.id === 'csm-instruction-overlay' ||
      element.id === 'csm-highlight-overlay' ||
      element.id === 'csm-cancel-selection') {
    return true;
  }

  // Check if it's a child of any overlay element
  const instructionOverlay = document.getElementById('csm-instruction-overlay');
  const highlightOverlay = document.getElementById('csm-highlight-overlay');

  if (instructionOverlay && instructionOverlay.contains(element)) {
    return true;
  }

  if (highlightOverlay && highlightOverlay.contains(element)) {
    return true;
  }

  return false;
}

// Start element selection mode
function startElementSelection() {
  console.log('Starting element selection');

  // Clean up any existing overlays first
  cleanupElementSelection();

  isSelectingElement = true;
  
  // Create instruction overlay
  const instructionOverlay = document.createElement('div');
  instructionOverlay.id = 'csm-instruction-overlay';
  instructionOverlay.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #4F46E5;
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    z-index: 2147483647;
    font-family: sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    gap: 10px;
    pointer-events: auto;
  `;
  
  instructionOverlay.innerHTML = `
    <div>Click on an element to select it, or press ESC to cancel</div>
    <button id="csm-cancel-selection" style="
      background-color: white;
      color: #4F46E5;
      border: none;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    ">Cancel</button>
  `;
  
  document.body.appendChild(instructionOverlay);
  
  // Create highlight overlay for hovering elements
  highlightOverlay = document.createElement('div');
  highlightOverlay.id = 'csm-highlight-overlay';
  highlightOverlay.style.cssText = `
    position: absolute;
    pointer-events: none;
    border: 2px solid #4F46E5;
    background-color: rgba(79, 70, 229, 0.1);
    z-index: 2147483646;
    display: none;
    box-sizing: border-box;
  `;
  
  document.body.appendChild(highlightOverlay);
  
  // Add event listeners
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
  document.addEventListener('click', handleClick);
  document.addEventListener('keydown', handleKeyDown);
  
  // Add event listener to cancel button with a small delay to ensure element is rendered
  setTimeout(() => {
    const cancelBtn = document.getElementById('csm-cancel-selection');
    if (cancelBtn) {
      // Store the handler so we can remove it later
      window.csmCancelHandler = (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        console.log('Cancel button clicked');
        cancelElementSelection();
      };
      cancelBtn.addEventListener('click', window.csmCancelHandler, true);
      console.log('Cancel button event listener added');
    } else {
      console.error('Cancel button not found');
    }
  }, 10);
}

// Handle mouse over event during element selection
function handleMouseOver(event) {
  if (!isSelectingElement) return;

  // Prevent selecting the overlay itself or any child elements
  if (isOverlayElement(event.target)) {
    return;
  }
  
  highlightedElement = event.target;
  
  // Update highlight overlay position and size
  if (highlightOverlay) {
    const rect = highlightedElement.getBoundingClientRect();
    highlightOverlay.style.display = 'block';
    highlightOverlay.style.top = `${rect.top + window.scrollY}px`;
    highlightOverlay.style.left = `${rect.left + window.scrollX}px`;
    highlightOverlay.style.width = `${rect.width}px`;
    highlightOverlay.style.height = `${rect.height}px`;
  }
}

// Handle mouse out event during element selection
function handleMouseOut(event) {
  if (!isSelectingElement) return;
  
  highlightOverlay.style.display = 'none';
  highlightedElement = null;
}

// Handle click event during element selection
function handleClick(event) {
  if (!isSelectingElement) return;
  console.log('Click event in content script:', event);

  // Prevent selecting the overlay itself or any child elements
  if (isOverlayElement(event.target)) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  
  event.preventDefault();
  event.stopPropagation();
  
  const selectedElement = event.target;
  console.log('Element selected:', selectedElement);

  const xpath = getXPath(selectedElement);
  console.log('Generated XPath:', xpath);

  // Gather element information
  const elementInfo = {
    tagName: selectedElement.tagName.toLowerCase(),
    id: selectedElement.id || '',
    className: selectedElement.className || '',
    classes: selectedElement.className || '', // Keep both for compatibility
    textContent: selectedElement.textContent.trim().substring(0, 100) +
                (selectedElement.textContent.trim().length > 100 ? '...' : '')
  };

  console.log('Element info:', elementInfo);
  
  // Send message to background script with complete element data
  const messageData = {
    action: 'elementSelected',
    xpath: xpath,
    elementInfo: elementInfo,
    elementData: {
      tagName: selectedElement.tagName || '',
      id: selectedElement.id || '',
      className: selectedElement.className || '',
      textContent: selectedElement.textContent || '',
      attributes: getElementAttributes(selectedElement),
      outerHTML: selectedElement.outerHTML ? selectedElement.outerHTML.substring(0, 500) : '', // Truncate for safety
      // Store element reference for Playwright locator generation
      elementSelector: generateElementSelector(selectedElement)
    }
  };

  console.log('Sending message to background:', messageData);
  browser.runtime.sendMessage(messageData);
  
  // Clean up
  cleanupElementSelection();
}

// Handle key down event during element selection
function handleKeyDown(event) {
  if (!isSelectingElement) return;
  
  // Cancel selection on ESC key
  if (event.key === 'Escape') {
    cancelElementSelection();
  }
}

// Cancel element selection mode
function cancelElementSelection() {
  console.log('Cancelling element selection');
  cleanupElementSelection();

  // Notify background script that selection was cancelled
  browser.runtime.sendMessage({
    action: 'elementSelectionCancelled'
  }).catch(error => {
    console.log('Could not send cancellation message:', error);
  });
}

// Helper function to get all element attributes
function getElementAttributes(element) {
  const attributes = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attributes[attr.name] = attr.value;
  }
  return attributes;
}

// Helper function to generate a reliable element selector
function generateElementSelector(element) {
  // Try ID first
  if (element.id) {
    return `#${element.id}`;
  }

  // Try data-testid attributes
  const testId = element.getAttribute('data-testid') ||
                 element.getAttribute('data-test-id') ||
                 element.getAttribute('data-cy');
  if (testId) {
    return `[data-testid="${testId}"]`;
  }

  // Try class combination
  if (element.className) {
    const classes = element.className.split(' ').filter(c => c.trim());
    if (classes.length > 0) {
      return `.${classes.join('.')}`;
    }
  }

  // Fallback to tag name with position
  const tagName = element.tagName.toLowerCase();
  const siblings = Array.from(element.parentNode?.children || []).filter(el => el.tagName === element.tagName);
  const index = siblings.indexOf(element);

  if (siblings.length > 1) {
    return `${tagName}:nth-of-type(${index + 1})`;
  }

  return tagName;
}

// Debug function to check overlay state
function debugOverlayState() {
  console.log('=== Overlay Debug State ===');
  console.log('isSelectingElement:', isSelectingElement);
  console.log('highlightedElement:', highlightedElement);

  const instructionOverlay = document.getElementById('csm-instruction-overlay');
  const highlightOverlay = document.getElementById('csm-highlight-overlay');
  const cancelBtn = document.getElementById('csm-cancel-selection');

  console.log('Instruction overlay exists:', !!instructionOverlay);
  console.log('Highlight overlay exists:', !!highlightOverlay);
  console.log('Cancel button exists:', !!cancelBtn);

  if (instructionOverlay) {
    console.log('Instruction overlay style:', instructionOverlay.style.cssText);
  }

  if (highlightOverlay) {
    console.log('Highlight overlay style:', highlightOverlay.style.cssText);
  }

  console.log('=== End Overlay Debug ===');
}

// Make debug function globally available
window.debugOverlayState = debugOverlayState;

// Clean up element selection mode
function cleanupElementSelection() {
  console.log('Cleaning up element selection');
  isSelectingElement = false;
  highlightedElement = null;

  // Remove overlays
  const instructionOverlay = document.getElementById('csm-instruction-overlay');
  if (instructionOverlay) {
    // Remove cancel button event listener if it exists
    const cancelBtn = document.getElementById('csm-cancel-selection');
    if (cancelBtn && window.csmCancelHandler) {
      cancelBtn.removeEventListener('click', window.csmCancelHandler, true);
      window.csmCancelHandler = null;
    }
    instructionOverlay.remove();
    console.log('Instruction overlay removed');
  }

  if (highlightOverlay) {
    highlightOverlay.remove();
    highlightOverlay = null;
    console.log('Highlight overlay removed');
  }

  // Remove event listeners
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('mouseout', handleMouseOut);
  document.removeEventListener('click', handleClick);
  document.removeEventListener('keydown', handleKeyDown);

  console.log('Element selection cleanup complete');
}

// Get XPath for an element
function getXPath(element) {
  // Safety check
  if (!element || !element.tagName) {
    return null;
  }

  // If element has an ID, use it
  if (element.id && element.id.trim()) {
    return `//*[@id="${element.id}"]`;
  }

  // If it's the document element
  if (element === document.documentElement) {
    return '/html';
  }

  // If it's the body element
  if (element === document.body) {
    return '/html/body';
  }

  // If no parent, return basic path
  if (!element.parentNode) {
    return `/${element.tagName.toLowerCase()}`;
  }

  let ix = 0;
  const siblings = element.parentNode.childNodes;

  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];

    if (sibling === element) {
      const parentPath = getXPath(element.parentNode);
      const tagName = element.tagName.toLowerCase();

      // Ensure parent path exists
      if (!parentPath) {
        return `/${tagName}[${ix + 1}]`;
      }

      return `${parentPath}/${tagName}[${ix + 1}]`;
    }

    if (sibling.nodeType === 1 && sibling.tagName &&
        sibling.tagName.toLowerCase() === element.tagName.toLowerCase()) {
      ix++;
    }
  }

  // Fallback if something goes wrong
  return `/${element.tagName.toLowerCase()}`;
}

// Test an XPath expression
function testXPath(xpath) {
  try {
    // Evaluate the XPath expression
    const result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
    
    const count = result.snapshotLength;
    
    // If elements are found, highlight the first one
    if (count > 0) {
      const element = result.snapshotItem(0);
      
      // Create a temporary highlight
      const tempHighlight = document.createElement('div');
      tempHighlight.style.cssText = `
        position: absolute;
        pointer-events: none;
        border: 3px solid #22c55e;
        background-color: rgba(34, 197, 94, 0.2);
        z-index: 999998;
        transition: opacity 1s ease-out;
      `;
      
      document.body.appendChild(tempHighlight);
      
      // Position the highlight
      const rect = element.getBoundingClientRect();
      tempHighlight.style.top = `${rect.top + window.scrollY}px`;
      tempHighlight.style.left = `${rect.left + window.scrollX}px`;
      tempHighlight.style.width = `${rect.width}px`;
      tempHighlight.style.height = `${rect.height}px`;
      
      // Remove the highlight after 2 seconds
      setTimeout(() => {
        tempHighlight.style.opacity = '0';
        setTimeout(() => {
          if (tempHighlight.parentNode) {
            tempHighlight.parentNode.removeChild(tempHighlight);
          }
        }, 1000);
      }, 2000);
    }
    
    return { success: true, count: count };
  } catch (error) {
    console.error('XPath test error:', error);
    return { success: false, error: error.toString() };
  }
}

// Execute script in page context
function executeScript(code) {
  try {
    // First inject the assertion library if not already present
    if (!window.assert) {
      injectAssertionLibrary();
    }

    // Execute the code directly in a safer way using a script tag
    const script = document.createElement('script');
    script.textContent = code;
    
    // Create a wrapper to capture console.log output
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleInfo = console.info;
    
    let output = '';
    
    // Override console methods to capture output
    console.log = function() {
      output += Array.from(arguments).map(arg => {
        if (typeof arg === 'object') {
          return JSON.stringify(arg, null, 2);
        }
        return String(arg);
      }).join(' ') + '\n';
      originalConsoleLog.apply(console, arguments);
    };
    
    console.error = function() {
      output += 'ERROR: ' + Array.from(arguments).map(arg => {
        if (typeof arg === 'object') {
          return JSON.stringify(arg, null, 2);
        }
        return String(arg);
      }).join(' ') + '\n';
      originalConsoleError.apply(console, arguments);
    };
    
    console.warn = function() {
      output += 'WARNING: ' + Array.from(arguments).map(arg => {
        if (typeof arg === 'object') {
          return JSON.stringify(arg, null, 2);
        }
        return String(arg);
      }).join(' ') + '\n';
      originalConsoleWarn.apply(console, arguments);
    };
    
    console.info = function() {
      output += 'INFO: ' + Array.from(arguments).map(arg => {
        if (typeof arg === 'object') {
          return JSON.stringify(arg, null, 2);
        }
        return String(arg);
      }).join(' ') + '\n';
      originalConsoleInfo.apply(console, arguments);
    };
    
    // Clear previous assertion results if assertion library is available
    try {
      if (window.assert && window.assert.clearResults) {
        window.assert.clearResults();
      }
    } catch (clearError) {
      console.warn('Error clearing assertion results:', clearError);
    }

    // Execute the script and capture its return value
    let result;
    try {
      // Wrap the user code to capture return value
      const wrappedCode = `
        (function() {
          ${code}
        })();
      `;
      script.textContent = wrappedCode;

      // Create a global variable to capture the result
      window.__scriptResult = undefined;

      // Modify the script to capture return values
      const resultCaptureCode = `
        try {
          window.__scriptResult = (function() {
            ${code}
          })();
        } catch (e) {
          window.__scriptError = e;
          throw e;
        }
      `;
      script.textContent = resultCaptureCode;

      document.head.appendChild(script);
      document.head.removeChild(script);

      // Get the captured result
      result = window.__scriptResult;

      // Check for captured errors
      if (window.__scriptError) {
        throw window.__scriptError;
      }

      // Clean up global variables
      delete window.__scriptResult;
      delete window.__scriptError;

    } catch (scriptError) {
      // Clean up global variables on error
      delete window.__scriptResult;
      delete window.__scriptError;
      throw scriptError;
    }

    // Restore original console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.info = originalConsoleInfo;

    // Add the return value to the output if it exists and isn't undefined
    if (result !== undefined) {
      if (typeof result === 'object') {
        output += '\nReturn value: ' + JSON.stringify(result, null, 2);
      } else {
        output += '\nReturn value: ' + result;
      }
    }
    
    // Capture assertion results if available
    let assertionSummary = null;
    try {
      if (window.assert && window.assert.getSummary) {
        assertionSummary = window.assert.getSummary();
        if (assertionSummary.total > 0) {
          output += `\nAssertions: ${assertionSummary.passed}/${assertionSummary.total} passed`;
          if (assertionSummary.failed > 0) {
            output += ` (${assertionSummary.failed} failed)`;
          }
        }
      }
    } catch (assertError) {
      console.warn('Error getting assertion results:', assertError);
    }

    // Determine success based on assertions and errors
    const success = assertionSummary ?
      (assertionSummary.failed === 0) :
      !output.includes('ERROR:');

    return {
      success,
      output: output || 'Script executed successfully (no output)',
      assertions: assertionSummary
    };
  } catch (error) {
    console.error('Script execution error:', error);
    return {
      success: false,
      output: `Error: ${error.message}`,
      assertions: null
    };
  }
}

// Inject assertion library into page context
function injectAssertionLibrary() {
  // Check if assertion library is already injected
  const existingScript = document.querySelector('script[data-assertion-library]');
  if (existingScript) {
    return; // Already injected
  }

  const assertionLibraryCode = `
// Assertion Library for Console Script Manager
class AssertionResult {
  constructor(passed, message, expected = null, actual = null) {
    this.passed = passed;
    this.message = message;
    this.expected = expected;
    this.actual = actual;
    this.timestamp = new Date().toISOString();
  }

  toString() {
    if (this.passed) {
      return \`✓ \${this.message}\`;
    } else {
      let result = \`✗ \${this.message}\`;
      if (this.expected !== null && this.actual !== null) {
        result += \`\\n  Expected: \${this.formatValue(this.expected)}\`;
        result += \`\\n  Actual: \${this.formatValue(this.actual)}\`;
      }
      return result;
    }
  }

  formatValue(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return \`"\${value}"\`;
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }
}

class AssertionContext {
  constructor() {
    this.results = [];
  }

  addResult(result) {
    this.results.push(result);

    if (result.passed) {
      console.log(\`%c\${result.toString()}\`, 'color: green; font-weight: bold;');
    } else {
      console.error(\`%c\${result.toString()}\`, 'color: red; font-weight: bold;');
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

    return { total, passed, failed, passRate: total > 0 ? (passed / total) * 100 : 0 };
  }

  clear() {
    this.results = [];
  }
}

class AssertionLibrary {
  constructor() {
    this.context = new AssertionContext();
  }

  // Basic assertions
  assertEquals(actual, expected, message = null) {
    const defaultMessage = message || \`Expected \${this.formatValue(actual)} to equal \${this.formatValue(expected)}\`;
    const passed = actual === expected;
    const result = new AssertionResult(passed, defaultMessage, expected, actual);
    return this.context.addResult(result);
  }

  assertNotEquals(actual, expected, message = null) {
    const defaultMessage = message || \`Expected \${this.formatValue(actual)} to not equal \${this.formatValue(expected)}\`;
    const passed = actual !== expected;
    const result = new AssertionResult(passed, defaultMessage, \`not \${expected}\`, actual);
    return this.context.addResult(result);
  }

  assertTrue(actual, message = null) {
    const defaultMessage = message || \`Expected \${this.formatValue(actual)} to be true\`;
    const passed = actual === true;
    const result = new AssertionResult(passed, defaultMessage, true, actual);
    return this.context.addResult(result);
  }

  assertFalse(actual, message = null) {
    const defaultMessage = message || \`Expected \${this.formatValue(actual)} to be false\`;
    const passed = actual === false;
    const result = new AssertionResult(passed, defaultMessage, false, actual);
    return this.context.addResult(result);
  }

  assertNull(actual, message = null) {
    const defaultMessage = message || \`Expected \${this.formatValue(actual)} to be null\`;
    const passed = actual === null;
    const result = new AssertionResult(passed, defaultMessage, null, actual);
    return this.context.addResult(result);
  }

  assertNotNull(actual, message = null) {
    const defaultMessage = message || \`Expected \${this.formatValue(actual)} to not be null\`;
    const passed = actual !== null;
    const result = new AssertionResult(passed, defaultMessage, 'not null', actual);
    return this.context.addResult(result);
  }

  assertContains(haystack, needle, message = null) {
    const defaultMessage = message || \`Expected "\${haystack}" to contain "\${needle}"\`;
    const passed = String(haystack).includes(String(needle));
    const result = new AssertionResult(passed, defaultMessage, \`contains "\${needle}"\`, haystack);
    return this.context.addResult(result);
  }

  // DOM assertions
  assertElementExists(selector, message = null) {
    const element = document.querySelector(selector);
    const defaultMessage = message || \`Expected element "\${selector}" to exist\`;
    const passed = element !== null;
    const result = new AssertionResult(passed, defaultMessage, 'element exists', element ? 'found' : 'not found');
    return this.context.addResult(result);
  }

  assertElementVisible(selector, message = null) {
    const element = document.querySelector(selector);
    const defaultMessage = message || \`Expected element "\${selector}" to be visible\`;

    let passed = false;
    if (element) {
      const style = window.getComputedStyle(element);
      passed = style.display !== 'none' &&
               style.visibility !== 'hidden' &&
               style.opacity !== '0' &&
               element.offsetWidth > 0 &&
               element.offsetHeight > 0;
    }

    const result = new AssertionResult(passed, defaultMessage, 'visible', passed ? 'visible' : 'not visible');
    return this.context.addResult(result);
  }

  assertElementText(selector, expectedText, message = null) {
    const element = document.querySelector(selector);
    const actualText = element ? element.textContent.trim() : null;
    const defaultMessage = message || \`Expected element "\${selector}" to have text "\${expectedText}"\`;
    const passed = actualText === expectedText;
    const result = new AssertionResult(passed, defaultMessage, expectedText, actualText);
    return this.context.addResult(result);
  }

  // Utility methods
  formatValue(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return \`"\${value}"\`;
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }

  getResults() {
    return this.context.getResults();
  }

  getSummary() {
    return this.context.getSummary();
  }

  clearResults() {
    this.context.clear();
  }
}

// Create global assertion instance
if (!window.assert) {
  window.assert = new AssertionLibrary();
  console.log('%cAssertion library loaded successfully', 'color: blue; font-weight: bold;');
}
`;

  const script = document.createElement('script');
  script.setAttribute('data-assertion-library', 'true');
  script.textContent = assertionLibraryCode;
  document.head.appendChild(script);
}

// Content Inspection Functions
let isContentInspecting = false;
let contentInspectionOverlay = null;

function startContentInspection() {
  if (isContentInspecting) return;

  isContentInspecting = true;
  createContentInspectionOverlay();

  // Add event listeners for element inspection
  document.addEventListener('mouseover', highlightElementForContent, true);
  document.addEventListener('click', selectElementForContent, true);
  document.addEventListener('keydown', handleContentInspectionKeydown, true);
}

function createContentInspectionOverlay() {
  // Remove existing overlay if any
  if (contentInspectionOverlay) {
    contentInspectionOverlay.remove();
  }

  contentInspectionOverlay = document.createElement('div');
  contentInspectionOverlay.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px;
    border-radius: 4px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 999999;
    pointer-events: none;
  `;
  contentInspectionOverlay.textContent = 'Click on any element to extract its content. Press ESC to cancel.';
  document.body.appendChild(contentInspectionOverlay);
}

function highlightElementForContent(event) {
  if (!isContentInspecting) return;

  event.preventDefault();
  event.stopPropagation();

  // Remove previous highlights
  const previousHighlight = document.querySelector('.content-inspection-highlight');
  if (previousHighlight) {
    previousHighlight.classList.remove('content-inspection-highlight');
  }

  // Add highlight to current element
  event.target.classList.add('content-inspection-highlight');

  // Add highlight styles if not already added
  if (!document.querySelector('#content-inspection-styles')) {
    const style = document.createElement('style');
    style.id = 'content-inspection-styles';
    style.textContent = `
      .content-inspection-highlight {
        outline: 2px solid #ff6b35 !important;
        outline-offset: 2px !important;
        background-color: rgba(255, 107, 53, 0.1) !important;
      }
    `;
    document.head.appendChild(style);
  }
}

function selectElementForContent(event) {
  if (!isContentInspecting) return;

  event.preventDefault();
  event.stopPropagation();

  const element = event.target;

  // Extract content from the element
  let content = '';

  // Try to get meaningful text content
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    content = element.value;
  } else if (element.tagName === 'SELECT') {
    content = element.options[element.selectedIndex]?.text || '';
  } else {
    // Get text content, but also include some HTML structure for complex elements
    const textContent = element.textContent?.trim() || '';
    const innerHTML = element.innerHTML?.trim() || '';

    if (textContent.length > 0) {
      content = textContent;

      // If the element has significant HTML structure, include it
      if (innerHTML.length > textContent.length * 1.5 && innerHTML.includes('<')) {
        content += '\n\n--- HTML Structure ---\n' + innerHTML;
      }
    } else {
      content = innerHTML;
    }
  }

  // Clean up and send the content
  stopContentInspection();

  if (content.trim()) {
    chrome.runtime.sendMessage({
      action: 'contentExtracted',
      content: content.trim()
    });
  } else {
    chrome.runtime.sendMessage({
      action: 'contentExtracted',
      content: 'No content found in selected element'
    });
  }
}

function handleContentInspectionKeydown(event) {
  if (!isContentInspecting) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    stopContentInspection();
    chrome.runtime.sendMessage({
      action: 'contentInspectionCancelled'
    });
  }
}

function stopContentInspection() {
  if (!isContentInspecting) return;

  isContentInspecting = false;

  // Remove event listeners
  document.removeEventListener('mouseover', highlightElementForContent, true);
  document.removeEventListener('click', selectElementForContent, true);
  document.removeEventListener('keydown', handleContentInspectionKeydown, true);

  // Remove overlay
  if (contentInspectionOverlay) {
    contentInspectionOverlay.remove();
    contentInspectionOverlay = null;
  }

  // Remove highlights
  const highlighted = document.querySelector('.content-inspection-highlight');
  if (highlighted) {
    highlighted.classList.remove('content-inspection-highlight');
  }

  // Remove styles
  const styles = document.querySelector('#content-inspection-styles');
  if (styles) {
    styles.remove();
  }
}

// Message listener for communication with popup/sidebar
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'executeScript') {
    executeScript(message.code)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({
        success: false,
        output: `Error: ${error.message}`,
        assertions: null
      }));
    return true; // Keep message channel open for async response
  }

  if (message.action === 'startElementSelection') {
    startElementSelection();
    sendResponse({ success: true });
  }

  if (message.action === 'cancelElementSelection') {
    cancelElementSelection();
    sendResponse({ success: true });
  }

  if (message.action === 'startContentInspection') {
    startContentInspection();
    sendResponse({ success: true });
  }

  if (message.action === 'testPlaywrightLocator') {
    testPlaywrightLocator(message.locator)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});

// Playwright Locator Testing Functions
async function testPlaywrightLocator(locator) {
  try {
    let elements = [];

    // Parse the locator and convert to DOM query
    const locatorValue = locator.value;

    if (locator.type === 'getByTestId') {
      const testId = extractTestId(locatorValue);
      elements = document.querySelectorAll(`[data-testid="${testId}"], [data-test-id="${testId}"], [data-cy="${testId}"]`);
    } else if (locator.type === 'getByRole') {
      elements = findByRole(locatorValue);
    } else if (locator.type === 'getByText') {
      const text = extractText(locatorValue);
      elements = findByText(text);
    } else if (locator.type === 'getByLabel') {
      const label = extractLabel(locatorValue);
      elements = findByLabel(label);
    } else if (locator.type === 'getByPlaceholder') {
      const placeholder = extractPlaceholder(locatorValue);
      elements = document.querySelectorAll(`[placeholder="${placeholder}"]`);
    } else if (locator.type === 'locator') {
      const selector = extractCSSSelector(locatorValue);
      elements = document.querySelectorAll(selector);
    }

    // Highlight found elements
    highlightElements(Array.from(elements));

    return {
      success: true,
      count: elements.length,
      elements: Array.from(elements).map(el => ({
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        textContent: el.textContent.trim().substring(0, 50)
      }))
    };
  } catch (error) {
    console.error('Error testing Playwright locator:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper functions for locator parsing
function extractTestId(locatorValue) {
  const match = locatorValue.match(/getByTestId\(['"]([^'"]+)['"]\)/);
  return match ? match[1] : '';
}

function extractText(locatorValue) {
  const match = locatorValue.match(/getByText\(['"]([^'"]+)['"]\)/);
  return match ? match[1] : '';
}

function extractLabel(locatorValue) {
  const match = locatorValue.match(/getByLabel\(['"]([^'"]+)['"]\)/);
  return match ? match[1] : '';
}

function extractPlaceholder(locatorValue) {
  const match = locatorValue.match(/getByPlaceholder\(['"]([^'"]+)['"]\)/);
  return match ? match[1] : '';
}

function extractCSSSelector(locatorValue) {
  const match = locatorValue.match(/locator\(['"]([^'"]+)['"]\)/);
  return match ? match[1] : '';
}

function findByRole(locatorValue) {
  const roleMatch = locatorValue.match(/getByRole\(['"]([^'"]+)['"](?:,\s*\{\s*name:\s*['"]([^'"]+)['"]\s*\})?\)/);
  if (!roleMatch) return [];

  const role = roleMatch[1];
  const name = roleMatch[2];

  const elements = [];

  // Find elements with explicit role
  const explicitRoleElements = document.querySelectorAll(`[role="${role}"]`);
  elements.push(...explicitRoleElements);

  // Find elements with implicit role
  const implicitRoleElements = findElementsByImplicitRole(role);
  elements.push(...implicitRoleElements);

  // Filter by name if specified
  if (name) {
    return elements.filter(el => {
      const accessibleName = getElementAccessibleName(el);
      return accessibleName && accessibleName.includes(name);
    });
  }

  return elements;
}

function findElementsByImplicitRole(role) {
  const roleSelectors = {
    'button': 'button, input[type="button"], input[type="submit"], input[type="reset"]',
    'link': 'a[href]',
    'textbox': 'input[type="text"], input[type="email"], input[type="password"], input[type="search"], input[type="url"], textarea',
    'checkbox': 'input[type="checkbox"]',
    'radio': 'input[type="radio"]',
    'combobox': 'select',
    'heading': 'h1, h2, h3, h4, h5, h6',
    'img': 'img',
    'navigation': 'nav',
    'main': 'main',
    'banner': 'header',
    'contentinfo': 'footer',
    'region': 'section',
    'article': 'article',
    'complementary': 'aside',
    'form': 'form',
    'table': 'table',
    'list': 'ul, ol',
    'listitem': 'li'
  };

  const selector = roleSelectors[role];
  return selector ? Array.from(document.querySelectorAll(selector)) : [];
}

function getElementAccessibleName(element) {
  // Check aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  // Check aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelElement = document.getElementById(labelledBy);
    if (labelElement) return labelElement.textContent.trim();
  }

  // Check associated label
  const id = element.getAttribute('id');
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label.textContent.trim();
  }

  // Check parent label
  const parentLabel = element.closest('label');
  if (parentLabel) return parentLabel.textContent.trim();

  // For buttons and links, use text content
  if (['button', 'a'].includes(element.tagName.toLowerCase())) {
    return element.textContent.trim();
  }

  // For images, use alt text
  if (element.tagName.toLowerCase() === 'img') {
    return element.getAttribute('alt');
  }

  return null;
}

function findByText(text) {
  const elements = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: function(node) {
        // Skip script and style elements
        if (['SCRIPT', 'STYLE'].includes(node.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let node;
  while (node = walker.nextNode()) {
    if (node.textContent.trim() === text) {
      elements.push(node);
    }
  }

  return elements;
}

function findByLabel(labelText) {
  const elements = [];

  // Find labels with matching text
  const labels = Array.from(document.querySelectorAll('label')).filter(label =>
    label.textContent.trim().includes(labelText)
  );

  labels.forEach(label => {
    // Check for explicit association (for attribute)
    const forAttr = label.getAttribute('for');
    if (forAttr) {
      const element = document.getElementById(forAttr);
      if (element) elements.push(element);
    }

    // Check for implicit association (nested element)
    const nestedInput = label.querySelector('input, select, textarea');
    if (nestedInput) elements.push(nestedInput);
  });

  return elements;
}

function highlightElements(elements) {
  // Remove previous highlights
  const previousHighlights = document.querySelectorAll('.playwright-test-highlight');
  previousHighlights.forEach(el => el.classList.remove('playwright-test-highlight'));

  // Add highlight styles if not already added
  if (!document.querySelector('#playwright-test-styles')) {
    const style = document.createElement('style');
    style.id = 'playwright-test-styles';
    style.textContent = `
      .playwright-test-highlight {
        outline: 3px solid #00ff00 !important;
        outline-offset: 2px !important;
        background-color: rgba(0, 255, 0, 0.1) !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Highlight found elements
  elements.forEach(el => el.classList.add('playwright-test-highlight'));

  // Remove highlights after 3 seconds
  setTimeout(() => {
    elements.forEach(el => el.classList.remove('playwright-test-highlight'));
  }, 3000);
}

// Initialize assertion library when content script loads
injectAssertionLibrary();