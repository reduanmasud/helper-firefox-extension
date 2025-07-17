// Global state
let state = {
  scripts: [],
  variables: [],
  results: [],
  testSuites: [],
  suiteResults: [],
  currentScriptId: null,
  currentVariableId: null,
  currentTestSuiteId: null,
  currentTestCaseId: null,
  editingTestCase: null,
  isSelectingElement: false
};

// Global variables for element selection
let selectedElement = null;
let selectedXPath = '';

// DOM Elements
const elements = {
  // Tabs
  tabButtons: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),

  // Scripts Tab
  scriptsList: document.getElementById('scripts-list'),
  scriptEditor: document.getElementById('script-editor'),
  scriptActions: document.getElementById('script-actions'),
  newScriptBtn: document.getElementById('new-script-btn'),
  saveScriptBtn: document.getElementById('save-script-btn'),
  cancelScriptBtn: document.getElementById('cancel-script-btn'),
  editScriptBtn: document.getElementById('edit-script-btn'),
  deleteScriptBtn: document.getElementById('delete-script-btn'),
  runScriptBtn: document.getElementById('run-script-btn'),
  scriptNameInput: document.getElementById('script-name'),
  scriptCodeInput: document.getElementById('script-code'),
  selectElementBtn: document.getElementById('select-element-btn'),

  // Variables Tab
  variablesList: document.getElementById('variables-list'),
  variableEditor: document.getElementById('variable-editor'),
  newVariableBtn: document.getElementById('new-variable-btn'),
  saveVariableBtn: document.getElementById('save-variable-btn'),
  cancelVariableBtn: document.getElementById('cancel-variable-btn'),
  variableNameInput: document.getElementById('variable-name'),
  variableValueInput: document.getElementById('variable-value'),

  // Test Suites Tab
  testSuitesList: document.getElementById('test-suites-list'),
  testSuiteEditor: document.getElementById('test-suite-editor'),
  testSuiteActions: document.getElementById('test-suite-actions'),
  newTestSuiteBtn: document.getElementById('new-test-suite-btn'),
  saveTestSuiteBtn: document.getElementById('save-test-suite-btn'),
  cancelTestSuiteBtn: document.getElementById('cancel-test-suite-btn'),
  editTestSuiteBtn: document.getElementById('edit-test-suite-btn'),
  deleteTestSuiteBtn: document.getElementById('delete-test-suite-btn'),
  duplicateTestSuiteBtn: document.getElementById('duplicate-test-suite-btn'),
  runTestSuiteBtn: document.getElementById('run-test-suite-btn'),
  testSuiteNameInput: document.getElementById('test-suite-name'),
  testSuiteDescriptionInput: document.getElementById('test-suite-description'),
  testSuiteTagsInput: document.getElementById('test-suite-tags'),
  setupScriptSelect: document.getElementById('setup-script-select'),
  setupScriptEnabled: document.getElementById('setup-script-enabled'),
  teardownScriptSelect: document.getElementById('teardown-script-select'),
  teardownScriptEnabled: document.getElementById('teardown-script-enabled'),
  stopOnFailure: document.getElementById('stop-on-failure'),
  runParallel: document.getElementById('run-parallel'),
  defaultTimeout: document.getElementById('default-timeout'),
  defaultRetry: document.getElementById('default-retry'),
  addTestCaseBtn: document.getElementById('add-test-case-btn'),
  testCasesList: document.getElementById('test-cases-list'),

  // Test Case Editor
  testCaseEditor: document.getElementById('test-case-editor'),
  testCaseEditorTitle: document.getElementById('test-case-editor-title'),
  saveTestCaseBtn: document.getElementById('save-test-case-btn'),
  cancelTestCaseBtn: document.getElementById('cancel-test-case-btn'),
  testCaseName: document.getElementById('test-case-name'),
  testCaseScript: document.getElementById('test-case-script'),
  testCaseTimeout: document.getElementById('test-case-timeout'),
  testCaseRetry: document.getElementById('test-case-retry'),
  testCaseEnabled: document.getElementById('test-case-enabled'),

  // Results Tab
  resultsContainer: document.getElementById('results-container'),
  clearResultsBtn: document.getElementById('clear-results-btn'),

  // Inspector Tab (Original Element Selection)
  startSelectionBtn: document.getElementById('start-selection-btn'),
  cancelSelectionBtn: document.getElementById('cancel-selection-btn'),
  elementInfoPanel: document.getElementById('element-info'),
  xpathValueInput: document.getElementById('xpath-value'),
  copyXPathBtn: document.getElementById('copy-xpath-btn'),
  insertXPathBtn: document.getElementById('insert-xpath-btn'),
  testXPathBtn: document.getElementById('test-xpath-btn'),

  // Status
  statusMessage: document.getElementById('status-message')
};

// Initialize the sidebar
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  setupEventListeners();
  renderScriptsList();
  renderVariablesList();
  renderResultsList();
});

// Load state from storage
function loadState() {
  browser.storage.local.get(['scripts', 'variables', 'results', 'testSuites', 'suiteResults'])
    .then(data => {
      state.scripts = data.scripts || [];
      state.variables = data.variables || [];
      state.results = data.results || [];
      state.testSuites = data.testSuites || [];
      state.suiteResults = data.suiteResults || [];
      renderScriptsList();
      renderVariablesList();
      renderResultsList();
      renderTestSuitesList();
      populateScriptSelects();
    })
    .catch(error => {
      showStatus(`Error loading data: ${error.message}`, true);
    });
}

// Save state to storage
function saveState() {
  browser.storage.local.set({
    scripts: state.scripts,
    variables: state.variables,
    results: state.results,
    testSuites: state.testSuites,
    suiteResults: state.suiteResults
  })
    .catch(error => {
      showStatus(`Error saving data: ${error.message}`, true);
    });
}

