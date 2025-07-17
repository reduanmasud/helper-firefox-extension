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
    
    // Execute the script and capture its return value
    document.head.appendChild(script);
    document.head.removeChild(script);
    
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
    
    return output || 'Script executed successfully (no output)';
  } catch (error) {
    console.error('Script execution error:', error);
    return `Error: ${error.message}`;
  }
}