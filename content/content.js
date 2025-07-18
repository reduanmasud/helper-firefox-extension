// Content script for Console Script Manager extension

// Global variables
let isSelectingElement = false;
let highlightedElement = null;
let highlightOverlay = null;

// Listen for messages from popup or background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle element selection mode
  if (message.action === 'startElementSelection') {
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

// Start element selection mode
function startElementSelection() {
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
    z-index: 999999;
    font-family: sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    gap: 10px;
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
    z-index: 999998;
    display: none;
  `;
  
  document.body.appendChild(highlightOverlay);
  
  // Add event listeners
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
  document.addEventListener('click', handleClick);
  document.addEventListener('keydown', handleKeyDown);
  
  // Add event listener to cancel button
  document.getElementById('csm-cancel-selection').addEventListener('click', cancelElementSelection);
}

// Handle mouse over event during element selection
function handleMouseOver(event) {
  if (!isSelectingElement) return;
  
  // Prevent selecting the overlay itself
  if (event.target.id === 'csm-instruction-overlay' || 
      event.target.id === 'csm-highlight-overlay' ||
      event.target.id === 'csm-cancel-selection') {
    return;
  }
  
  highlightedElement = event.target;
  
  // Update highlight overlay position and size
  const rect = highlightedElement.getBoundingClientRect();
  highlightOverlay.style.display = 'block';
  highlightOverlay.style.top = `${rect.top + window.scrollY}px`;
  highlightOverlay.style.left = `${rect.left + window.scrollX}px`;
  highlightOverlay.style.width = `${rect.width}px`;
  highlightOverlay.style.height = `${rect.height}px`;
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
  
  // Prevent selecting the overlay itself
  if (event.target.id === 'csm-instruction-overlay' || 
      event.target.id === 'csm-highlight-overlay' ||
      event.target.id === 'csm-cancel-selection') {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  
  event.preventDefault();
  event.stopPropagation();
  
  const selectedElement = event.target;
  const xpath = getXPath(selectedElement);
  
  // Gather element information
  const elementInfo = {
    tagName: selectedElement.tagName.toLowerCase(),
    id: selectedElement.id,
    classes: selectedElement.className,
    textContent: selectedElement.textContent.trim().substring(0, 100) + 
                (selectedElement.textContent.trim().length > 100 ? '...' : '')
  };
  
  // Send message to background script
  browser.runtime.sendMessage({
    action: 'elementSelected',
    xpath: xpath,
    elementInfo: elementInfo
  });
  
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
  cleanupElementSelection();
}

// Clean up element selection mode
function cleanupElementSelection() {
  isSelectingElement = false;
  highlightedElement = null;
  
  // Remove overlays
  const instructionOverlay = document.getElementById('csm-instruction-overlay');
  if (instructionOverlay) {
    instructionOverlay.remove();
  }
  
  if (highlightOverlay) {
    highlightOverlay.remove();
    highlightOverlay = null;
  }
  
  // Remove event listeners
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('mouseout', handleMouseOut);
  document.removeEventListener('click', handleClick);
  document.removeEventListener('keydown', handleKeyDown);
}

// Get XPath for an element
function getXPath(element) {
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }
  
  if (element === document.body) {
    return '/html/body';
  }
  
  let ix = 0;
  const siblings = element.parentNode.childNodes;
  
  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    
    if (sibling === element) {
      const path = getXPath(element.parentNode);
      const tagName = element.tagName.toLowerCase();
      return `${path}/${tagName}[${ix + 1}]`;
    }
    
    if (sibling.nodeType === 1 && sibling.tagName.toLowerCase() === element.tagName.toLowerCase()) {
      ix++;
    }
  }
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
});

// Initialize assertion library when content script loads
injectAssertionLibrary();