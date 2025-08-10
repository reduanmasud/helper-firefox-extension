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
  openConsoleBtn: document.getElementById('open-console-btn'),
  scriptNameInput: document.getElementById('script-name'),
  scriptCodeInput: document.getElementById('script-code'),
  scriptResultDisplay: document.getElementById('script-result-display'),
  scriptResultContent: document.getElementById('script-result-content'),
  clearResultDisplayBtn: document.getElementById('clear-result-display-btn'),
  
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

  // Analyzer Tab
  inspectElementBtn: document.getElementById('inspect-element-btn'),
  clearContentBtn: document.getElementById('clear-content-btn'),
  extractedContent: document.getElementById('extracted-content'),
  analysisPrompt: document.getElementById('analysis-prompt'),
  analyzeBtn: document.getElementById('analyze-btn'),
  copyResultsBtn: document.getElementById('copy-results-btn'),
  analysisResults: document.getElementById('analysis-results'),

  // Settings Tab
  openrouterApiKey: document.getElementById('openrouter-api-key'),
  openrouterModel: document.getElementById('openrouter-model'),
  openaiApiKey: document.getElementById('openai-api-key'),
  openaiModel: document.getElementById('openai-model'),
  saveOpenrouterKeyBtn: document.getElementById('save-openrouter-key-btn'),
  clearOpenrouterKeyBtn: document.getElementById('clear-openrouter-key-btn'),
  saveOpenaiKeyBtn: document.getElementById('save-openai-key-btn'),
  clearOpenaiKeyBtn: document.getElementById('clear-openai-key-btn'),

  // Enhanced Inspector Tab
  startSelectionBtn: document.getElementById('start-selection-btn'),
  cancelSelectionBtn: document.getElementById('cancel-selection-btn'),
  elementInfoPanel: document.getElementById('element-info'),

  // Locator Type Controls
  xpathModeRadio: document.getElementById('xpath-mode'),
  playwrightModeRadio: document.getElementById('playwright-mode'),

  // XPath Section
  xpathSection: document.getElementById('xpath-section'),
  xpathValueInput: document.getElementById('xpath-value'),
  copyXPathBtn: document.getElementById('copy-xpath-btn'),

  // Playwright Section
  playwrightSection: document.getElementById('playwright-section'),
  playwrightLocators: document.getElementById('playwright-locators'),

  // Actions
  insertLocatorBtn: document.getElementById('insert-locator-btn'),
  testLocatorBtn: document.getElementById('test-locator-btn'),
  generateSnippetBtn: document.getElementById('generate-snippet-btn'),

  // Code Snippet
  snippetSection: document.getElementById('snippet-section'),
  codeSnippet: document.getElementById('code-snippet'),
  copySnippetBtn: document.getElementById('copy-snippet-btn'),

  // Element Selector
  elementSelectorOverlay: document.getElementById('element-selector-overlay'),
  
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
  elements.openConsoleBtn.addEventListener('click', openBrowserConsole);
  elements.clearResultDisplayBtn.addEventListener('click', clearResultDisplay);
  
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

  // Analyzer Tab
  elements.inspectElementBtn.addEventListener('click', startContentInspection);
  elements.clearContentBtn.addEventListener('click', clearExtractedContent);
  elements.analyzeBtn.addEventListener('click', analyzeContent);
  elements.copyResultsBtn.addEventListener('click', copyAnalysisResults);

  // Settings Tab
  elements.saveOpenrouterKeyBtn.addEventListener('click', () => saveApiKey('openrouter'));
  elements.clearOpenrouterKeyBtn.addEventListener('click', () => clearApiKey('openrouter'));
  elements.saveOpenaiKeyBtn.addEventListener('click', () => saveApiKey('openai'));
  elements.clearOpenaiKeyBtn.addEventListener('click', () => clearApiKey('openai'));

  // Enhanced Inspector Tab
  elements.startSelectionBtn.addEventListener('click', startElementSelection);
  elements.cancelSelectionBtn.addEventListener('click', cancelElementSelection);

  // Locator Type Controls
  elements.xpathModeRadio.addEventListener('change', switchToXPathMode);
  elements.playwrightModeRadio.addEventListener('change', switchToPlaywrightMode);

  // XPath Actions
  elements.copyXPathBtn.addEventListener('click', copyXPathToClipboard);

  // Enhanced Actions
  elements.insertLocatorBtn.addEventListener('click', insertLocatorIntoScript);
  elements.testLocatorBtn.addEventListener('click', testCurrentLocator);
  elements.generateSnippetBtn.addEventListener('click', generateCodeSnippet);
  elements.copySnippetBtn.addEventListener('click', copyCodeSnippet);
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

  // Show initial status
  showStatus(`🚀 Running "${script.name}"...`, 'info');

  // Process script code to replace variable placeholders
  let processedCode = script.code;
  state.variables.forEach(variable => {
    const placeholder = new RegExp(`\\$\\{${variable.name}\\}`, 'g');
    processedCode = processedCode.replace(placeholder, variable.value);
  });

  // Send script to background script for execution (which will handle console opening)
  browser.runtime.sendMessage({
    action: 'runScript',
    code: processedCode,
    scriptName: script.name
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

          // Show result in the dedicated display area
          showScriptResult(script.name, result);

          // Show enhanced status message with output preview
          const outputPreview = result.output.length > 100 ?
            result.output.substring(0, 100) + '...' :
            result.output;
          const statusMsg = result.success ?
            `✅ Script "${script.name}" executed! Click "Console" tab in Developer Tools to see output.` :
            `❌ Script "${script.name}" failed: ${outputPreview}. Click "Console" tab in Developer Tools for details.`;
          showStatus(statusMsg, result.success ? 'success' : 'error');

          // Log full output to console for debugging
          console.log(`Script "${script.name}" execution result:`, result);
        })
        .catch(error => {
          showStatus(`Error executing script: ${error.message}`, 'error');
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
/**
 * Show script execution result in the dedicated display area
 */
function showScriptResult(scriptName, result) {
  if (!elements.scriptResultDisplay || !elements.scriptResultContent) return;

  const timestamp = new Date().toLocaleString();
  const statusClass = result.success ? 'result-success' : 'result-error';
  const statusIcon = result.success ? '✅' : '❌';

  elements.scriptResultContent.innerHTML = `
    <div class="result-header">
      <span class="result-status ${statusClass}">${statusIcon} ${result.success ? 'Success' : 'Failed'}</span>
      <span class="result-timestamp">${timestamp}</span>
    </div>
    <div class="result-script-name">Script: ${escapeHtml(scriptName)}</div>
    <div class="result-output">
      <strong>Output:</strong>
      <pre>${escapeHtml(result.output || 'No output')}</pre>
    </div>
  `;

  elements.scriptResultDisplay.classList.remove('hidden');
}

/**
 * Clear the script result display
 */
function clearResultDisplay() {
  if (elements.scriptResultDisplay && elements.scriptResultContent) {
    elements.scriptResultContent.innerHTML = '';
    elements.scriptResultDisplay.classList.add('hidden');
  }
}

/**
 * Open browser console manually
 */
function openBrowserConsole() {
  // Show initial status
  showStatus('🔧 Preparing console...', 'info');

  // Send message to background script to prepare console
  browser.runtime.sendMessage({
    action: 'openConsole'
  }).then(() => {
    showStatus('✅ Console prepared! Press F12, then click "Console" tab in Developer Tools.', 'success');
  }).catch(error => {
    console.error('Error opening console:', error);
    showStatus('❌ Could not prepare console. Press F12 manually to open Developer Tools.', 'error');
  });
}

function showStatus(message, type = 'info') {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status status-${type}`;

  // Clear status after longer time for longer messages
  const clearTime = message.length > 100 ? 5000 : 3000;
  setTimeout(() => {
    elements.statusMessage.textContent = '';
    elements.statusMessage.className = 'status';
  }, clearTime);
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

// AI Content Analyzer Functions
function startContentInspection() {
  state.isSelectingElement = true;
  elements.inspectElementBtn.textContent = 'Click on any element...';
  elements.inspectElementBtn.disabled = true;

  // Send message to content script to start element inspection
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'startContentInspection'
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error starting content inspection:', chrome.runtime.lastError);
        resetInspectionButton();
        showStatus('Error: Could not start element inspection', 'error');
      }
    });
  });
}

function resetInspectionButton() {
  state.isSelectingElement = false;
  elements.inspectElementBtn.textContent = 'Inspect Element';
  elements.inspectElementBtn.disabled = false;
}

function clearExtractedContent() {
  elements.extractedContent.value = '';
  elements.analysisResults.innerHTML = '<div class="empty-state">No analysis results yet. Extract content and click \'Analyze\' to get AI insights.</div>';
}

async function analyzeContent() {
  const content = elements.extractedContent.value.trim();
  const prompt = elements.analysisPrompt.value.trim();

  if (!content) {
    showStatus('Please extract some content first', 'error');
    return;
  }

  if (!prompt) {
    showStatus('Please enter analysis instructions', 'error');
    return;
  }

  // Check if API keys are available
  const apiKeys = await getApiKeys();
  console.log('API keys check:', apiKeys);

  if (!apiKeys.openrouter && !apiKeys.openai) {
    console.log('No API keys found - showing error');
    showStatus('Please configure at least one API key in Settings', 'error');
    return;
  }

  console.log('API keys found, proceeding with analysis');

  // Show loading state
  elements.analyzeBtn.disabled = true;
  elements.analyzeBtn.textContent = 'Analyzing...';
  elements.analysisResults.innerHTML = '<div class="loading">Analyzing content with AI...</div>';
  elements.analysisResults.classList.add('loading');

  try {
    const result = await performAIAnalysis(content, prompt, apiKeys);

    // Display results
    elements.analysisResults.classList.remove('loading');
    elements.analysisResults.textContent = result;
    showStatus('Analysis completed successfully', 'success');

  } catch (error) {
    console.error('Analysis error:', error);
    elements.analysisResults.classList.remove('loading');
    elements.analysisResults.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    showStatus('Analysis failed: ' + error.message, 'error');
  } finally {
    elements.analyzeBtn.disabled = false;
    elements.analyzeBtn.textContent = 'Analyze';
  }
}

async function performAIAnalysis(content, prompt, apiKeys) {
  const fullPrompt = `${prompt}\n\nContent to analyze:\n${content}`;

  // Try OpenRouter first, then OpenAI
  if (apiKeys.openrouter) {
    try {
      return await callOpenRouter(fullPrompt, apiKeys.openrouter, apiKeys.openrouterModel);
    } catch (error) {
      console.warn('OpenRouter failed, trying OpenAI:', error);
      if (apiKeys.openai) {
        return await callOpenAI(fullPrompt, apiKeys.openai, apiKeys.openaiModel);
      }
      throw error;
    }
  } else if (apiKeys.openai) {
    return await callOpenAI(fullPrompt, apiKeys.openai, apiKeys.openaiModel);
  } else {
    throw new Error('No API keys configured');
  }
}

async function callOpenRouter(prompt, apiKey, model = 'anthropic/claude-3-haiku') {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': chrome.runtime.getURL(''),
      'X-Title': 'Console Script Manager'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No response received';
}

async function callOpenAI(prompt, apiKey, model = 'gpt-3.5-turbo') {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No response received';
}

function copyAnalysisResults() {
  const results = elements.analysisResults.textContent;
  if (!results || results.includes('No analysis results yet')) {
    showStatus('No results to copy', 'error');
    return;
  }

  navigator.clipboard.writeText(results).then(() => {
    showStatus('Results copied to clipboard', 'success');
  }).catch(() => {
    showStatus('Failed to copy results', 'error');
  });
}

// Settings Functions
function saveApiKey(provider) {
  const keyInput = provider === 'openrouter' ? elements.openrouterApiKey : elements.openaiApiKey;
  const modelInput = provider === 'openrouter' ? elements.openrouterModel : elements.openaiModel;

  const apiKey = keyInput.value.trim();
  const selectedModel = provider === 'openrouter' ? modelInput.value.trim() : modelInput.value;

  if (!apiKey) {
    showStatus('Please enter an API key', 'error');
    return;
  }

  // Basic validation
  if (apiKey.length < 10) {
    showStatus('API key appears to be too short', 'error');
    return;
  }

  // Validate model for OpenRouter
  if (provider === 'openrouter' && !selectedModel) {
    showStatus('Please enter an OpenRouter model name', 'error');
    return;
  }

  try {
    // Check if chrome.storage is available
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      console.error('Chrome storage API not available');
      showStatus('Storage API not available', 'error');
      return;
    }

    // Save both API key and selected model
    const saveData = {
      [`${provider}_api_key`]: apiKey,
      [`${provider}_model`]: selectedModel
    };

    console.log('Saving API settings:', {
      provider,
      keyLength: apiKey.length,
      model: selectedModel,
      saveData
    });

    chrome.storage.local.set(saveData, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving API settings:', chrome.runtime.lastError);
        showStatus('Failed to save API settings', 'error');
        return;
      }

      // Verify the save worked
      chrome.storage.local.get([`${provider}_api_key`, `${provider}_model`], (verification) => {
        console.log('Verification after save:', verification);

        if (!verification) {
          console.warn('Verification returned undefined');
          showStatus('Warning: Could not verify save', 'error');
        } else {
          keyInput.value = '';
          showStatus(`${provider === 'openrouter' ? 'OpenRouter' : 'OpenAI'} settings saved securely`, 'success');

          // Update placeholder to show key is configured
          keyInput.placeholder = 'API key configured (hidden for security)';
        }
      });
    });

  } catch (error) {
    console.error('Error saving API settings:', error);
    showStatus('Failed to save API settings', 'error');
  }
}

async function clearApiKey(provider) {
  try {
    await chrome.storage.local.remove([`${provider}_api_key`, `${provider}_model`]);

    // Reset placeholder
    const keyInput = provider === 'openrouter' ? elements.openrouterApiKey : elements.openaiApiKey;
    const modelInput = provider === 'openrouter' ? elements.openrouterModel : elements.openaiModel;

    keyInput.placeholder = `Enter your ${provider === 'openrouter' ? 'OpenRouter' : 'OpenAI'} API key`;
    if (provider === 'openrouter') {
      modelInput.value = ''; // Clear the text input
      modelInput.placeholder = 'e.g., anthropic/claude-3-haiku, openai/gpt-4, etc.';
    } else {
      modelInput.selectedIndex = 0; // Reset to first option for OpenAI dropdown
    }

    showStatus(`${provider === 'openrouter' ? 'OpenRouter' : 'OpenAI'} settings cleared`, 'success');
  } catch (error) {
    console.error('Error clearing API settings:', error);
    showStatus('Failed to clear API settings', 'error');
  }
}

function getApiKeys() {
  return new Promise((resolve) => {
    try {
      // Check if chrome.storage is available
      if (!chrome || !chrome.storage || !chrome.storage.local) {
        console.error('Chrome storage API not available');
        resolve({});
        return;
      }

      chrome.storage.local.get([
        'openrouter_api_key', 'openrouter_model',
        'openai_api_key', 'openai_model'
      ], (result) => {
        // Handle case where result is undefined
        if (!result) {
          console.warn('Storage result is undefined, returning empty object');
          resolve({});
          return;
        }

        console.log('Retrieved API keys from storage:', {
          openrouter: result.openrouter_api_key ? 'configured' : 'not configured',
          openai: result.openai_api_key ? 'configured' : 'not configured',
          rawResult: result
        });

        resolve({
          openrouter: result.openrouter_api_key,
          openrouterModel: result.openrouter_model || 'anthropic/claude-3-haiku',
          openai: result.openai_api_key,
          openaiModel: result.openai_model || 'gpt-3.5-turbo'
        });
      });
    } catch (error) {
      console.error('Error getting API keys:', error);
      resolve({});
    }
  });
}

// Load API key status on settings tab
async function loadApiKeyStatus() {
  const apiKeys = await getApiKeys();

  if (apiKeys.openrouter) {
    elements.openrouterApiKey.placeholder = 'API key configured (hidden for security)';
    elements.openrouterModel.value = apiKeys.openrouterModel || 'anthropic/claude-3-haiku';
  }

  if (apiKeys.openai) {
    elements.openaiApiKey.placeholder = 'API key configured (hidden for security)';
    elements.openaiModel.value = apiKeys.openaiModel;
  }
}

// Message listener for content inspection responses and element selection
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'contentExtracted') {
    elements.extractedContent.value = message.content;
    resetInspectionButton();
    showStatus('Content extracted successfully', 'success');
  } else if (message.action === 'contentInspectionCancelled') {
    resetInspectionButton();
    showStatus('Content inspection cancelled', 'info');
  } else if (message.action === 'elementSelectedUpdate') {
    // Handle element selection from background script
    handleElementSelected(message.xpath, message.elementInfo, message.elementData);
  } else if (message.action === 'elementSelectionCancelled') {
    elements.startSelectionBtn.classList.remove('hidden');
    elements.cancelSelectionBtn.classList.add('hidden');
    showStatus('Element selection cancelled', 'info');
  }
});

// Enhanced Inspector Functions (Popup)
let currentSelectedElement = null;
let currentLocatorMode = 'xpath';
let generatedLocators = [];
let selectedLocatorIndex = 0;

// Import the same functions from sidebar (they're identical)
// Mode switching functions
function switchToXPathMode() {
  currentLocatorMode = 'xpath';
  elements.xpathSection.classList.remove('hidden');
  elements.playwrightSection.classList.add('hidden');
  elements.snippetSection.classList.add('hidden');
  updateActionButtons();
}

function switchToPlaywrightMode() {
  currentLocatorMode = 'playwright';
  elements.xpathSection.classList.add('hidden');
  elements.playwrightSection.classList.remove('hidden');
  updateActionButtons();

  // Generate Playwright locators if element is selected
  if (currentSelectedElement) {
    generatePlaywrightLocators(currentSelectedElement);
  }
}

// Element selection functions
function startElementSelection() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) {
      showStatus('Error: No active tab found', 'error');
      return;
    }

    chrome.tabs.sendMessage(tabs[0].id, { action: 'startElementSelection' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error starting element selection:', chrome.runtime.lastError);

        // Try to inject content script if it's not responding
        chrome.tabs.executeScript(tabs[0].id, {
          file: 'content/content.js'
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('Error injecting content script:', chrome.runtime.lastError);
            showStatus('Error: Please refresh the page and try again', 'error');
            return;
          }

          // Try again after injection
          setTimeout(() => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'startElementSelection' }, (response) => {
              if (chrome.runtime.lastError) {
                console.error('Error after injection:', chrome.runtime.lastError);
                showStatus('Error: Content script injection failed. Please refresh the page.', 'error');
                return;
              }

              elements.startSelectionBtn.classList.add('hidden');
              elements.cancelSelectionBtn.classList.remove('hidden');
              showStatus('Click on any element on the webpage to select it', 'info');
            });
          }, 100);
        });
        return;
      }

      elements.startSelectionBtn.classList.add('hidden');
      elements.cancelSelectionBtn.classList.remove('hidden');
      showStatus('Click on any element on the webpage to select it', 'info');
    });
  });
}

function cancelElementSelection() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'cancelElementSelection' });
  });

  elements.startSelectionBtn.classList.remove('hidden');
  elements.cancelSelectionBtn.classList.add('hidden');
  showStatus('Element selection cancelled', 'info');
}

function copyXPathToClipboard() {
  const xpath = elements.xpathValueInput.value;
  if (xpath) {
    navigator.clipboard.writeText(xpath).then(() => {
      showStatus('XPath copied to clipboard', 'success');
    }).catch(() => {
      showStatus('Failed to copy XPath', 'error');
    });
  }
}

// Use the same Playwright locator generation functions from sidebar
// (Copy the functions from sidebar/sidebar.js lines 1972-2269)

// Playwright Locator Generation Engine (identical to sidebar)
function generatePlaywrightLocators(element) {
  generatedLocators = [];

  // Safety check for null/undefined element
  if (!element) {
    console.error('generatePlaywrightLocators: element is null or undefined');
    displayPlaywrightLocators();
    return;
  }

  // Ensure getAttribute function exists
  if (typeof element.getAttribute !== 'function') {
    console.error('generatePlaywrightLocators: element does not have getAttribute method');
    displayPlaywrightLocators();
    return;
  }

  try {
    // Strategy 1: Test ID (highest priority)
    const testId = element.getAttribute('data-testid') || element.getAttribute('data-test-id') || element.getAttribute('data-cy');
    if (testId) {
      generatedLocators.push({
        type: 'getByTestId',
        value: `page.getByTestId('${testId}')`,
        confidence: 'high',
        description: 'Test ID selector (most reliable)'
      });
    }
  } catch (error) {
    console.error('Error generating test ID locator:', error);
  }

  try {
    // Strategy 2: Role-based selection
    const role = element.getAttribute('role') || getImplicitRole(element);
    if (role) {
      const name = getAccessibleName(element);
      if (name) {
        generatedLocators.push({
          type: 'getByRole',
          value: `page.getByRole('${role}', { name: '${name}' })`,
          confidence: 'high',
          description: 'Semantic role with accessible name'
        });
      } else {
        generatedLocators.push({
          type: 'getByRole',
          value: `page.getByRole('${role}')`,
          confidence: 'medium',
          description: 'Semantic role selector'
        });
      }
    }
  } catch (error) {
    console.error('Error generating role-based locator:', error);
  }

  try {
    // Strategy 3: Label-based selection (for form elements)
    const label = getAssociatedLabel(element);
    if (label) {
      generatedLocators.push({
        type: 'getByLabel',
        value: `page.getByLabel('${label}')`,
        confidence: 'high',
        description: 'Form label association'
      });
    }
  } catch (error) {
    console.error('Error generating label-based locator:', error);
  }

  try {
    // Strategy 4: Placeholder text
    const placeholder = element.getAttribute('placeholder');
    if (placeholder) {
      generatedLocators.push({
        type: 'getByPlaceholder',
        value: `page.getByPlaceholder('${placeholder}')`,
        confidence: 'medium',
        description: 'Placeholder text'
      });
    }
  } catch (error) {
    console.error('Error generating placeholder locator:', error);
  }

  try {
    // Strategy 5: Text content
    const textContent = getUniqueTextContent(element);
    if (textContent) {
      generatedLocators.push({
        type: 'getByText',
        value: `page.getByText('${textContent}')`,
        confidence: textContent.length > 20 ? 'medium' : 'high',
        description: 'Visible text content'
      });
    }
  } catch (error) {
    console.error('Error generating text content locator:', error);
  }

  try {
    // Strategy 6: CSS Selectors
    const cssSelectors = generateCSSSelectors(element);
    cssSelectors.forEach(selector => {
      generatedLocators.push({
        type: 'locator',
        value: `page.locator('${selector.value}')`,
        confidence: selector.confidence,
        description: selector.description
      });
    });
  } catch (error) {
    console.error('Error generating CSS selectors:', error);
  }

  // Display the generated locators
  displayPlaywrightLocators();
}

// Helper functions (identical to sidebar)
function getImplicitRole(element) {
  if (!element || !element.tagName) {
    return null;
  }

  const tagName = element.tagName.toLowerCase();
  const type = element.getAttribute ? element.getAttribute('type') : null;

  const roleMap = {
    'button': 'button',
    'a': element.getAttribute('href') ? 'link' : null,
    'input': type === 'button' || type === 'submit' ? 'button' :
             type === 'checkbox' ? 'checkbox' :
             type === 'radio' ? 'radio' : 'textbox',
    'textarea': 'textbox',
    'select': 'combobox',
    'h1': 'heading',
    'h2': 'heading',
    'h3': 'heading',
    'h4': 'heading',
    'h5': 'heading',
    'h6': 'heading',
    'img': 'img',
    'nav': 'navigation',
    'main': 'main',
    'header': 'banner',
    'footer': 'contentinfo',
    'section': 'region',
    'article': 'article',
    'aside': 'complementary',
    'form': 'form',
    'table': 'table',
    'ul': 'list',
    'ol': 'list',
    'li': 'listitem'
  };

  return roleMap[tagName] || null;
}

function getAccessibleName(element) {
  if (!element || !element.getAttribute) {
    return null;
  }

  try {
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy && typeof document !== 'undefined') {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) return labelElement.textContent.trim();
    }

    if (element.tagName && element.tagName.toLowerCase() === 'button') {
      return element.textContent ? element.textContent.trim() : null;
    }

    if (element.tagName && element.tagName.toLowerCase() === 'a') {
      return (element.textContent ? element.textContent.trim() : null) || element.getAttribute('title');
    }

    if (element.tagName && element.tagName.toLowerCase() === 'img') {
      return element.getAttribute('alt');
    }

    return null;
  } catch (error) {
    console.error('Error getting accessible name:', error);
    return null;
  }
}

function getAssociatedLabel(element) {
  const id = element.getAttribute('id');
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label.textContent.trim();
  }

  const parentLabel = element.closest('label');
  if (parentLabel) {
    return parentLabel.textContent.trim();
  }

  return null;
}

function getUniqueTextContent(element) {
  const text = element.textContent.trim();
  if (!text || text.length > 50) return null;

  const elementsWithSameText = document.querySelectorAll(`*:not(script):not(style)`);
  let count = 0;
  for (const el of elementsWithSameText) {
    if (el.textContent.trim() === text) {
      count++;
      if (count > 1) return null;
    }
  }

  return text;
}

function generateCSSSelectors(element) {
  const selectors = [];

  const id = element.getAttribute('id');
  if (id && /^[a-zA-Z][\w-]*$/.test(id)) {
    selectors.push({
      value: `#${id}`,
      confidence: 'high',
      description: 'ID selector'
    });
  }

  const classes = element.className.split(' ').filter(c => c && /^[a-zA-Z][\w-]*$/.test(c));
  if (classes.length > 0) {
    selectors.push({
      value: `.${classes.join('.')}`,
      confidence: 'medium',
      description: 'Class selector'
    });
  }

  const name = element.getAttribute('name');
  if (name) {
    selectors.push({
      value: `[name="${name}"]`,
      confidence: 'medium',
      description: 'Name attribute'
    });
  }

  const tagName = element.tagName.toLowerCase();
  const type = element.getAttribute('type');
  if (type) {
    selectors.push({
      value: `${tagName}[type="${type}"]`,
      confidence: 'low',
      description: 'Tag with type attribute'
    });
  }

  return selectors;
}