// Setup event listeners
function setupEventListeners() {
  // Tab navigation
  elements.tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;
      switchTab(tabName);
    });
  });

  // Scripts Tab
  elements.newScriptBtn.addEventListener('click', newScript);
  elements.saveScriptBtn.addEventListener('click', saveScript);
  elements.cancelScriptBtn.addEventListener('click', cancelScriptEdit);
  elements.editScriptBtn.addEventListener('click', editCurrentScript);
  elements.deleteScriptBtn.addEventListener('click', deleteCurrentScript);
  elements.runScriptBtn.addEventListener('click', runCurrentScript);
  elements.selectElementBtn.addEventListener('click', startElementSelection);

  // Variables Tab
  elements.newVariableBtn.addEventListener('click', newVariable);
  elements.saveVariableBtn.addEventListener('click', saveVariable);
  elements.cancelVariableBtn.addEventListener('click', cancelVariableEdit);

  // Test Suites Tab
  elements.newTestSuiteBtn.addEventListener('click', newTestSuite);
  elements.saveTestSuiteBtn.addEventListener('click', saveTestSuite);
  elements.cancelTestSuiteBtn.addEventListener('click', cancelTestSuiteEdit);
  elements.editTestSuiteBtn.addEventListener('click', editCurrentTestSuite);
  elements.deleteTestSuiteBtn.addEventListener('click', deleteCurrentTestSuite);
  elements.duplicateTestSuiteBtn.addEventListener('click', duplicateCurrentTestSuite);
  elements.runTestSuiteBtn.addEventListener('click', runCurrentTestSuite);
  elements.addTestCaseBtn.addEventListener('click', addTestCase);

  // Test Case Editor
  elements.saveTestCaseBtn.addEventListener('click', saveTestCase);
  elements.cancelTestCaseBtn.addEventListener('click', cancelTestCaseEdit);

  // Results Tab
  elements.clearResultsBtn.addEventListener('click', clearResults);

  // Inspector Tab (Original Element Selection)
  elements.startSelectionBtn.addEventListener('click', startElementSelection);
  elements.cancelSelectionBtn.addEventListener('click', cancelElementSelection);
  elements.copyXPathBtn.addEventListener('click', copyXPathToClipboard);
  elements.insertXPathBtn.addEventListener('click', insertXPathIntoScript);
  elements.testXPathBtn.addEventListener('click', testXPath);

  // Listen for messages from background script
  browser.runtime.onMessage.addListener(handleMessages);

  // Listen for storage changes to sync with popup
  browser.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      if (changes.scripts) {
        state.scripts = changes.scripts.newValue || [];
        renderScriptsList();
        populateScriptSelects();
      }
      if (changes.variables) {
        state.variables = changes.variables.newValue || [];
        renderVariablesList();
      }
      if (changes.results) {
        state.results = changes.results.newValue || [];
        renderResultsList();
      }
      if (changes.testSuites) {
        state.testSuites = changes.testSuites.newValue || [];
        renderTestSuitesList();
      }
      if (changes.suiteResults) {
        state.suiteResults = changes.suiteResults.newValue || [];
        renderTestSuitesList(); // Update suite list to show latest results
      }
    }
  });
}

