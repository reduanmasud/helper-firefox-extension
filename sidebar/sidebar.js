// Global variables
let selectedElement = null;
let selectedXPath = '';

// DOM Elements
const startSelectionBtn = document.getElementById('start-selection-btn');
const cancelSelectionBtn = document.getElementById('cancel-selection-btn');
const elementInfoPanel = document.getElementById('element-info');
const xpathValueInput = document.getElementById('xpath-value');
const copyXPathBtn = document.getElementById('copy-xpath-btn');
const insertXPathBtn = document.getElementById('insert-xpath-btn');
const testXPathBtn = document.getElementById('test-xpath-btn');
const statusMessage = document.getElementById('status-message');

// Initialize the sidebar
document.addEventListener('DOMContentLoaded', () => {
  // Set up event listeners
  startSelectionBtn.addEventListener('click', startElementSelection);
  cancelSelectionBtn.addEventListener('click', cancelElementSelection);
  copyXPathBtn.addEventListener('click', copyXPathToClipboard);
  insertXPathBtn.addEventListener('click', insertXPathIntoScript);
  testXPathBtn.addEventListener('click', testXPath);
  
  // Listen for messages from background script
  browser.runtime.onMessage.addListener(handleMessages);
});

/**
 * Start the element selection process
 */
function startElementSelection() {
  // Show cancel button and hide start button
  startSelectionBtn.classList.add('hidden');
  cancelSelectionBtn.classList.remove('hidden');
  
  // Send message to content script to start element selection
  browser.tabs.query({active: true, currentWindow: true})
    .then(tabs => {
      browser.tabs.sendMessage(tabs[0].id, { action: 'startElementSelection' })
        .then(() => {
          showStatus('Click on any element in the page to select it');
        })
        .catch(error => {
          console.error('Error starting element selection:', error);
          showStatus('Error: Could not start element selection', true);
          resetSelectionButtons();
        });
    });
}

/**
 * Cancel the element selection process
 */
function cancelElementSelection() {
  // Send message to content script to cancel selection
  browser.tabs.query({active: true, currentWindow: true})
    .then(tabs => {
      browser.tabs.sendMessage(tabs[0].id, { action: 'cancelElementSelection' })
        .then(() => {
          resetSelectionButtons();
          showStatus('Element selection cancelled');
        })
        .catch(error => {
          console.error('Error cancelling element selection:', error);
        });
    });
}

/**
 * Reset the selection buttons to their initial state
 */
function resetSelectionButtons() {
  startSelectionBtn.classList.remove('hidden');
  cancelSelectionBtn.classList.add('hidden');
}

/**
 * Handle messages from the background script
 */
function handleMessages(message) {
  if (message.action === 'elementSelected') {
    handleElementSelected(message.xpath, message.elementInfo);
  }
}

/**
 * Handle when an element is selected
 */
function handleElementSelected(xpath, elementInfo) {
  // Reset UI
  resetSelectionButtons();
  
  // Store the selected XPath
  selectedXPath = xpath;
  
  // Update the XPath input field
  xpathValueInput.value = xpath;
  
  // Enable buttons
  insertXPathBtn.disabled = false;
  testXPathBtn.disabled = false;
  
  // Display element info
  if (elementInfo) {
    const infoHTML = `
      <div class="element-details">
        <p><strong>Tag:</strong> ${escapeHtml(elementInfo.tagName || '')}</p>
        <p><strong>ID:</strong> ${escapeHtml(elementInfo.id || 'None')}</p>
        <p><strong>Classes:</strong> ${escapeHtml(elementInfo.classes || 'None')}</p>
        <p><strong>Text:</strong> ${escapeHtml(elementInfo.textContent || 'None')}</p>
      </div>
    `;
    elementInfoPanel.innerHTML = infoHTML;
  } else {
    elementInfoPanel.innerHTML = '<p>Element selected but no details available</p>';
  }
  
  showStatus('Element selected successfully');
}

/**
 * Copy the XPath to clipboard
 */
function copyXPathToClipboard() {
  if (!selectedXPath) {
    showStatus('No XPath to copy', true);
    return;
  }
  
  // Copy to clipboard
  xpathValueInput.select();
  document.execCommand('copy');
  
  showStatus('XPath copied to clipboard');
}

/**
 * Insert the XPath into the active script
 */
function insertXPathIntoScript() {
  if (!selectedXPath) {
    showStatus('No XPath to insert', true);
    return;
  }
  
  // Send message to background script to forward to popup
  browser.runtime.sendMessage({
    action: 'insertXPathIntoScript',
    xpath: selectedXPath
  })
    .then(() => {
      showStatus('XPath inserted into script');
    })
    .catch(error => {
      console.error('Error inserting XPath:', error);
      showStatus('Error: Could not insert XPath', true);
    });
}

/**
 * Test the XPath by highlighting the element in the page
 */
function testXPath() {
  if (!selectedXPath) {
    showStatus('No XPath to test', true);
    return;
  }
  
  // Send message to content script to test XPath
  browser.tabs.query({active: true, currentWindow: true})
    .then(tabs => {
      browser.tabs.sendMessage(tabs[0].id, {
        action: 'testXPath',
        xpath: selectedXPath
      })
        .then(response => {
          if (response && response.success) {
            showStatus(`XPath test: Found ${response.count} element(s)`);
          } else {
            showStatus('XPath test: No elements found', true);
          }
        })
        .catch(error => {
          console.error('Error testing XPath:', error);
          showStatus('Error: Could not test XPath', true);
        });
    });
}

/**
 * Show a status message
 */
function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? '#d70022' : '#737373';
  
  // Clear the message after 3 seconds
  setTimeout(() => {
    statusMessage.textContent = '';
  }, 3000);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}