function displayPlaywrightLocators() {
  const container = elements.playwrightLocators;

  if (generatedLocators.length === 0) {
    container.innerHTML = '<div class="empty-state">No suitable locators found for this element</div>';
    return;
  }

  container.innerHTML = '';

  generatedLocators.forEach((locator, index) => {
    const locatorItem = document.createElement('div');
    locatorItem.className = 'locator-item';
    locatorItem.dataset.index = index;

    locatorItem.innerHTML = `
      <div class="locator-info">
        <div class="locator-type">${locator.type}</div>
        <div class="locator-value">${locator.value}</div>
        <div class="locator-confidence confidence-${locator.confidence}">
          ${locator.confidence.toUpperCase()} - ${locator.description}
        </div>
      </div>
      <div class="locator-actions">
        <button class="locator-copy-btn" onclick="copyLocator(${index})">Copy</button>
      </div>
    `;

    locatorItem.addEventListener('click', () => selectLocator(index));
    container.appendChild(locatorItem);
  });
}

function selectLocator(index) {
  selectedLocatorIndex = index;

  // Update visual selection
  const items = document.querySelectorAll('.locator-item');
  items.forEach((item, i) => {
    if (i === index) {
      item.style.backgroundColor = 'var(--primary-color)';
      item.style.color = 'white';
    } else {
      item.style.backgroundColor = '';
      item.style.color = '';
    }
  });

  updateActionButtons();
}