// Tab Navigation Functions
function switchTab(tabName) {
  // Update tab buttons
  elements.tabButtons.forEach(button => {
    if (button.dataset.tab === tabName) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });

  // Update tab contents
  elements.tabContents.forEach(content => {
    if (content.id === `${tabName}-tab`) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
}

// Scripts Tab Functions
function renderScriptsList() {
  if (state.scripts.length === 0) {
    elements.scriptsList.innerHTML = '<div class="empty-state">No scripts yet. Create one to get started!</div>';
    return;
  }

  elements.scriptsList.innerHTML = '';
  state.scripts.forEach(script => {
    const scriptElement = document.createElement('div');
    scriptElement.className = `script-item ${script.id === state.currentScriptId ? 'active' : ''}`;
    scriptElement.dataset.id = script.id;
    scriptElement.textContent = script.name;
    scriptElement.addEventListener('click', () => selectScript(script.id));
    elements.scriptsList.appendChild(scriptElement);
  });
}

function newScript() {
  state.currentScriptId = null;
  elements.scriptNameInput.value = '';
  elements.scriptCodeInput.value = '';
  elements.scriptEditor.classList.remove('hidden');
  elements.scriptActions.classList.add('hidden');
  elements.scriptNameInput.focus();
}

function saveScript() {
  const name = elements.scriptNameInput.value.trim();
  const code = elements.scriptCodeInput.value.trim();

  if (!name) {
    showStatus('Please enter a script name', true);
    return;
  }

  if (state.currentScriptId) {
    // Update existing script
    const scriptIndex = state.scripts.findIndex(s => s.id === state.currentScriptId);
    if (scriptIndex !== -1) {
      state.scripts[scriptIndex].name = name;
      state.scripts[scriptIndex].code = code;
      showStatus(`Script "${name}" updated`);
    }
  } else {
    // Create new script
    const newScript = {
      id: Date.now().toString(),
      name,
      code,
      createdAt: new Date().toISOString()
    };
    state.scripts.push(newScript);
    state.currentScriptId = newScript.id;
    showStatus(`Script "${name}" created`);
  }

  saveState();
  renderScriptsList();
  elements.scriptEditor.classList.add('hidden');
  elements.scriptActions.classList.remove('hidden');
}

function cancelScriptEdit() {
  elements.scriptEditor.classList.add('hidden');
  if (state.currentScriptId) {
    elements.scriptActions.classList.remove('hidden');
  }
}

function selectScript(scriptId) {
  state.currentScriptId = scriptId;
  renderScriptsList();
  elements.scriptActions.classList.remove('hidden');
}

function editCurrentScript() {
  if (!state.currentScriptId) return;

  const script = state.scripts.find(s => s.id === state.currentScriptId);
  if (script) {
    elements.scriptNameInput.value = script.name;
    elements.scriptCodeInput.value = script.code;
    elements.scriptEditor.classList.remove('hidden');
    elements.scriptActions.classList.add('hidden');
  }
}

function deleteCurrentScript() {
  if (!state.currentScriptId) return;

  const script = state.scripts.find(s => s.id === state.currentScriptId);
  if (script && confirm(`Are you sure you want to delete "${script.name}"?`)) {
    state.scripts = state.scripts.filter(s => s.id !== state.currentScriptId);
    state.currentScriptId = null;
    saveState();
    renderScriptsList();
    elements.scriptActions.classList.add('hidden');
    showStatus('Script deleted');
  }
}

// Variables Tab Functions
function renderVariablesList() {
  if (state.variables.length === 0) {
    elements.variablesList.innerHTML = '<div class="empty-state">No variables yet. Create one to use in your scripts!</div>';
    return;
  }

  elements.variablesList.innerHTML = '';
  state.variables.forEach(variable => {
    const variableElement = document.createElement('div');
    variableElement.className = 'variable-item';

    // Create name element
    const nameDiv = document.createElement('div');
    const nameStrong = document.createElement('strong');
    nameStrong.textContent = variable.name;
    nameDiv.appendChild(nameStrong);

    // Create value element
    const valueDiv = document.createElement('div');
    valueDiv.textContent = variable.value;

    // Create actions container
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'variable-item-actions';

    // Create edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'text-btn edit-variable-btn';
    editBtn.dataset.id = variable.id;
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => editVariable(variable.id));

    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'text-btn delete-variable-btn';
    deleteBtn.dataset.id = variable.id;
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteVariable(variable.id));

    // Append buttons to actions
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    // Append all elements to variable item
    variableElement.appendChild(nameDiv);
    variableElement.appendChild(valueDiv);
    variableElement.appendChild(actionsDiv);

    elements.variablesList.appendChild(variableElement);
  });
}

function newVariable() {
  state.currentVariableId = null;
  elements.variableNameInput.value = '';
  elements.variableValueInput.value = '';
  elements.variableEditor.classList.remove('hidden');
  elements.variableNameInput.focus();
}

function saveVariable() {
  const name = elements.variableNameInput.value.trim();
  const value = elements.variableValueInput.value.trim();

  if (!name) {
    showStatus('Please enter a variable name', true);
    return;
  }

  if (state.currentVariableId) {
    // Update existing variable
    const variableIndex = state.variables.findIndex(v => v.id === state.currentVariableId);
    if (variableIndex !== -1) {
      state.variables[variableIndex].name = name;
      state.variables[variableIndex].value = value;
      showStatus(`Variable "${name}" updated`);
    }
  } else {
    // Create new variable
    const newVariable = {
      id: Date.now().toString(),
      name,
      value,
      createdAt: new Date().toISOString()
    };
    state.variables.push(newVariable);
    showStatus(`Variable "${name}" created`);
  }

  saveState();
  renderVariablesList();
  elements.variableEditor.classList.add('hidden');
  state.currentVariableId = null;
}

function cancelVariableEdit() {
  elements.variableEditor.classList.add('hidden');
  state.currentVariableId = null;
}

function editVariable(variableId) {
  const variable = state.variables.find(v => v.id === variableId);
  if (variable) {
    state.currentVariableId = variableId;
    elements.variableNameInput.value = variable.name;
    elements.variableValueInput.value = variable.value;
    elements.variableEditor.classList.remove('hidden');
  }
}

function deleteVariable(variableId) {
  const variable = state.variables.find(v => v.id === variableId);
  if (variable && confirm(`Are you sure you want to delete variable "${variable.name}"?`)) {
    state.variables = state.variables.filter(v => v.id !== variableId);
    saveState();
    renderVariablesList();
    showStatus('Variable deleted');
  }
}

// Script Execution Functions
function runCurrentScript() {
  if (!state.currentScriptId) return;

  const script = state.scripts.find(s => s.id === state.currentScriptId);
  if (!script) return;

  // Process script code to replace variable placeholders
  let processedCode = script.code;
  state.variables.forEach(variable => {
    const placeholder = new RegExp(`\\$\\{${variable.name}\\}`, 'g');
    processedCode = processedCode.replace(placeholder, variable.value);
  });

  // Send script to content script for execution
  browser.tabs.query({ active: true, currentWindow: true })
    .then(tabs => {
      browser.tabs.sendMessage(tabs[0].id, {
        action: 'runScript',
        code: processedCode
      })
        .then(result => {
          // Add result to results list
          const newResult = {
            id: Date.now().toString(),
            scriptName: script.name,
            timestamp: new Date().toISOString(),
            success: result.success,
            output: result.output
          };

          state.results.unshift(newResult);
          if (state.results.length > 50) {
            state.results = state.results.slice(0, 50); // Keep only the last 50 results
          }

          saveState();
          renderResultsList();
          switchTab('results');
          showStatus(`Script "${script.name}" executed`);
        })
        .catch(error => {
          showStatus(`Error executing script: ${error.message}`, true);
        });
    });
}

