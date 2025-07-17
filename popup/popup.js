// Import TestSuiteExecutor (we'll need to load it dynamically since we can't use ES6 imports in extension context)
// For now, we'll include a simplified version inline

// Test Suite Execution Engine (Simplified for popup context)
class TestSuiteExecutor {
  constructor() {
    this.isExecuting = false;
    this.currentExecution = null;
    this.executionCallbacks = {};
  }

  setCallbacks(callbacks) {
    this.executionCallbacks = { ...this.executionCallbacks, ...callbacks };
  }

  async executeTestSuite(testSuite, scripts, variables = []) {
    if (this.isExecuting) {
      throw new Error('Another test suite is currently executing');
    }

    this.isExecuting = true;

    const executionResult = {
      id: `execution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      suiteId: testSuite.id,
      timestamp: new Date().toISOString(),
      duration: 0,
      status: 'running',
      summary: { total: 0, passed: 0, failed: 0, skipped: 0, errors: 0 },
      testCaseResults: [],
      environment: {
        url: 'popup-context',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    };

    this.currentExecution = executionResult;
    const startTime = Date.now();

    try {
      if (this.executionCallbacks.onStart) {
        this.executionCallbacks.onStart(executionResult);
      }

      const enabledTestCases = testSuite.testCases
        .filter(tc => tc.enabled)
        .sort((a, b) => a.order - b.order);

      executionResult.summary.total = enabledTestCases.length;

      // Execute setup script if configured
      if (testSuite.setupScript.enabled && testSuite.setupScript.id) {
        await this.executeScript(testSuite.setupScript.id, scripts, variables);
      }

      // Execute test cases
      for (let i = 0; i < enabledTestCases.length; i++) {
        const testCase = enabledTestCases[i];

        try {
          if (this.executionCallbacks.onTestCaseStart) {
            this.executionCallbacks.onTestCaseStart(testCase);
          }

          const testCaseResult = await this.executeTestCase(testCase, scripts, variables, testSuite.configuration);
          executionResult.testCaseResults.push(testCaseResult);

          if (testCaseResult.status === 'passed') {
            executionResult.summary.passed++;
          } else if (testCaseResult.status === 'failed') {
            executionResult.summary.failed++;
          } else if (testCaseResult.status === 'error') {
            executionResult.summary.errors++;
          }

          if (this.executionCallbacks.onProgress) {
            this.executionCallbacks.onProgress(executionResult, i + 1, enabledTestCases.length);
          }

          if (this.executionCallbacks.onTestCaseComplete) {
            this.executionCallbacks.onTestCaseComplete(testCase, testCaseResult);
          }

          if (testSuite.configuration.stopOnFailure &&
              (testCaseResult.status === 'failed' || testCaseResult.status === 'error')) {
            break;
          }

        } catch (error) {
          const errorResult = {
            testCaseId: testCase.id,
            status: 'error',
            duration: 0,
            output: error.message,
            error: { message: error.message, stack: error.stack }
          };
          executionResult.testCaseResults.push(errorResult);
          executionResult.summary.errors++;

          if (testSuite.configuration.stopOnFailure) {
            break;
          }
        }
      }

      // Execute teardown script if configured
      if (testSuite.teardownScript.enabled && testSuite.teardownScript.id) {
        await this.executeScript(testSuite.teardownScript.id, scripts, variables);
      }

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

      if (this.executionCallbacks.onComplete) {
        this.executionCallbacks.onComplete(executionResult);
      }

      return executionResult;

    } catch (error) {
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

  async executeTestCase(testCase, scripts, variables, suiteConfiguration) {
    const script = scripts.find(s => s.id === testCase.scriptId);
    if (!script) {
      throw new Error(`Script not found for test case: ${testCase.name}`);
    }

    const startTime = Date.now();

    try {
      const result = await this.executeScript(script.id, scripts, variables);
      const duration = Date.now() - startTime;

      // Simple status determination - in a real implementation, we'd parse assertion results
      const status = result.success ? 'passed' : 'failed';

      return {
        testCaseId: testCase.id,
        status,
        duration,
        output: result.output || '',
        assertions: [],
        error: result.success ? null : { message: result.output }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testCaseId: testCase.id,
        status: 'error',
        duration,
        output: error.message,
        error: { message: error.message, stack: error.stack }
      };
    }
  }

  async executeScript(scriptId, scripts, variables) {
    const script = scripts.find(s => s.id === scriptId);
    if (!script) {
      throw new Error(`Script not found: ${scriptId}`);
    }

    // Process script code with variable substitution
    let processedCode = script.code;
    variables.forEach(variable => {
      const placeholder = new RegExp(`\\$\\{${variable.name}\\}`, 'g');
      processedCode = processedCode.replace(placeholder, variable.value);
    });

    // Execute script via content script
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      throw new Error('No active tab found');
    }

    return await browser.tabs.sendMessage(tabs[0].id, {
      action: 'runScript',
      code: processedCode
    });
  }
}

// Global state
let state = {
  scripts: [],
  variables: [],
  results: [],
  testSuites: [],
  suiteResults: [],
  currentScriptId: null,
  currentTestSuiteId: null,
  currentTestCaseId: null,
  editingTestCase: null,
  isSelectingElement: false
};

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
  selectElementBtn: document.getElementById('select-element-btn'),
  runScriptBtn: document.getElementById('run-script-btn'),
  editScriptBtn: document.getElementById('edit-script-btn'),
  deleteScriptBtn: document.getElementById('delete-script-btn'),
  scriptNameInput: document.getElementById('script-name'),
  scriptCodeInput: document.getElementById('script-code'),
  
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
  runTestSuiteBtn: document.getElementById('run-test-suite-btn'),
  duplicateTestSuiteBtn: document.getElementById('duplicate-test-suite-btn'),
  testSuiteNameInput: document.getElementById('test-suite-name'),
  testSuiteDescriptionInput: document.getElementById('test-suite-description'),
  testSuiteTagsInput: document.getElementById('test-suite-tags'),
  setupScriptSelect: document.getElementById('setup-script-select'),
  setupScriptEnabled: document.getElementById('setup-script-enabled'),
  teardownScriptSelect: document.getElementById('teardown-script-select'),
  teardownScriptEnabled: document.getElementById('teardown-script-enabled'),
  addTestCaseBtn: document.getElementById('add-test-case-btn'),
  testCasesList: document.getElementById('test-cases-list'),
  stopOnFailure: document.getElementById('stop-on-failure'),
  runParallel: document.getElementById('run-parallel'),
  defaultTimeout: document.getElementById('default-timeout'),
  defaultRetry: document.getElementById('default-retry'),

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
  testCaseDescription: document.getElementById('test-case-description'),
  testCaseDependencies: document.getElementById('test-case-dependencies'),

  // Results Tab
  resultsContainer: document.getElementById('results-container'),
  clearResultsBtn: document.getElementById('clear-results-btn'),
  
  // Element Selector
  elementSelectorOverlay: document.getElementById('element-selector-overlay'),
  cancelSelectionBtn: document.getElementById('cancel-selection-btn'),
  
  // Status
  statusMessage: document.getElementById('status-message')
};

// Initialize the extension
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
      showStatus(`Error loading data: ${error.message}`, 'error');
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
      showStatus(`Error saving data: ${error.message}`, 'error');
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
  elements.newScriptBtn.addEventListener('click', createNewScript);
  elements.saveScriptBtn.addEventListener('click', saveScript);
  elements.cancelScriptBtn.addEventListener('click', cancelScriptEdit);
  elements.selectElementBtn.addEventListener('click', startElementSelection);
  elements.runScriptBtn.addEventListener('click', runCurrentScript);
  elements.editScriptBtn.addEventListener('click', editCurrentScript);
  elements.deleteScriptBtn.addEventListener('click', deleteCurrentScript);
  
  // Variables Tab
  elements.newVariableBtn.addEventListener('click', createNewVariable);
  elements.saveVariableBtn.addEventListener('click', saveVariable);
  elements.cancelVariableBtn.addEventListener('click', cancelVariableEdit);

  // Test Suites Tab
  elements.newTestSuiteBtn.addEventListener('click', newTestSuite);
  elements.saveTestSuiteBtn.addEventListener('click', saveTestSuite);
  elements.cancelTestSuiteBtn.addEventListener('click', cancelTestSuiteEdit);
  elements.editTestSuiteBtn.addEventListener('click', editCurrentTestSuite);
  elements.deleteTestSuiteBtn.addEventListener('click', deleteCurrentTestSuite);
  elements.runTestSuiteBtn.addEventListener('click', runCurrentTestSuite);
  elements.duplicateTestSuiteBtn.addEventListener('click', duplicateCurrentTestSuite);
  elements.addTestCaseBtn.addEventListener('click', addTestCase);

  // Test Case Editor
  elements.saveTestCaseBtn.addEventListener('click', saveTestCase);
  elements.cancelTestCaseBtn.addEventListener('click', cancelTestCaseEdit);

  // Results Tab
  elements.clearResultsBtn.addEventListener('click', clearResults);
  
  // Element Selector
  elements.cancelSelectionBtn.addEventListener('click', cancelElementSelection);
}

// Switch between tabs
function switchTab(tabName) {
  elements.tabButtons.forEach(button => {
    button.classList.toggle('active', button.dataset.tab === tabName);
  });
  
  elements.tabContents.forEach(content => {
    content.classList.toggle('active', content.id === `${tabName}-tab`);
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

function createNewScript() {
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
    showStatus('Please enter a script name', 'error');
    return;
  }
  
  if (state.currentScriptId) {
    // Update existing script
    const scriptIndex = state.scripts.findIndex(s => s.id === state.currentScriptId);
    if (scriptIndex !== -1) {
      state.scripts[scriptIndex].name = name;
      state.scripts[scriptIndex].code = code;
      showStatus(`Script "${name}" updated`, 'success');
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
    showStatus(`Script "${name}" created`, 'success');
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
  }
}

function deleteCurrentScript() {
  if (!state.currentScriptId) return;
  
  if (confirm('Are you sure you want to delete this script?')) {
    state.scripts = state.scripts.filter(s => s.id !== state.currentScriptId);
    state.currentScriptId = null;
    saveState();
    renderScriptsList();
    elements.scriptActions.classList.add('hidden');
    showStatus('Script deleted', 'success');
  }
}

function startElementSelection() {
  // Send message to content script to start element selection
  browser.tabs.query({ active: true, currentWindow: true })
    .then(tabs => {
      browser.tabs.sendMessage(tabs[0].id, { action: 'startElementSelection' })
        .then(() => {
          window.close(); // Close popup to allow interaction with the page
        })
        .catch(error => {
          showStatus(`Error: ${error.message}`, 'error');
        });
    });
}

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
          showStatus(`Script "${script.name}" executed`, 'success');
        })
        .catch(error => {
          showStatus(`Error executing script: ${error.message}`, 'error');
        });
    });
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
    
    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'text-btn delete-variable-btn';
    deleteBtn.dataset.id = variable.id;
    deleteBtn.textContent = 'Delete';
    
    // Append buttons to actions
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
    
    // Append all elements to variable item
    variableElement.appendChild(nameDiv);
    variableElement.appendChild(valueDiv);
    variableElement.appendChild(actionsDiv);
    
    elements.variablesList.appendChild(variableElement);
    
    // Add event listeners for edit and delete buttons
    variableElement.querySelector('.edit-variable-btn').addEventListener('click', () => editVariable(variable.id));
    variableElement.querySelector('.delete-variable-btn').addEventListener('click', () => deleteVariable(variable.id));
  });
}

function createNewVariable() {
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
    showStatus('Please enter a variable name', 'error');
    return;
  }
  
  if (state.currentVariableId) {
    // Update existing variable
    const variableIndex = state.variables.findIndex(v => v.id === state.currentVariableId);
    if (variableIndex !== -1) {
      state.variables[variableIndex].name = name;
      state.variables[variableIndex].value = value;
      showStatus(`Variable "${name}" updated`, 'success');
    }
  } else {
    // Create new variable
    const newVariable = {
      id: Date.now().toString(),
      name,
      value
    };
    state.variables.push(newVariable);
    showStatus(`Variable "${name}" created`, 'success');
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
  if (confirm('Are you sure you want to delete this variable?')) {
    state.variables = state.variables.filter(v => v.id !== variableId);
    saveState();
    renderVariablesList();
    showStatus('Variable deleted', 'success');
  }
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
      renderScriptResult(item.data);
    } else if (item.type === 'suite') {
      renderSuiteResult(item.data);
    }
  });
}

function renderScriptResult(result) {
  const resultElement = document.createElement('div');
  resultElement.className = 'result-item script-result';

  const timestamp = new Date(result.timestamp).toLocaleString();
  const statusClass = result.success ? 'result-success' : 'result-error';
  const statusText = result.success ? 'Success' : 'Error';

  // Create header element
  const headerDiv = document.createElement('div');
  headerDiv.className = 'result-header';

  // Create type indicator
  const typeDiv = document.createElement('div');
  typeDiv.className = 'result-type';
  typeDiv.textContent = 'Script';

  // Create timestamp element
  const timestampDiv = document.createElement('div');
  timestampDiv.className = 'result-timestamp';
  timestampDiv.textContent = `${timestamp} - ${result.scriptName}`;

  // Create status element
  const statusDiv = document.createElement('div');
  statusDiv.className = statusClass;
  statusDiv.textContent = statusText;

  // Create content element
  const contentPre = document.createElement('pre');
  contentPre.className = 'result-content';
  contentPre.textContent = result.output;

  // Append elements
  headerDiv.appendChild(typeDiv);
  headerDiv.appendChild(timestampDiv);
  headerDiv.appendChild(statusDiv);
  resultElement.appendChild(headerDiv);
  resultElement.appendChild(contentPre);

  elements.resultsContainer.appendChild(resultElement);
}

function renderSuiteResult(result) {
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

  const summary = result.summary;
  const duration = result.duration ? `${Math.round(result.duration / 1000)}s` : 'N/A';

  // Create header element
  const headerDiv = document.createElement('div');
  headerDiv.className = 'result-header';

  // Create type indicator
  const typeDiv = document.createElement('div');
  typeDiv.className = 'result-type';
  typeDiv.textContent = 'Test Suite';

  // Create timestamp element
  const timestampDiv = document.createElement('div');
  timestampDiv.className = 'result-timestamp';
  timestampDiv.textContent = `${timestamp} - ${suiteName}`;

  // Create status element
  const statusDiv = document.createElement('div');
  statusDiv.className = statusClass;
  statusDiv.textContent = statusText;

  // Create summary element
  const summaryDiv = document.createElement('div');
  summaryDiv.className = 'suite-summary';
  summaryDiv.innerHTML = `
    <div class="summary-stats">
      <span class="stat passed">${summary.passed} passed</span>
      <span class="stat failed">${summary.failed} failed</span>
      <span class="stat errors">${summary.errors} errors</span>
      <span class="stat skipped">${summary.skipped} skipped</span>
      <span class="stat duration">Duration: ${duration}</span>
    </div>
  `;

  // Create details section (initially hidden)
  const detailsDiv = document.createElement('div');
  detailsDiv.className = 'test-case-results';
  detailsDiv.style.display = 'none';

  result.testCaseResults.forEach(tcr => {
    const tc = suite ? suite.testCases.find(t => t.id === tcr.testCaseId) : null;
    const tcName = tc ? tc.name : 'Unknown Test Case';
    const tcStatusClass = tcr.status === 'passed' ? 'passed' : 'failed';
    const tcDuration = tcr.duration ? `${tcr.duration}ms` : 'N/A';

    const tcDiv = document.createElement('div');
    tcDiv.className = `test-case-result ${tcStatusClass}`;
    tcDiv.innerHTML = `
      <span class="tc-name">${escapeHtml(tcName)}</span>
      <span class="tc-status">${tcr.status}</span>
      <span class="tc-duration">${tcDuration}</span>
    `;
    detailsDiv.appendChild(tcDiv);
  });

  // Create toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'toggle-details-btn secondary-btn';
  toggleBtn.textContent = 'Show Details';
  toggleBtn.addEventListener('click', () => {
    if (detailsDiv.style.display === 'none') {
      detailsDiv.style.display = 'block';
      toggleBtn.textContent = 'Hide Details';
    } else {
      detailsDiv.style.display = 'none';
      toggleBtn.textContent = 'Show Details';
    }
  });

  // Append elements
  headerDiv.appendChild(typeDiv);
  headerDiv.appendChild(timestampDiv);
  headerDiv.appendChild(statusDiv);
  resultElement.appendChild(headerDiv);
  resultElement.appendChild(summaryDiv);
  resultElement.appendChild(detailsDiv);
  resultElement.appendChild(toggleBtn);

  elements.resultsContainer.appendChild(resultElement);
}

function clearResults() {
  if (confirm('Are you sure you want to clear all results?')) {
    state.results = [];
    saveState();
    renderResultsList();
    showStatus('Results cleared', 'success');
  }
}

// Element Selection Functions
function cancelElementSelection() {
  elements.elementSelectorOverlay.classList.add('hidden');
}

// Handle messages from content script
browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'elementSelected') {
    const xpath = message.xpath;
    
    // Insert the XPath into the script editor at cursor position
    const cursorPos = elements.scriptCodeInput.selectionStart;
    const textBefore = elements.scriptCodeInput.value.substring(0, cursorPos);
    const textAfter = elements.scriptCodeInput.value.substring(cursorPos);
    
    const xpathCode = `document.evaluate("${xpath}", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue`;
    elements.scriptCodeInput.value = textBefore + xpathCode + textAfter;
    
    // Focus back on the editor
    elements.scriptCodeInput.focus();
    elements.scriptCodeInput.selectionStart = cursorPos + xpathCode.length;
    elements.scriptCodeInput.selectionEnd = cursorPos + xpathCode.length;
    
    showStatus('Element XPath added to script', 'success');
  }
});

// Utility Functions
function showStatus(message, type = 'info') {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status status-${type}`;
  
  // Clear status after 3 seconds
  setTimeout(() => {
    elements.statusMessage.textContent = '';
    elements.statusMessage.className = 'status';
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Test Suites Tab Functions
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
      `${latestResult.summary.passed}/${latestResult.summary.total} passed` :
      'Never run';

    const lastRun = suite.lastExecuted ?
      new Date(suite.lastExecuted).toLocaleDateString() :
      'Never';

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
      <div class="test-suite-item-status">Last run: ${lastRun} (${statusText})</div>
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

  // Clear test cases
  renderTestCasesList();

  elements.testSuiteEditor.classList.remove('hidden');
  elements.testSuiteActions.classList.add('hidden');
  elements.testSuiteNameInput.focus();
}

function saveTestSuite() {
  const name = elements.testSuiteNameInput.value.trim();
  const description = elements.testSuiteDescriptionInput.value.trim();
  const tags = elements.testSuiteTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);

  if (!name) {
    showStatus('Please enter a test suite name', 'error');
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
      showStatus(`Test suite "${name}" updated`, 'success');
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
    showStatus(`Test suite "${name}" created`, 'success');
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
    showStatus('Test suite deleted', 'success');
  }
}

function runCurrentTestSuite() {
  if (!state.currentTestSuiteId) return;
  runTestSuite(state.currentTestSuiteId);
}

async function runTestSuite(suiteId) {
  const suite = state.testSuites.find(s => s.id === suiteId);
  if (!suite) return;

  if (suite.testCases.filter(tc => tc.enabled).length === 0) {
    showStatus('No enabled test cases to execute', 'error');
    return;
  }

  try {
    // Create test suite executor
    const executor = new TestSuiteExecutor();

    // Set up execution callbacks for UI updates
    executor.setCallbacks({
      onStart: (executionResult) => {
        showStatus(`Starting test suite "${suite.name}"...`, 'info');
        // Switch to results tab to show progress
        switchTab('results');
        // Add execution progress to results
        addExecutionProgress(executionResult);
      },
      onProgress: (executionResult, current, total) => {
        showStatus(`Running test ${current}/${total}...`, 'info');
        updateExecutionProgress(executionResult, current, total);
      },
      onTestCaseStart: (testCase) => {
        console.log(`Starting test case: ${testCase.name}`);
      },
      onTestCaseComplete: (testCase, result) => {
        console.log(`Completed test case: ${testCase.name} - ${result.status}`);
        updateTestCaseProgress(testCase, result);
      },
      onComplete: (executionResult) => {
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
        showStatus(statusMsg, summary.failed > 0 || summary.errors > 0 ? 'error' : 'success');

        // Remove execution progress
        removeExecutionProgress();
      },
      onError: (error, executionResult) => {
        showStatus(`Test suite execution failed: ${error.message}`, 'error');
        console.error('Test suite execution error:', error);
        removeExecutionProgress();
      }
    });

    // Execute the test suite
    await executor.executeTestSuite(suite, state.scripts, state.variables);

  } catch (error) {
    showStatus(`Failed to start test suite: ${error.message}`, 'error');
    console.error('Test suite execution error:', error);
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
  showStatus(`Test suite duplicated as "${duplicatedSuite.name}"`, 'success');
}

// Test Case Management Functions
function addTestCase() {
  if (!state.currentTestSuiteId) {
    showStatus('Please select a test suite first', 'error');
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
  elements.testCaseDescription.value = '';
  elements.testCaseDependencies.value = '';

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
    showStatus('Please enter a test case name', 'error');
    return;
  }

  if (!scriptId) {
    showStatus('Please select a script', 'error');
    return;
  }

  const suite = state.testSuites.find(s => s.id === state.currentTestSuiteId);
  if (!suite) {
    showStatus('Test suite not found', 'error');
    return;
  }

  const testCaseData = {
    name,
    scriptId,
    description: elements.testCaseDescription.value.trim(),
    enabled: elements.testCaseEnabled.checked,
    timeout: elements.testCaseTimeout.value ? parseInt(elements.testCaseTimeout.value) * 1000 : null,
    retryCount: elements.testCaseRetry.value ? parseInt(elements.testCaseRetry.value) : null,
    dependencies: elements.testCaseDependencies.value
      .split(',')
      .map(dep => dep.trim())
      .filter(dep => dep)
  };

  if (state.editingTestCase) {
    // Update existing test case
    const testCaseIndex = suite.testCases.findIndex(tc => tc.id === state.editingTestCase.id);
    if (testCaseIndex !== -1) {
      suite.testCases[testCaseIndex] = { ...suite.testCases[testCaseIndex], ...testCaseData };
      showStatus(`Test case "${name}" updated`, 'success');
    }
  } else {
    // Create new test case
    const newTestCase = {
      id: Date.now().toString(),
      ...testCaseData,
      order: suite.testCases.length
    };
    suite.testCases.push(newTestCase);
    showStatus(`Test case "${name}" added`, 'success');
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
  elements.testCaseDescription.value = testCase.description || '';
  elements.testCaseDependencies.value = testCase.dependencies ? testCase.dependencies.join(', ') : '';

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
    showStatus('Test case deleted', 'success');
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
  showStatus(`Test case "${testCase.name}" ${status}`, 'success');
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
  showStatus(`Test case "${testCase.name}" moved ${direction}`, 'success');
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
        ${testCase.dependencies && testCase.dependencies.length > 0 ? `<span>Deps: ${testCase.dependencies.join(', ')}</span>` : ''}
      </div>
      ${testCase.description ? `<div class="test-case-description">${escapeHtml(testCase.description)}</div>` : ''}
    `;

    elements.testCasesList.appendChild(testCaseElement);
  });
}

// Make test case functions globally available
window.editTestCase = editTestCase;
window.deleteTestCase = deleteTestCase;
window.toggleTestCase = toggleTestCase;
window.moveTestCase = moveTestCase;



// Test Suite Execution UI Helper Functions
function addExecutionProgress(executionResult) {
  const progressElement = document.createElement('div');
  progressElement.id = 'execution-progress';
  progressElement.className = 'execution-progress';
  progressElement.innerHTML = `
    <div class="execution-header">
      <h3>Running Test Suite</h3>
      <button id="stop-execution-btn" class="secondary-btn">Stop</button>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: 0%"></div>
    </div>
    <div class="execution-status">Starting...</div>
    <div class="test-case-progress" id="test-case-progress"></div>
  `;

  // Insert at the top of results container
  elements.resultsContainer.insertBefore(progressElement, elements.resultsContainer.firstChild);

  // Add stop button handler
  document.getElementById('stop-execution-btn').addEventListener('click', () => {
    // TODO: Implement execution stopping
    showStatus('Execution stopping not yet implemented', 'info');
  });
}

function updateExecutionProgress(executionResult, current, total) {
  const progressElement = document.getElementById('execution-progress');
  if (!progressElement) return;

  const percentage = (current / total) * 100;
  const progressFill = progressElement.querySelector('.progress-fill');
  const statusElement = progressElement.querySelector('.execution-status');

  if (progressFill) {
    progressFill.style.width = `${percentage}%`;
  }

  if (statusElement) {
    statusElement.textContent = `Running test ${current}/${total}`;
  }
}

function updateTestCaseProgress(testCase, result) {
  const progressContainer = document.getElementById('test-case-progress');
  if (!progressContainer) return;

  const testCaseElement = document.createElement('div');
  testCaseElement.className = `test-case-result ${result.status}`;

  let statusIcon = '⏳';
  if (result.status === 'passed') statusIcon = '✓';
  else if (result.status === 'failed') statusIcon = '✗';
  else if (result.status === 'error') statusIcon = '⚠';
  else if (result.status === 'skipped') statusIcon = '⏭';

  testCaseElement.innerHTML = `
    <span class="status-icon">${statusIcon}</span>
    <span class="test-name">${escapeHtml(testCase.name)}</span>
    <span class="duration">${result.duration}ms</span>
  `;

  progressContainer.appendChild(testCaseElement);
}

function removeExecutionProgress() {
  const progressElement = document.getElementById('execution-progress');
  if (progressElement) {
    progressElement.remove();
  }
}