function copyLocator(index) {
  const locator = generatedLocators[index];
  if (locator) {
    navigator.clipboard.writeText(locator.value).then(() => {
      showStatus(`${locator.type} locator copied to clipboard`, 'success');
    }).catch(() => {
      showStatus('Failed to copy locator', 'error');
    });
  }
}

function updateActionButtons() {
  const hasSelection = currentSelectedElement !== null;
  const hasLocators = generatedLocators.length > 0;

  if (currentLocatorMode === 'xpath') {
    elements.insertLocatorBtn.disabled = !hasSelection;
    elements.testLocatorBtn.disabled = !hasSelection;
    elements.generateSnippetBtn.disabled = true;
  } else {
    elements.insertLocatorBtn.disabled = !hasLocators;
    elements.testLocatorBtn.disabled = !hasLocators;
    elements.generateSnippetBtn.disabled = !hasLocators;
  }
}

function insertLocatorIntoScript() {
  if (currentLocatorMode === 'xpath') {
    insertXPathIntoScript();
  } else {
    insertPlaywrightLocatorIntoScript();
  }
}

function insertXPathIntoScript() {
  const xpath = elements.xpathValueInput.value;
  if (xpath && elements.scriptCodeInput) {
    const currentCode = elements.scriptCodeInput.value;
    const cursorPos = elements.scriptCodeInput.selectionStart;
    const xpathCode = `document.evaluate('${xpath}', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue`;
    const newCode = currentCode.slice(0, cursorPos) + xpathCode + currentCode.slice(cursorPos);
    elements.scriptCodeInput.value = newCode;
    elements.scriptCodeInput.focus();
    elements.scriptCodeInput.setSelectionRange(cursorPos + xpathCode.length, cursorPos + xpathCode.length);
    showStatus('XPath inserted into script', 'success');
  }
}