// Results Tab Functions
function renderResultsList() {
  const hasScriptResults = state.results.length > 0;
  const hasSuiteResults = state.suiteResults.length > 0;

  if (!hasScriptResults && !hasSuiteResults) {
    elements.resultsContainer.innerHTML = '<div class="empty-state">No results yet. Run a script or test suite to see output here!</div>';
    return;
  }

  elements.resultsContainer.innerHTML = '';

  // Combine and sort all results by timestamp
  const allResults = [];

  // Add script results
  state.results.forEach(result => {
    allResults.push({
      type: 'script',
      timestamp: result.timestamp,
      data: result
    });
  });

  // Add test suite results
  state.suiteResults.forEach(result => {
    allResults.push({
      type: 'suite',
      timestamp: result.timestamp,
      data: result
    });
  });

  // Sort by timestamp (newest first)
  allResults.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  allResults.forEach(item => {
    if (item.type === 'script') {
      renderScriptResultSidebar(item.data);
    } else if (item.type === 'suite') {
      renderSuiteResultSidebar(item.data);
    }
  });
}

function renderScriptResultSidebar(result) {
  const resultElement = document.createElement('div');
  resultElement.className = 'result-item script-result';

  const timestamp = new Date(result.timestamp).toLocaleString();
  const statusClass = result.success ? 'result-success' : 'result-error';
  const statusText = result.success ? 'Success' : 'Error';

  // Create header element
  const headerDiv = document.createElement('div');
  headerDiv.className = 'result-header';

  // Create timestamp element
  const timestampDiv = document.createElement('div');
  timestampDiv.className = 'result-timestamp';
  timestampDiv.textContent = `Script: ${result.scriptName}`;

  // Create status element
  const statusDiv = document.createElement('div');
  statusDiv.className = `result-status ${statusClass}`;
  statusDiv.textContent = statusText;

  // Create content element (simplified for sidebar)
  const contentDiv = document.createElement('div');
  contentDiv.className = 'result-content';
  contentDiv.textContent = result.output.length > 100 ?
    result.output.substring(0, 100) + '...' :
    result.output;

  // Append elements
  headerDiv.appendChild(timestampDiv);
  headerDiv.appendChild(statusDiv);
  resultElement.appendChild(headerDiv);
  resultElement.appendChild(contentDiv);

  elements.resultsContainer.appendChild(resultElement);
}

function renderSuiteResultSidebar(result) {
  const resultElement = document.createElement('div');
  resultElement.className = 'result-item suite-result';

  const timestamp = new Date(result.timestamp).toLocaleString();
  const suite = state.testSuites.find(s => s.id === result.suiteId);
  const suiteName = suite ? suite.name : 'Unknown Suite';

  let statusClass = 'result-success';
  let statusText = 'Passed';
  if (result.status === 'failed') {
    statusClass = 'result-error';
    statusText = 'Failed';
  } else if (result.status === 'error') {
    statusClass = 'result-error';
    statusText = 'Error';
  }

  // Create header element
  const headerDiv = document.createElement('div');
  headerDiv.className = 'result-header';

  // Create timestamp element
  const timestampDiv = document.createElement('div');
  timestampDiv.className = 'result-timestamp';
  timestampDiv.textContent = `Suite: ${suiteName}`;

  // Create status element
  const statusDiv = document.createElement('div');
  statusDiv.className = `result-status ${statusClass}`;
  statusDiv.textContent = statusText;

  // Create summary element (simplified for sidebar)
  const summaryDiv = document.createElement('div');
  summaryDiv.className = 'suite-summary-simple';
  const summary = result.summary;
  summaryDiv.textContent = `${summary.passed}/${summary.total} passed`;

  // Append elements
  headerDiv.appendChild(timestampDiv);
  headerDiv.appendChild(statusDiv);
  resultElement.appendChild(headerDiv);
  resultElement.appendChild(summaryDiv);

  elements.resultsContainer.appendChild(resultElement);
}

function clearResults() {
  if (confirm('Are you sure you want to clear all results?')) {
    state.results = [];
    saveState();
    renderResultsList();
    showStatus('Results cleared');
  }
}

/**
 * Start the element selection process
 */
function startElementSelection() {
  // Show cancel button and hide start button (for inspector tab)
  if (elements.startSelectionBtn) {
    elements.startSelectionBtn.classList.add('hidden');
  }
  if (elements.cancelSelectionBtn) {
    elements.cancelSelectionBtn.classList.remove('hidden');
  }

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
  if (elements.startSelectionBtn) {
    elements.startSelectionBtn.classList.remove('hidden');
  }
  if (elements.cancelSelectionBtn) {
    elements.cancelSelectionBtn.classList.add('hidden');
  }
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

  // Update the XPath input field (for inspector tab)
  if (elements.xpathValueInput) {
    elements.xpathValueInput.value = xpath;
  }

  // Enable buttons (for inspector tab)
  if (elements.insertXPathBtn) {
    elements.insertXPathBtn.disabled = false;
  }
  if (elements.testXPathBtn) {
    elements.testXPathBtn.disabled = false;
  }

  // Display element info (for inspector tab)
  if (elements.elementInfoPanel && elementInfo) {
    const infoHTML = `
      <div class="element-details">
        <p><strong>Tag:</strong> ${escapeHtml(elementInfo.tagName || '')}</p>
        <p><strong>ID:</strong> ${escapeHtml(elementInfo.id || 'None')}</p>
        <p><strong>Classes:</strong> ${escapeHtml(elementInfo.classes || 'None')}</p>
        <p><strong>Text:</strong> ${escapeHtml(elementInfo.textContent || 'None')}</p>
      </div>
    `;
    elements.elementInfoPanel.innerHTML = infoHTML;
  } else if (elements.elementInfoPanel) {
    elements.elementInfoPanel.innerHTML = '<p>Element selected but no details available</p>';
  }

  // If script editor is open, insert XPath directly into the script
  if (elements.scriptEditor && !elements.scriptEditor.classList.contains('hidden')) {
    insertXPathIntoScriptEditor(xpath);
  }

  showStatus('Element selected successfully');
}