function insertPlaywrightLocatorIntoScript() {
  if (generatedLocators.length === 0) {
    showStatus('No locators available to insert', 'error');
    return;
  }

  const locator = generatedLocators[selectedLocatorIndex];
  const locatorText = locator.value;

  if (elements.scriptCodeInput) {
    const currentCode = elements.scriptCodeInput.value;
    const cursorPos = elements.scriptCodeInput.selectionStart;
    const newCode = currentCode.slice(0, cursorPos) + locatorText + currentCode.slice(cursorPos);
    elements.scriptCodeInput.value = newCode;
    elements.scriptCodeInput.focus();
    elements.scriptCodeInput.setSelectionRange(cursorPos + locatorText.length, cursorPos + locatorText.length);
    showStatus('Playwright locator inserted into script', 'success');
  }
}

function testCurrentLocator() {
  if (currentLocatorMode === 'xpath') {
    testXPath();
  } else {
    testPlaywrightLocator();
  }
}

function testXPath() {
  const xpath = elements.xpathValueInput.value;
  if (!xpath) {
    showStatus('No XPath to test', 'error');
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'testXPath',
      xpath: xpath
    }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus('Error testing XPath', 'error');
        return;
      }

      if (response && response.success) {
        showStatus(`XPath found ${response.count} element(s)`, 'success');
      } else {
        showStatus('XPath test failed', 'error');
      }
    });
  });
}