/**
 * Insert XPath into the script editor at cursor position
 */
function insertXPathIntoScriptEditor(xpath) {
  if (!elements.scriptCodeInput) return;

  const cursorPos = elements.scriptCodeInput.selectionStart;
  const textBefore = elements.scriptCodeInput.value.substring(0, cursorPos);
  const textAfter = elements.scriptCodeInput.value.substring(cursorPos);

  const xpathCode = `document.evaluate("${xpath}", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue`;
  elements.scriptCodeInput.value = textBefore + xpathCode + textAfter;

  // Focus back on the editor
  elements.scriptCodeInput.focus();
  elements.scriptCodeInput.selectionStart = cursorPos + xpathCode.length;
  elements.scriptCodeInput.selectionEnd = cursorPos + xpathCode.length;

  showStatus('Element XPath added to script');
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
  if (elements.xpathValueInput) {
    elements.xpathValueInput.select();
    document.execCommand('copy');
  }

  showStatus('XPath copied to clipboard');
}

/**
 * Insert the XPath into the active script (for inspector tab)
 */
function insertXPathIntoScript() {
  if (!selectedXPath) {
    showStatus('No XPath to insert', true);
    return;
  }

  // If script editor is open in sidebar, insert directly
  if (elements.scriptEditor && !elements.scriptEditor.classList.contains('hidden')) {
    insertXPathIntoScriptEditor(selectedXPath);
    return;
  }

  // Otherwise, send message to background script to forward to popup
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
  if (elements.statusMessage) {
    elements.statusMessage.textContent = message;
    elements.statusMessage.style.color = isError ? '#d70022' : '#737373';

    // Clear the message after 3 seconds
    setTimeout(() => {
      elements.statusMessage.textContent = '';
    }, 3000);
  }
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

// Test Suites Tab Functions (Simplified for sidebar)
function renderTestSuitesList() {
  if (state.testSuites.length === 0) {
    elements.testSuitesList.innerHTML = '<div class="empty-state">No test suites yet. Create one to organize your tests!</div>';
    return;
  }

  elements.testSuitesList.innerHTML = '';
  state.testSuites.forEach(suite => {
    const suiteElement = document.createElement('div');
    suiteElement.className = `test-suite-item ${suite.id === state.currentTestSuiteId ? 'active' : ''}`;
    suiteElement.dataset.id = suite.id;

    // Get latest execution result for this suite
    const latestResult = state.suiteResults.find(result => result.suiteId === suite.id);
    const statusText = latestResult ?
      `${latestResult.summary.passed}/${latestResult.summary.total}` :
      'Never run';

    suiteElement.innerHTML = `
      <div class="test-suite-item-header">
        <div class="test-suite-item-name">${escapeHtml(suite.name)}</div>
        <div class="test-suite-item-actions">
          <button class="text-btn run-suite-btn" data-id="${suite.id}">▶</button>
          <button class="text-btn edit-suite-btn" data-id="${suite.id}">⚙</button>
          <button class="text-btn delete-suite-btn" data-id="${suite.id}">×</button>
        </div>
      </div>
      <div class="test-suite-item-info">${suite.testCases.length} test cases</div>
      <div class="test-suite-item-status">Status: ${statusText}</div>
    `;

    suiteElement.addEventListener('click', (e) => {
      if (!e.target.classList.contains('text-btn')) {
        selectTestSuite(suite.id);
      }
    });

    elements.testSuitesList.appendChild(suiteElement);
  });

  // Add event listeners for action buttons
  document.querySelectorAll('.run-suite-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      runTestSuite(btn.dataset.id);
    });
  });

  document.querySelectorAll('.edit-suite-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      editTestSuite(btn.dataset.id);
    });
  });

  document.querySelectorAll('.delete-suite-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTestSuite(btn.dataset.id);
    });
  });
}

function newTestSuite() {
  state.currentTestSuiteId = null;
  elements.testSuiteNameInput.value = '';
  elements.testSuiteDescriptionInput.value = '';
  elements.testSuiteTagsInput.value = '';
  elements.setupScriptSelect.value = '';
  elements.setupScriptEnabled.checked = false;
  elements.teardownScriptSelect.value = '';
  elements.teardownScriptEnabled.checked = false;
  elements.stopOnFailure.checked = true;
  elements.runParallel.checked = false;
  elements.defaultTimeout.value = 30;
  elements.defaultRetry.value = 1;

  // Populate script selects
  populateScriptSelects();

  // Clear test cases
  renderTestCasesList();

  elements.testSuiteEditor.classList.remove('hidden');
  elements.testSuiteActions.classList.add('hidden');
  elements.testSuiteNameInput.focus();
}

function populateScriptSelects() {
  const setupSelect = elements.setupScriptSelect;
  const teardownSelect = elements.teardownScriptSelect;

  if (!setupSelect || !teardownSelect) return;

  // Clear existing options except the first one
  setupSelect.innerHTML = '<option value="">Select setup script (optional)</option>';
  teardownSelect.innerHTML = '<option value="">Select teardown script (optional)</option>';

  // Add script options
  state.scripts.forEach(script => {
    const setupOption = document.createElement('option');
    setupOption.value = script.id;
    setupOption.textContent = script.name;
    setupSelect.appendChild(setupOption);

    const teardownOption = document.createElement('option');
    teardownOption.value = script.id;
    teardownOption.textContent = script.name;
    teardownSelect.appendChild(teardownOption);
  });
}

function saveTestSuite() {
  const name = elements.testSuiteNameInput.value.trim();
  const description = elements.testSuiteDescriptionInput.value.trim();
  const tags = elements.testSuiteTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);

  if (!name) {
    showStatus('Please enter a test suite name', true);
    return;
  }

  const suiteData = {
    name,
    description,
    tags,
    setupScript: {
      id: elements.setupScriptSelect.value || null,
      enabled: elements.setupScriptEnabled.checked
    },
    teardownScript: {
      id: elements.teardownScriptSelect.value || null,
      enabled: elements.teardownScriptEnabled.checked
    },
    configuration: {
      stopOnFailure: elements.stopOnFailure.checked,
      timeout: parseInt(elements.defaultTimeout.value) * 1000,
      retryCount: parseInt(elements.defaultRetry.value),
      parallel: elements.runParallel.checked
    },
    testCases: [] // Will be populated by test case management
  };

  if (state.currentTestSuiteId) {
    // Update existing test suite
    const suiteIndex = state.testSuites.findIndex(s => s.id === state.currentTestSuiteId);
    if (suiteIndex !== -1) {
      state.testSuites[suiteIndex] = { ...state.testSuites[suiteIndex], ...suiteData };
      showStatus(`Test suite "${name}" updated`);
    }
  } else {
    // Create new test suite
    const newSuite = {
      id: Date.now().toString(),
      ...suiteData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastExecuted: null,
      executionHistory: []
    };
    state.testSuites.push(newSuite);
    state.currentTestSuiteId = newSuite.id;
    showStatus(`Test suite "${name}" created`);
  }

  saveState();
  renderTestSuitesList();
  elements.testSuiteEditor.classList.add('hidden');
  elements.testSuiteActions.classList.remove('hidden');
}

function cancelTestSuiteEdit() {
  elements.testSuiteEditor.classList.add('hidden');
  if (state.currentTestSuiteId) {
    elements.testSuiteActions.classList.remove('hidden');
  }
}

function selectTestSuite(suiteId) {
  state.currentTestSuiteId = suiteId;
  renderTestSuitesList();
  renderTestCasesList();
  elements.testSuiteActions.classList.remove('hidden');
}

function editCurrentTestSuite() {
  if (!state.currentTestSuiteId) return;
  editTestSuite(state.currentTestSuiteId);
}

function editTestSuite(suiteId) {
  const suite = state.testSuites.find(s => s.id === suiteId);
  if (!suite) return;

  state.currentTestSuiteId = suiteId;
  elements.testSuiteNameInput.value = suite.name;
  elements.testSuiteDescriptionInput.value = suite.description || '';
  elements.testSuiteTagsInput.value = suite.tags.join(', ');
  elements.setupScriptSelect.value = suite.setupScript.id || '';
  elements.setupScriptEnabled.checked = suite.setupScript.enabled;
  elements.teardownScriptSelect.value = suite.teardownScript.id || '';
  elements.teardownScriptEnabled.checked = suite.teardownScript.enabled;
  elements.stopOnFailure.checked = suite.configuration.stopOnFailure;
  elements.runParallel.checked = suite.configuration.parallel;
  elements.defaultTimeout.value = Math.floor(suite.configuration.timeout / 1000);
  elements.defaultRetry.value = suite.configuration.retryCount;

  // Populate script selects
  populateScriptSelects();

  // Populate test cases list
  renderTestCasesList();

  elements.testSuiteEditor.classList.remove('hidden');
  elements.testSuiteActions.classList.add('hidden');
}

function deleteCurrentTestSuite() {
  if (!state.currentTestSuiteId) return;
  deleteTestSuite(state.currentTestSuiteId);
}

function deleteTestSuite(suiteId) {
  const suite = state.testSuites.find(s => s.id === suiteId);
  if (!suite) return;

  if (confirm(`Are you sure you want to delete test suite "${suite.name}"?`)) {
    state.testSuites = state.testSuites.filter(s => s.id !== suiteId);
    state.suiteResults = state.suiteResults.filter(r => r.suiteId !== suiteId);
    state.currentTestSuiteId = null;
    saveState();
    renderTestSuitesList();
    elements.testSuiteActions.classList.add('hidden');
    showStatus('Test suite deleted');
  }
}