function testPlaywrightLocator() {
  if (generatedLocators.length === 0) {
    showStatus('No locators available to test', 'error');
    return;
  }

  const locator = generatedLocators[selectedLocatorIndex];

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'testPlaywrightLocator',
      locator: locator
    }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus('Error testing locator', 'error');
        return;
      }

      if (response && response.success) {
        showStatus(`Locator found ${response.count} element(s)`, 'success');
      } else {
        showStatus('Locator test failed', 'error');
      }
    });
  });
}

function generateCodeSnippet() {
  if (generatedLocators.length === 0) {
    showStatus('No locators available for snippet generation', 'error');
    return;
  }

  const locator = generatedLocators[selectedLocatorIndex];
  const snippets = generatePlaywrightSnippets(locator);

  elements.codeSnippet.value = snippets.join('\n\n');
  elements.snippetSection.classList.remove('hidden');
  showStatus('Code snippets generated', 'success');
}

function generatePlaywrightSnippets(locator) {
  const baseLocator = locator.value;

  return [
    `// Click action\nawait ${baseLocator}.click();`,
    `// Fill text (for input elements)\nawait ${baseLocator}.fill('your text here');`,
    `// Get text content\nconst text = await ${baseLocator}.textContent();`,
    `// Check if visible\nconst isVisible = await ${baseLocator}.isVisible();`,
    `// Wait for element\nawait ${baseLocator}.waitFor();`,
    `// Hover over element\nawait ${baseLocator}.hover();`,
    `// Get attribute value\nconst value = await ${baseLocator}.getAttribute('attribute-name');`
  ];
}