function duplicateCurrentTestSuite() {
  if (!state.currentTestSuiteId) return;

  const suite = state.testSuites.find(s => s.id === state.currentTestSuiteId);
  if (!suite) return;

  const duplicatedSuite = {
    ...suite,
    id: Date.now().toString(),
    name: `${suite.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastExecuted: null,
    executionHistory: []
  };

  state.testSuites.push(duplicatedSuite);
  saveState();
  renderTestSuitesList();
  showStatus(`Test suite duplicated as "${duplicatedSuite.name}"`);
}

function runCurrentTestSuite() {
  if (!state.currentTestSuiteId) return;
  runTestSuite(state.currentTestSuiteId);
}

async function runTestSuite(suiteId) {
  const suite = state.testSuites.find(s => s.id === suiteId);
  if (!suite) return;

  if (suite.testCases.filter(tc => tc.enabled).length === 0) {
    showStatus('No enabled test cases to execute', true);
    return;
  }

  try {
    // Create simplified executor for sidebar
    const executor = {
      async executeTestSuite(testSuite, scripts, variables) {
        const executionResult = {
          id: `execution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          suiteId: testSuite.id,
          timestamp: new Date().toISOString(),
          duration: 0,
          status: 'running',
          summary: { total: 0, passed: 0, failed: 0, skipped: 0, errors: 0 },
          testCaseResults: [],
          environment: {
            url: 'sidebar-context',
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        };

        const startTime = Date.now();
        const enabledTestCases = testSuite.testCases.filter(tc => tc.enabled);
        executionResult.summary.total = enabledTestCases.length;

        // Execute test cases sequentially
        for (const testCase of enabledTestCases) {
          const script = scripts.find(s => s.id === testCase.scriptId);
          if (!script) continue;

          try {
            // Process script code with variable substitution
            let processedCode = script.code;
            variables.forEach(variable => {
              const placeholder = new RegExp(`\\$\\{${variable.name}\\}`, 'g');
              processedCode = processedCode.replace(placeholder, variable.value);
            });

            // Execute script
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            const result = await browser.tabs.sendMessage(tabs[0].id, {
              action: 'runScript',
              code: processedCode
            });

            const testCaseResult = {
              testCaseId: testCase.id,
              status: result.success ? 'passed' : 'failed',
              duration: 1000, // Placeholder
              output: result.output || '',
              error: result.success ? null : { message: result.output }
            };

            executionResult.testCaseResults.push(testCaseResult);

            if (testCaseResult.status === 'passed') {
              executionResult.summary.passed++;
            } else {
              executionResult.summary.failed++;
            }

          } catch (error) {
            const errorResult = {
              testCaseId: testCase.id,
              status: 'error',
              duration: 0,
              output: error.message,
              error: { message: error.message }
            };
            executionResult.testCaseResults.push(errorResult);
            executionResult.summary.errors++;
          }
        }

        executionResult.duration = Date.now() - startTime;
        if (executionResult.summary.errors > 0) {
          executionResult.status = 'error';
        } else if (executionResult.summary.failed > 0) {
          executionResult.status = 'failed';
        } else {
          executionResult.status = 'passed';
        }

        return executionResult;
      }
    };

    showStatus(`Running test suite "${suite.name}"...`);
    switchTab('results');

    const executionResult = await executor.executeTestSuite(suite, state.scripts, state.variables);

    // Save execution result
    state.suiteResults.unshift(executionResult);
    if (state.suiteResults.length > 50) {
      state.suiteResults = state.suiteResults.slice(0, 50);
    }

    // Update test suite last executed time
    const suiteIndex = state.testSuites.findIndex(s => s.id === suiteId);
    if (suiteIndex !== -1) {
      state.testSuites[suiteIndex].lastExecuted = executionResult.timestamp;
    }

    saveState();
    renderTestSuitesList();
    renderResultsList();

    const summary = executionResult.summary;
    const statusMsg = `Test suite completed: ${summary.passed}/${summary.total} passed`;
    showStatus(statusMsg, summary.failed > 0 || summary.errors > 0);

  } catch (error) {
    showStatus(`Failed to run test suite: ${error.message}`, true);
    console.error('Test suite execution error:', error);
  }
}

// Test Case Management Functions (Sidebar)
function addTestCase() {
  if (!state.currentTestSuiteId) {
    showStatus('Please select a test suite first', true);
    return;
  }

  state.editingTestCase = null;
  elements.testCaseEditorTitle.textContent = 'Add Test Case';

  // Clear form
  elements.testCaseName.value = '';
  elements.testCaseScript.value = '';
  elements.testCaseTimeout.value = '';
  elements.testCaseRetry.value = '';
  elements.testCaseEnabled.checked = true;

  // Populate script dropdown
  populateTestCaseScriptSelect();

  // Show editor
  elements.testCaseEditor.classList.remove('hidden');
  elements.testCaseName.focus();
}

function populateTestCaseScriptSelect() {
  elements.testCaseScript.innerHTML = '<option value="">Select a script</option>';

  state.scripts.forEach(script => {
    const option = document.createElement('option');
    option.value = script.id;
    option.textContent = script.name;
    elements.testCaseScript.appendChild(option);
  });
}

function saveTestCase() {
  const name = elements.testCaseName.value.trim();
  const scriptId = elements.testCaseScript.value;

  if (!name) {
    showStatus('Please enter a test case name', true);
    return;
  }

  if (!scriptId) {
    showStatus('Please select a script', true);
    return;
  }

  const suite = state.testSuites.find(s => s.id === state.currentTestSuiteId);
  if (!suite) {
    showStatus('Test suite not found', true);
    return;
  }

  const testCaseData = {
    name,
    scriptId,
    description: '',
    enabled: elements.testCaseEnabled.checked,
    timeout: elements.testCaseTimeout.value ? parseInt(elements.testCaseTimeout.value) * 1000 : null,
    retryCount: elements.testCaseRetry.value ? parseInt(elements.testCaseRetry.value) : null,
    dependencies: []
  };

  if (state.editingTestCase) {
    // Update existing test case
    const testCaseIndex = suite.testCases.findIndex(tc => tc.id === state.editingTestCase.id);
    if (testCaseIndex !== -1) {
      suite.testCases[testCaseIndex] = { ...suite.testCases[testCaseIndex], ...testCaseData };
      showStatus(`Test case "${name}" updated`);
    }
  } else {
    // Create new test case
    const newTestCase = {
      id: Date.now().toString(),
      ...testCaseData,
      order: suite.testCases.length
    };
    suite.testCases.push(newTestCase);
    showStatus(`Test case "${name}" added`);
  }

  // Update suite timestamp
  suite.updatedAt = new Date().toISOString();

  saveState();
  renderTestCasesList();
  elements.testCaseEditor.classList.add('hidden');
}

function cancelTestCaseEdit() {
  elements.testCaseEditor.classList.add('hidden');
  state.editingTestCase = null;
}

function editTestCase(testCaseId) {
  const suite = state.testSuites.find(s => s.id === state.currentTestSuiteId);
  if (!suite) return;

  const testCase = suite.testCases.find(tc => tc.id === testCaseId);
  if (!testCase) return;

  state.editingTestCase = testCase;
  elements.testCaseEditorTitle.textContent = 'Edit Test Case';

  // Populate form
  elements.testCaseName.value = testCase.name;
  elements.testCaseScript.value = testCase.scriptId;
  elements.testCaseTimeout.value = testCase.timeout ? Math.floor(testCase.timeout / 1000) : '';
  elements.testCaseRetry.value = testCase.retryCount !== null ? testCase.retryCount : '';
  elements.testCaseEnabled.checked = testCase.enabled;

  // Populate script dropdown
  populateTestCaseScriptSelect();

  // Show editor
  elements.testCaseEditor.classList.remove('hidden');
}

function deleteTestCase(testCaseId) {
  const suite = state.testSuites.find(s => s.id === state.currentTestSuiteId);
  if (!suite) return;

  const testCase = suite.testCases.find(tc => tc.id === testCaseId);
  if (!testCase) return;

  if (confirm(`Are you sure you want to delete test case "${testCase.name}"?`)) {
    suite.testCases = suite.testCases.filter(tc => tc.id !== testCaseId);

    // Reorder remaining test cases
    suite.testCases.forEach((tc, index) => {
      tc.order = index;
    });

    suite.updatedAt = new Date().toISOString();
    saveState();
    renderTestCasesList();
    showStatus('Test case deleted');
  }
}

function toggleTestCase(testCaseId) {
  const suite = state.testSuites.find(s => s.id === state.currentTestSuiteId);
  if (!suite) return;

  const testCase = suite.testCases.find(tc => tc.id === testCaseId);
  if (!testCase) return;

  testCase.enabled = !testCase.enabled;
  suite.updatedAt = new Date().toISOString();
  saveState();
  renderTestCasesList();

  const status = testCase.enabled ? 'enabled' : 'disabled';
  showStatus(`Test case "${testCase.name}" ${status}`);
}

function moveTestCase(testCaseId, direction) {
  const suite = state.testSuites.find(s => s.id === state.currentTestSuiteId);
  if (!suite) return;

  const currentIndex = suite.testCases.findIndex(tc => tc.id === testCaseId);
  if (currentIndex === -1) return;

  let newIndex;
  if (direction === 'up' && currentIndex > 0) {
    newIndex = currentIndex - 1;
  } else if (direction === 'down' && currentIndex < suite.testCases.length - 1) {
    newIndex = currentIndex + 1;
  } else {
    return; // Can't move
  }

  // Swap test cases
  const testCase = suite.testCases[currentIndex];
  suite.testCases[currentIndex] = suite.testCases[newIndex];
  suite.testCases[newIndex] = testCase;

  // Update order values
  suite.testCases.forEach((tc, index) => {
    tc.order = index;
  });

  suite.updatedAt = new Date().toISOString();
  saveState();
  renderTestCasesList();
  showStatus(`Test case "${testCase.name}" moved ${direction}`);
}

function renderTestCasesList() {
  if (!state.currentTestSuiteId) {
    elements.testCasesList.innerHTML = '<div class="empty-state">No test suite selected</div>';
    return;
  }

  const suite = state.testSuites.find(s => s.id === state.currentTestSuiteId);
  if (!suite || suite.testCases.length === 0) {
    elements.testCasesList.innerHTML = '<div class="empty-state">No test cases yet. Add one to get started!</div>';
    return;
  }

  elements.testCasesList.innerHTML = '';

  // Sort test cases by order
  const sortedTestCases = [...suite.testCases].sort((a, b) => a.order - b.order);

  sortedTestCases.forEach((testCase, index) => {
    const script = state.scripts.find(s => s.id === testCase.scriptId);
    const scriptName = script ? script.name : 'Unknown Script';

    const testCaseElement = document.createElement('div');
    testCaseElement.className = `test-case-item ${testCase.enabled ? '' : 'disabled'}`;
    testCaseElement.dataset.id = testCase.id;

    testCaseElement.innerHTML = `
      <div class="test-case-header">
        <div class="test-case-name">${escapeHtml(testCase.name)}</div>
        <div class="test-case-actions">
          <div class="reorder-buttons">
            <button class="reorder-btn" onclick="moveTestCase('${testCase.id}', 'up')" ${index === 0 ? 'disabled' : ''}>↑</button>
            <button class="reorder-btn" onclick="moveTestCase('${testCase.id}', 'down')" ${index === sortedTestCases.length - 1 ? 'disabled' : ''}>↓</button>
          </div>
          <button class="text-btn toggle-test-case-btn" onclick="toggleTestCase('${testCase.id}')">${testCase.enabled ? '⏸' : '▶'}</button>
          <button class="text-btn edit-test-case-btn" onclick="editTestCase('${testCase.id}')">✏</button>
          <button class="text-btn delete-test-case-btn" onclick="deleteTestCase('${testCase.id}')">×</button>
        </div>
      </div>
      <div class="test-case-info">
        <span class="test-case-script">Script: ${escapeHtml(scriptName)}</span>
        ${testCase.timeout ? `<span>Timeout: ${Math.floor(testCase.timeout / 1000)}s</span>` : ''}
        ${testCase.retryCount !== null ? `<span>Retry: ${testCase.retryCount}</span>` : ''}
      </div>
    `;

    elements.testCasesList.appendChild(testCaseElement);
  });
}

// Make test case functions globally available
window.editTestCase = editTestCase;
window.deleteTestCase = deleteTestCase;
window.toggleTestCase = toggleTestCase;
window.moveTestCase = moveTestCase;