function copyCodeSnippet() {
  const snippet = elements.codeSnippet.value;
  if (snippet) {
    navigator.clipboard.writeText(snippet).then(() => {
      showStatus('Code snippet copied to clipboard', 'success');
    }).catch(() => {
      showStatus('Failed to copy snippet', 'error');
    });
  }
}

// Handle element selection from background script
function handleElementSelected(xpath, elementInfo, elementData) {
  console.log('Popup handling element selection:', { xpath, elementInfo, elementData });

  // Reset UI
  elements.startSelectionBtn.classList.remove('hidden');
  elements.cancelSelectionBtn.classList.add('hidden');

  // Store the XPath - ensure it's not undefined
  const selectedXPath = xpath || 'XPath generation failed';
  console.log('Popup selected XPath:', selectedXPath);

  // Create a mock element object from the element data for Playwright locator generation
  // Check both elementData and elementInfo for element properties
  console.log('Popup processing element data:', { elementData, elementInfo });

  const elementSource = elementData || elementInfo || {};
  console.log('Popup element source selected:', elementSource);

  // More comprehensive validation - check if we have any meaningful element data
  const hasValidData = elementSource && (
    elementSource.tagName ||
    elementSource.id ||
    elementSource.className ||
    elementSource.classes ||
    (elementSource.attributes && Object.keys(elementSource.attributes).length > 0) ||
    elementSource.textContent
  );

  console.log('Popup element validation result:', hasValidData);
  console.log('Popup element source keys:', elementSource ? Object.keys(elementSource) : 'null');

  if (hasValidData) {
    currentSelectedElement = {
      tagName: elementSource.tagName || '',
      id: elementSource.id || '',
      className: elementSource.className || elementSource.classes || '',
      textContent: elementSource.textContent || '',
      attributes: elementSource.attributes || {},
      outerHTML: elementSource.outerHTML || '',
      getAttribute: function(name) {
        console.log(`Popup getAttribute called with: ${name}`);
        // Check both attributes object and direct properties
        const result = (this.attributes && this.attributes[name]) ||
               this[name] ||
               (name === 'data-testid' && (this.attributes['data-testid'] || this['data-testid'])) ||
               (name === 'data-test-id' && (this.attributes['data-test-id'] || this['data-test-id'])) ||
               (name === 'data-cy' && (this.attributes['data-cy'] || this['data-cy'])) ||
               null;
        console.log(`Popup getAttribute(${name}) returning:`, result);
        return result;
      },
      // Add methods needed for Playwright locator generation
      closest: function(selector) {
        // Mock implementation - in real scenario this would traverse DOM
        return null;
      }
    };
    console.log('Popup successfully created mock element from:', elementSource);
    console.log('Popup mock element result:', currentSelectedElement);
  } else {
    console.error('Popup: No valid element data found. ElementData:', elementData, 'ElementInfo:', elementInfo);

    // Create a minimal mock element as fallback if we have any data at all
    if (elementSource && typeof elementSource === 'object') {
      console.log('Popup creating minimal fallback element');
      currentSelectedElement = {
        tagName: elementSource.tagName || 'div',
        id: elementSource.id || '',
        className: elementSource.className || elementSource.classes || '',
        textContent: elementSource.textContent || '',
        attributes: elementSource.attributes || {},
        outerHTML: elementSource.outerHTML || '',
        getAttribute: function(name) {
          return (this.attributes && this.attributes[name]) || this[name] || null;
        },
        closest: function(selector) {
          return null;
        }
      };
      console.log('Popup fallback element created:', currentSelectedElement);
    } else {
      currentSelectedElement = null;
    }
  }

  // Update element info display
  if (elements.elementInfoPanel && elementInfo) {
    elements.elementInfoPanel.innerHTML = `
      <div class="element-details">
        <div><strong>Tag:</strong> ${elementInfo.tagName || 'Unknown'}</div>
        <div><strong>ID:</strong> ${elementInfo.id || 'None'}</div>
        <div><strong>Classes:</strong> ${elementInfo.className || elementInfo.classes || 'None'}</div>
        <div><strong>Text:</strong> ${elementInfo.textContent || 'None'}</div>
      </div>
    `;
    console.log('Popup element info updated:', elementInfo);
  }

  // Update XPath input
  console.log('Popup attempting to update XPath input. Element exists:', !!elements.xpathValueInput);
  if (elements.xpathValueInput) {
    elements.xpathValueInput.value = selectedXPath;
    console.log('Popup XPath input updated with:', selectedXPath);
    console.log('Popup XPath input current value:', elements.xpathValueInput.value);
  } else {
    console.error('Popup XPath input element not found. Trying to find it again...');
    // Try to find the element again
    const xpathInput = document.getElementById('xpath-value');
    if (xpathInput) {
      xpathInput.value = selectedXPath;
      console.log('Popup XPath input found and updated via fallback');
      // Update the elements reference
      elements.xpathValueInput = xpathInput;
    } else {
      console.error('Popup XPath input element still not found in DOM');
    }
  }

  // Generate Playwright locators if in Playwright mode
  // Use setTimeout to ensure element processing is complete
  setTimeout(() => {
    if (currentLocatorMode === 'playwright' && currentSelectedElement) {
      console.log('Popup generating Playwright locators for element:', currentSelectedElement);
      generatePlaywrightLocators(currentSelectedElement);
    } else {
      console.log('Popup not generating Playwright locators. Mode:', currentLocatorMode, 'Element:', currentSelectedElement);
      // Clear any existing locators if not in Playwright mode
      if (currentLocatorMode !== 'playwright') {
        generatedLocators = [];
        if (elements.playwrightLocators) {
          elements.playwrightLocators.innerHTML = '<div class="empty-state">Switch to Playwright mode to see locators</div>';
        }
      }
    }
  }, 10);

  // Update action buttons
  updateActionButtons();

  showStatus('Element selected successfully', 'success');
}

// Make functions globally available
window.copyLocator = copyLocator;
window.selectLocator = selectLocator;

// Initialize settings when tab is shown
document.addEventListener('DOMContentLoaded', () => {
  // Load API key status when settings tab is first shown
  const settingsTab = document.querySelector('[data-tab="settings"]');
  if (settingsTab) {
    settingsTab.addEventListener('click', loadApiKeyStatus);
  }
});



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