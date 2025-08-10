import { 
  initCodeEditor, 
  getCodeValue, 
  destroyEditor,
  insertTextAtCursor,
  getCursorPosition,
  setCursorPosition,
  focusEditor,
  initSnippetEditor,
  updateSnippetContent,
  getSnippetContent,
  destroySnippetEditor
} from '../editor/codemirror.bundle.js';

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
  openConsoleBtn: document.getElementById('open-console-btn'),
  scriptNameInput: document.getElementById('script-name'),
  scriptCodeInput: document.getElementById('script-code'),
  selectElementBtn: document.getElementById('select-element-btn'),
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

  // Analyzer Tab
  inspectElementBtn: document.getElementById('inspect-element-btn'),
  clearContentBtn: document.getElementById('clear-content-btn'),
  extractedContent: document.getElementById('extracted-content'),
  presetInstructions: document.getElementById('preset-instructions'),
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
  debugStorageBtn: document.getElementById('debug-storage-btn'),

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
  // codeSnippet: document.getElementById('code-snippet'),
  // copySnippetBtn: document.getElementById('copy-snippet-btn'),
  snippetEditor: document.getElementById('snippet-editor'),
  copySnippetBtn: document.getElementById('copy-snippet-btn'),

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

  // Initialize Inspector tab
  console.log('Initializing Inspector tab...');

  if (elements.snippetEditor) {
    initSnippetEditor('snippet-editor', '// Code snippets will appear here');
  }

  // With this safer version:
  if (elements.snippetEditor) {
    try {
      initSnippetEditor('snippet-editor', '// Code snippets will appear here');
      console.log('Snippet editor initialized successfully');
    } catch (error) {
      console.error('Failed to initialize snippet editor:', error);
      // Fallback: hide the snippet section if CodeMirror fails
      elements.snippetSection.style.display = 'none';
    }
  }
  

  // Check if Inspector elements exist
  const inspectorElements = {
    xpathSection: !!elements.xpathSection,
    playwrightSection: !!elements.playwrightSection,
    playwrightLocators: !!elements.playwrightLocators,
    xpathValueInput: !!elements.xpathValueInput,
    elementInfoPanel: !!elements.elementInfoPanel,
    xpathModeRadio: !!elements.xpathModeRadio,
    playwrightModeRadio: !!elements.playwrightModeRadio,
    startSelectionBtn: !!elements.startSelectionBtn,
    cancelSelectionBtn: !!elements.cancelSelectionBtn
  };

  console.log('Inspector elements found:', inspectorElements);

  // Check for missing critical elements
  const missingElements = Object.entries(inspectorElements)
    .filter(([key, exists]) => !exists)
    .map(([key]) => key);

  if (missingElements.length > 0) {
    console.warn('Missing Inspector elements:', missingElements);
  }

  // Initialize Inspector mode (variable is declared later in the file)
  if (typeof currentLocatorMode === 'undefined') {
    currentLocatorMode = 'xpath';
  }
  console.log('Inspector initialized with mode:', currentLocatorMode);

  // Initialize UI state
  if (elements.xpathSection && elements.playwrightSection) {
    elements.xpathSection.classList.remove('hidden');
    elements.playwrightSection.classList.add('hidden');
  }
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
  elements.openConsoleBtn.addEventListener('click', openBrowserConsole);
  elements.selectElementBtn.addEventListener('click', startElementSelection);
  elements.clearResultDisplayBtn.addEventListener('click', clearResultDisplay);

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

  // Analyzer Tab
  elements.inspectElementBtn.addEventListener('click', startContentInspection);
  elements.clearContentBtn.addEventListener('click', clearExtractedContent);
  elements.presetInstructions.addEventListener('change', handlePresetSelection);
  elements.analyzeBtn.addEventListener('click', analyzeContent);
  elements.copyResultsBtn.addEventListener('click', copyAnalysisResults);

  // Settings Tab
  elements.saveOpenrouterKeyBtn.addEventListener('click', () => saveApiKey('openrouter'));
  elements.clearOpenrouterKeyBtn.addEventListener('click', () => clearApiKey('openrouter'));
  elements.saveOpenaiKeyBtn.addEventListener('click', () => saveApiKey('openai'));
  elements.clearOpenaiKeyBtn.addEventListener('click', () => clearApiKey('openai'));
  elements.debugStorageBtn.addEventListener('click', debugStorage);

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

  // Listen for messages from background script
  // Use both browser and chrome APIs for cross-browser compatibility
  if (typeof browser !== 'undefined' && browser.runtime) {
    browser.runtime.onMessage.addListener(handleMessages);
  } else if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener(handleMessages);
  }

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
  // elements.scriptCodeInput.value = '';
  initCodeEditor('editor');
  elements.scriptEditor.classList.remove('hidden');
  elements.scriptActions.classList.add('hidden');
  elements.scriptNameInput.focus();
}

function saveScript() {
  const name = elements.scriptNameInput.value.trim();
  // const code = elements.scriptCodeInput.value.trim();
  const code = getCodeValue().trim();

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
  destroyEditor();
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
    // elements.scriptCodeInput.value = script.code;
    initCodeEditor('editor', script.code);
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

  // Show initial status
  showStatus(`🚀 Running "${script.name}"...`);

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
          showStatus(statusMsg, !result.success);

          // Log full output to console for debugging
          console.log(`Script "${script.name}" execution result:`, result);
        })
        .catch(error => {
          showStatus(`Error executing script: ${error.message}`, true);
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
      if (!tabs[0]) {
        showStatus('Error: No active tab found', true);
        resetSelectionButtons();
        return;
      }

      browser.tabs.sendMessage(tabs[0].id, { action: 'startElementSelection' })
        .then(() => {
          showStatus('Click on any element in the page to select it');
        })
        .catch(error => {
          console.error('Error starting element selection:', error);

          // Try to inject content script if it's not responding
          browser.tabs.executeScript(tabs[0].id, {
            file: 'content/content.js'
          })
          .then(() => {
            // Wait a moment for script to initialize
            setTimeout(() => {
              browser.tabs.sendMessage(tabs[0].id, { action: 'startElementSelection' })
                .then(() => {
                  showStatus('Click on any element in the page to select it');
                })
                .catch(retryError => {
                  console.error('Error after content script injection:', retryError);
                  showStatus('Error: Please refresh the page and try again', true);
                  resetSelectionButtons();
                });
            }, 100);
          })
          .catch(injectError => {
            console.error('Error injecting content script:', injectError);
            showStatus('Error: Could not inject content script. Please refresh the page.', true);
            resetSelectionButtons();
          });
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
  console.log('Sidebar received message:', message);

  // message.action === 'elementSelected' || 
  if (message.action === 'elementSelectedUpdate') {
    handleElementSelected(message.xpath, message.elementInfo, message.elementData);
  } else if (message.action === 'contentExtracted') {
    if (elements.extractedContent) {
      elements.extractedContent.value = message.content;
    }
    resetInspectionButton();
    showStatus('Content extracted successfully');
  } else if (message.action === 'contentInspectionCancelled') {
    resetInspectionButton();
    showStatus('Content inspection cancelled');
  } else if (message.action === 'elementSelectionCancelled') {
    resetSelectionButtons();
    showStatus('Element selection cancelled');
  }
}

/**
 * Handle when an element is selected
 */
function handleElementSelected(xpath, elementInfo, elementData) {
  console.log('Handling element selection:', { xpath, elementInfo, elementData });

  // Reset UI
  resetSelectionButtons();

  // Store the selected XPath - ensure it's not undefined
  selectedXPath = xpath || 'XPath generation failed';
  console.log('Selected XPath:', selectedXPath);

  // Create a mock element object from the element data for Playwright locator generation
  // Check both elementData and elementInfo for element properties
  console.log('Processing element data:', { elementData, elementInfo });

  const elementSource = elementData || elementInfo || {};
  console.log('Element source selected:', elementSource);

  // More comprehensive validation - check if we have any meaningful element data
  const hasValidData = elementSource && (
    elementSource.tagName ||
    elementSource.id ||
    elementSource.className ||
    elementSource.classes ||
    (elementSource.attributes && Object.keys(elementSource.attributes).length > 0) ||
    elementSource.textContent
  );

  console.log('Element validation result:', hasValidData);
  console.log('Element source keys:', elementSource ? Object.keys(elementSource) : 'null');

  if (hasValidData) {
    currentSelectedElement = {
      tagName: elementSource.tagName || '',
      id: elementSource.id || '',
      className: elementSource.className || elementSource.classes || '',
      textContent: elementSource.textContent || '',
      attributes: elementSource.attributes || {},
      outerHTML: elementSource.outerHTML || '',
      getAttribute: function(name) {
        console.log(`getAttribute called with: ${name}`);
        // Check both attributes object and direct properties
        const result = (this.attributes && this.attributes[name]) ||
               this[name] ||
               (name === 'data-testid' && (this.attributes['data-testid'] || this['data-testid'])) ||
               (name === 'data-test-id' && (this.attributes['data-test-id'] || this['data-test-id'])) ||
               (name === 'data-cy' && (this.attributes['data-cy'] || this['data-cy'])) ||
               null;
        console.log(`getAttribute(${name}) returning:`, result);
        return result;
      },
      // Add methods needed for Playwright locator generation
      closest: function(selector) {
        // Mock implementation - in real scenario this would traverse DOM
        return null;
      }
    };
    console.log('Successfully created mock element from:', elementSource);
    console.log('Mock element result:', currentSelectedElement);
    console.log('Mock element properties:', {
      tagName: currentSelectedElement.tagName,
      id: currentSelectedElement.id,
      className: currentSelectedElement.className,
      textContent: currentSelectedElement.textContent,
      attributes: currentSelectedElement.attributes
    });
  } else {
    console.error('No valid element data found. ElementData:', elementData, 'ElementInfo:', elementInfo);
    console.error('ElementSource:', elementSource);

    // Create a minimal mock element as fallback if we have any data at all
    if (elementSource && typeof elementSource === 'object') {
      console.log('Creating minimal fallback element');
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
      console.log('Fallback element created:', currentSelectedElement);
    } else {
      currentSelectedElement = null;
    }
  }

  // Update the XPath input field (for inspector tab)
  console.log('Attempting to update XPath input. Element exists:', !!elements.xpathValueInput);
  if (elements.xpathValueInput) {
    elements.xpathValueInput.value = selectedXPath;
    console.log('XPath input updated with:', selectedXPath);
    console.log('XPath input current value:', elements.xpathValueInput.value);
  } else {
    console.error('XPath input element not found. Trying to find it again...');
    // Try to find the element again
    const xpathInput = document.getElementById('xpath-value');
    if (xpathInput) {
      xpathInput.value = selectedXPath;
      console.log('XPath input found and updated via fallback');
      // Update the elements reference
      elements.xpathValueInput = xpathInput;
    } else {
      console.error('XPath input element still not found in DOM');
    }
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
        <p><strong>Tag:</strong> ${escapeHtml(elementInfo.tagName || 'Unknown')}</p>
        <p><strong>ID:</strong> ${escapeHtml(elementInfo.id || 'None')}</p>
        <p><strong>Classes:</strong> ${escapeHtml(elementInfo.className || elementInfo.classes || 'None')}</p>
        <p><strong>Text:</strong> ${escapeHtml(elementInfo.textContent || 'None')}</p>
      </div>
    `;
    elements.elementInfoPanel.innerHTML = infoHTML;
    console.log('Element info updated:', elementInfo);
  } else if (elements.elementInfoPanel) {
    elements.elementInfoPanel.innerHTML = '<p>Element selected but no details available</p>';
  }

  // Generate Playwright locators if in Playwright mode
  // Use setTimeout to ensure element processing is complete
  setTimeout(() => {
    if (currentLocatorMode === 'playwright' && currentSelectedElement) {
      console.log('Generating Playwright locators for element:', currentSelectedElement);
      generatePlaywrightLocators(currentSelectedElement);
    } else {
      console.log('Not generating Playwright locators. Mode:', currentLocatorMode, 'Element:', currentSelectedElement);
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
  // if (!elements.scriptCodeInput) return;

  // const cursorPos = elements.scriptCodeInput.selectionStart;
  // const textBefore = elements.scriptCodeInput.value.substring(0, cursorPos);
  // const textAfter = elements.scriptCodeInput.value.substring(cursorPos);

  // const xpathCode = `document.evaluate("${xpath}", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue`;
  // elements.scriptCodeInput.value = textBefore + xpathCode + textAfter;

  // // Focus back on the editor
  // elements.scriptCodeInput.focus();
  // elements.scriptCodeInput.selectionStart = cursorPos + xpathCode.length;
  // elements.scriptCodeInput.selectionEnd = cursorPos + xpathCode.length;

  const xpathCode = `document.evaluate("${xpath}", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue`;
  insertTextAtCursor(xpathCode);

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
  showStatus('🔧 Preparing console...');

  // Send message to background script to prepare console
  browser.runtime.sendMessage({
    action: 'openConsole'
  }).then(() => {
    showStatus('✅ Console prepared! Press F12, then click "Console" tab in Developer Tools.');
  }).catch(error => {
    console.error('Error opening console:', error);
    showStatus('❌ Could not prepare console. Press F12 manually to open Developer Tools.', true);
  });
}

/**
 * Show a status message
 */
function showStatus(message, isError = false) {
  if (elements.statusMessage) {
    elements.statusMessage.textContent = message;

    // Enhanced styling for different message types
    if (isError) {
      elements.statusMessage.style.color = '#d70022';
      elements.statusMessage.style.fontWeight = 'bold';
    } else if (message.includes('✅')) {
      elements.statusMessage.style.color = '#22c55e';
      elements.statusMessage.style.fontWeight = 'normal';
    } else {
      elements.statusMessage.style.color = '#737373';
      elements.statusMessage.style.fontWeight = 'normal';
    }

    // Clear the message after 5 seconds for longer messages, 3 seconds for short ones
    const clearTime = message.length > 100 ? 5000 : 3000;
    setTimeout(() => {
      elements.statusMessage.textContent = '';
    }, clearTime);
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

            // Execute script via background script (which will handle console opening)
            const result = await browser.runtime.sendMessage({
              action: 'runScript',
              code: processedCode,
              scriptName: script.name
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

// AI Content Analyzer Functions (Sidebar)
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
        showStatus('Error: Could not start element inspection', true);
      }
    });
  });
}

function resetInspectionButton() {
  state.isSelectingElement = false;
  elements.inspectElementBtn.textContent = 'Inspect Element';
  elements.inspectElementBtn.disabled = false;
}

// Handle preset instruction selection
function handlePresetSelection() {
  const selectedPreset = elements.presetInstructions.value;

  const presetTemplates = {
    'issue-analysis': 'Check what is the last issue here. How to reproduce it? Is there any solution available? What is the current status?',
    'bug-investigation': 'Identify the root cause of this issue. List steps to reproduce. Suggest potential fixes. Assess impact and priority.',
    'code-review': 'Review this code for potential issues. Check for security vulnerabilities. Suggest improvements. Verify best practices compliance.',
    'performance-analysis': 'Analyze performance bottlenecks. Identify slow operations. Suggest optimizations. Check resource usage patterns.',
    'custom': ''
  };

  if (selectedPreset && presetTemplates.hasOwnProperty(selectedPreset)) {
    elements.analysisPrompt.value = presetTemplates[selectedPreset];

    // Focus on the textarea after populating it
    elements.analysisPrompt.focus();

    // Show status message
    if (selectedPreset === 'custom') {
      showStatus('Textarea cleared for custom input');
    } else {
      showStatus(`Applied "${selectedPreset.replace('-', ' ')}" template. You can edit the instructions as needed.`);
    }
  }
}

function clearExtractedContent() {
  elements.extractedContent.value = '';
  elements.analysisResults.innerHTML = '<div class="empty-state">No analysis results yet. Extract content and click \'Analyze\' to get AI insights.</div>';
}

async function analyzeContent() {
  const content = elements.extractedContent.value.trim();
  const prompt = elements.analysisPrompt.value.trim();

  if (!content) {
    showStatus('Please extract some content first', true);
    return;
  }

  if (!prompt) {
    showStatus('Please enter analysis instructions', true);
    return;
  }

  // Check if API keys are available
  const apiKeys = await getApiKeys();
  console.log('API keys check:', apiKeys);

  if (!apiKeys.openrouter && !apiKeys.openai) {
    console.log('No API keys found - showing error');
    showStatus('Please configure at least one API key in Settings', true);
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
    showStatus('Analysis completed successfully');

  } catch (error) {
    console.error('Analysis error:', error);
    elements.analysisResults.classList.remove('loading');
    elements.analysisResults.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    showStatus('Analysis failed: ' + error.message, true);
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
    showStatus('No results to copy', true);
    return;
  }

  navigator.clipboard.writeText(results).then(() => {
    showStatus('Results copied to clipboard');
  }).catch(() => {
    showStatus('Failed to copy results', true);
  });
}

// Settings Functions (Sidebar)
function saveApiKey(provider) {
  const keyInput = provider === 'openrouter' ? elements.openrouterApiKey : elements.openaiApiKey;
  const modelInput = provider === 'openrouter' ? elements.openrouterModel : elements.openaiModel;

  const apiKey = keyInput.value.trim();
  const selectedModel = provider === 'openrouter' ? modelInput.value.trim() : modelInput.value;

  if (!apiKey) {
    showStatus('Please enter an API key', true);
    return;
  }

  // Basic validation
  if (apiKey.length < 10) {
    showStatus('API key appears to be too short', true);
    return;
  }

  // Validate model for OpenRouter
  if (provider === 'openrouter' && !selectedModel) {
    showStatus('Please enter an OpenRouter model name', true);
    return;
  }

  try {
    // Check if chrome.storage is available
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      console.error('Chrome storage API not available');
      showStatus('Storage API not available', true);
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
        showStatus('Failed to save API settings', true);
        return;
      }

      // Verify the save worked
      chrome.storage.local.get([`${provider}_api_key`, `${provider}_model`], (verification) => {
        console.log('Verification after save:', verification);

        if (!verification) {
          console.warn('Verification returned undefined');
          showStatus('Warning: Could not verify save', true);
        } else {
          keyInput.value = '';
          showStatus(`${provider === 'openrouter' ? 'OpenRouter' : 'OpenAI'} settings saved securely`);

          // Update placeholder to show key is configured
          keyInput.placeholder = 'API key configured (hidden for security)';
        }
      });
    });

  } catch (error) {
    console.error('Error saving API settings:', error);
    showStatus('Failed to save API settings', true);
  }
}

function clearApiKey(provider) {
  try {
    chrome.storage.local.remove([`${provider}_api_key`, `${provider}_model`], () => {
      if (chrome.runtime.lastError) {
        console.error('Error clearing API settings:', chrome.runtime.lastError);
        showStatus('Failed to clear API settings', true);
        return;
      }

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

      showStatus(`${provider === 'openrouter' ? 'OpenRouter' : 'OpenAI'} settings cleared`);
    });
  } catch (error) {
    console.error('Error clearing API settings:', error);
    showStatus('Failed to clear API settings', true);
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

// Remove this duplicate listener - it's handled by the browser.runtime listener above

// Debug function to check storage
async function debugStorage() {
  try {
    console.log('=== DEBUG STORAGE ===');

    // Check if chrome.storage is available
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      console.error('Chrome storage API not available');
      showStatus('Chrome storage API not available', true);
      return;
    }

    console.log('Chrome storage API is available');

    // Get all storage
    const allStorage = await chrome.storage.local.get(null);
    console.log('All storage contents:', allStorage);
    console.log('All storage type:', typeof allStorage);

    // Get specific API keys
    const apiKeys = await getApiKeys();
    console.log('API keys from getApiKeys():', apiKeys);

    // Check specific keys
    const specificKeys = await chrome.storage.local.get([
      'openrouter_api_key', 'openrouter_model',
      'openai_api_key', 'openai_model'
    ]);
    console.log('Specific API key storage:', specificKeys);
    console.log('Specific keys type:', typeof specificKeys);

    // Try a simple test save/get
    console.log('Testing simple save/get...');
    await chrome.storage.local.set({ test_key: 'test_value' });
    const testResult = await chrome.storage.local.get(['test_key']);
    console.log('Test result:', testResult);

    showStatus('Storage debug info logged to console');
  } catch (error) {
    console.error('Debug storage error:', error);
    showStatus('Debug failed - check console', true);
  }
}

// Enhanced Inspector Functions
let currentSelectedElement = null;
let currentLocatorMode = 'xpath';
let generatedLocators = [];

// Mode switching functions
function switchToXPathMode() {
  currentLocatorMode = 'xpath';
  console.log('Switched to XPath mode');
  if (elements.xpathSection) elements.xpathSection.classList.remove('hidden');
  if (elements.playwrightSection) elements.playwrightSection.classList.add('hidden');
  if (elements.snippetSection) elements.snippetSection.classList.add('hidden');
  updateActionButtons();
}

function switchToPlaywrightMode() {
  currentLocatorMode = 'playwright';
  console.log('Switched to Playwright mode');
  if (elements.xpathSection) elements.xpathSection.classList.add('hidden');
  if (elements.playwrightSection) elements.playwrightSection.classList.remove('hidden');
  updateActionButtons();

  // Generate Playwright locators if element is selected
  if (currentSelectedElement) {
    console.log('Generating locators for existing element:', currentSelectedElement);
    // Use setTimeout to ensure UI updates are complete
    setTimeout(() => {
      generatePlaywrightLocators(currentSelectedElement);
    }, 50);
  } else {
    console.log('No element selected for Playwright locator generation');
    // Show empty state message
    if (elements.playwrightLocators) {
      elements.playwrightLocators.innerHTML = '<div class="empty-state">Select an element to generate Playwright locators</div>';
    }
  }
}

// Playwright Locator Generation Engine
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
    const testId = element.getAttribute('data-testid') ||
                   element.getAttribute('data-test-id') ||
                   element.getAttribute('data-cy');
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

// Helper function to get implicit ARIA role
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

// Helper function to get accessible name
function getAccessibleName(element) {
  if (!element || !element.getAttribute) {
    return null;
  }

  try {
    // Check aria-label first
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // Check aria-labelledby (skip for mock elements as we don't have DOM access)
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy && typeof document !== 'undefined') {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) return labelElement.textContent.trim();
    }

    // For buttons, use text content
    if (element.tagName && element.tagName.toLowerCase() === 'button') {
      return element.textContent ? element.textContent.trim() : null;
    }

    // For links, use text content or title
    if (element.tagName && element.tagName.toLowerCase() === 'a') {
      return (element.textContent ? element.textContent.trim() : null) || element.getAttribute('title');
    }

    // For images, use alt text
    if (element.tagName && element.tagName.toLowerCase() === 'img') {
      return element.getAttribute('alt');
    }

    return null;
  } catch (error) {
    console.error('Error getting accessible name:', error);
    return null;
  }
}

// Helper function to get associated label
function getAssociatedLabel(element) {
  if (!element || !element.getAttribute) {
    return null;
  }

  try {
    // Check for explicit label association (skip for mock elements as we don't have DOM access)
    const id = element.getAttribute('id');
    if (id && typeof document !== 'undefined') {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent.trim();
    }

    // Check for implicit label association (skip for mock elements)
    if (element.closest && typeof element.closest === 'function') {
      const parentLabel = element.closest('label');
      if (parentLabel) {
        return parentLabel.textContent.trim();
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting associated label:', error);
    return null;
  }
}

// Helper function to get unique text content
function getUniqueTextContent(element) {
  if (!element || !element.textContent) {
    return null;
  }

  try {
    const text = element.textContent.trim();
    if (!text || text.length > 50) return null;

    // For mock elements, we can't check uniqueness on the page, so just return the text
    // In a real implementation, this would check against the actual DOM
    return text;
  } catch (error) {
    console.error('Error getting unique text content:', error);
    return null;
  }
}

// Helper function to generate CSS selectors
function generateCSSSelectors(element) {
  const selectors = [];

  if (!element || !element.getAttribute) {
    return selectors;
  }

  try {
    // ID selector (highest priority)
    const id = element.getAttribute('id');
    if (id && /^[a-zA-Z][\w-]*$/.test(id)) {
      selectors.push({
        value: `#${id}`,
        confidence: 'high',
        description: 'ID selector'
      });
    }
  } catch (error) {
    console.error('Error generating ID selector:', error);
  }

  try {
    // Class-based selector
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c && /^[a-zA-Z][\w-]*$/.test(c));
      if (classes.length > 0) {
        selectors.push({
          value: `.${classes.join('.')}`,
          confidence: 'medium',
          description: 'Class selector'
        });
      }
    }
  } catch (error) {
    console.error('Error generating class selector:', error);
  }

  try {
    // Attribute selectors
    const name = element.getAttribute('name');
    if (name) {
      selectors.push({
        value: `[name="${name}"]`,
        confidence: 'medium',
        description: 'Name attribute'
      });
    }
  } catch (error) {
    console.error('Error generating name selector:', error);
  }

  try {
    // Tag with attributes
    if (element.tagName) {
      const tagName = element.tagName.toLowerCase();
      const type = element.getAttribute('type');
      if (type) {
        selectors.push({
          value: `${tagName}[type="${type}"]`,
          confidence: 'low',
          description: 'Tag with type attribute'
        });
      }
    }
  } catch (error) {
    console.error('Error generating tag selector:', error);
  }

  return selectors;
}

// Display Playwright locators in the UI
function displayPlaywrightLocators() {
  console.log('displayPlaywrightLocators called with', generatedLocators.length, 'locators');
  const container = elements.playwrightLocators;

  if (!container) {
    console.error('Playwright locators container not found');
    return;
  }
 
  if (generatedLocators.length === 0) {
    container.innerHTML = '<div class="empty-state">No suitable locators found for this element</div>';
    console.log('No locators to display');
    return;
  }

  container.innerHTML = '';
  console.log('Displaying', generatedLocators.length, 'locators');

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

    // Add click handler to select this locator
    locatorItem.addEventListener('click', () => selectLocator(index));

    container.appendChild(locatorItem);
    console.log('Added locator item:', locator);
  });
}

// Locator selection and action functions
let selectedLocatorIndex = 0;

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
      showStatus(`${locator.type} locator copied to clipboard`);
    }).catch(() => {
      showStatus('Failed to copy locator', true);
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

// Enhanced action functions
function insertLocatorIntoScript() {
  if (currentLocatorMode === 'xpath') {
    insertXPathIntoScript();
  } else {
    insertPlaywrightLocatorIntoScript();
  }
}

function insertPlaywrightLocatorIntoScript() {
  if (generatedLocators.length === 0) {
    showStatus('No locators available to insert', true);
    return;
  }

  const locator = generatedLocators[selectedLocatorIndex];
  const locatorText = locator.value;

  insertTextAtCursor(locatorText);
  showStatus('Playwright locator inserted into script');

  // // Insert into the current script editor
  // if (elements.scriptCodeInput) {
  //   const currentCode = elements.scriptCodeInput.value;
  //   const cursorPos = elements.scriptCodeInput.selectionStart;
  //   const newCode = currentCode.slice(0, cursorPos) + locatorText + currentCode.slice(cursorPos);
  //   elements.scriptCodeInput.value = newCode;
  //   elements.scriptCodeInput.focus();
  //   elements.scriptCodeInput.setSelectionRange(cursorPos + locatorText.length, cursorPos + locatorText.length);
  //   showStatus('Playwright locator inserted into script');
  // } else {
  //   showStatus('No script editor available', true);
  // }
}

function testCurrentLocator() {
  if (currentLocatorMode === 'xpath') {
    testXPath();
  } else {
    testPlaywrightLocator();
  }
}

function testPlaywrightLocator() {
  if (generatedLocators.length === 0) {
    showStatus('No locators available to test', true);
    return;
  }

  const locator = generatedLocators[selectedLocatorIndex];

  // Send message to content script to test the locator
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'testPlaywrightLocator',
      locator: locator
    }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus('Error testing locator', true);
        return;
      }

      if (response && response.success) {
        showStatus(`Locator found ${response.count} element(s)`);
      } else {
        showStatus('Locator test failed', true);
      }
    });
  });
}

function generateCodeSnippet() {
  if (generatedLocators.length === 0) {
    showStatus('No locators available for snippet generation', true);
    return;
  }

  const locator = generatedLocators[selectedLocatorIndex];
  const snippets = generatePlaywrightSnippets(locator);
  const snippetContent = snippets.join('\n\n');

  try {
    // Update CodeMirror editor instead of textarea
    updateSnippetContent(snippetContent);
    elements.snippetSection.classList.remove('hidden');
    showStatus('Code snippets generated');
  } catch (error) {
    console.error('Failed to update snippet content:', error);
    showStatus('Error generating code snippet', true);
  }
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

// Replace the existing copyCodeSnippet function
function copyCodeSnippet() {
  try {
    const snippet = getSnippetContent(); // Use CodeMirror API instead of textarea.value
    if (snippet) {
      navigator.clipboard.writeText(snippet).then(() => {
        showStatus('Code snippet copied to clipboard');
      }).catch(() => {
        showStatus('Failed to copy snippet', true);
      });
    } else {
      showStatus('No snippet content to copy', true);
    }
  } catch (error) {
    console.error('Failed to get snippet content:', error);
    showStatus('Error accessing snippet content', true);
  }
}


// Make functions globally available
window.copyLocator = copyLocator;
window.selectLocator = selectLocator;

// Debug function to test Inspector functionality
window.testInspector = function() {
  console.log('=== Inspector Test ===');
  console.log('Current locator mode:', currentLocatorMode);
  console.log('Current selected element:', currentSelectedElement);
  console.log('Generated locators:', generatedLocators);
  console.log('Inspector elements:', {
    xpathSection: !!elements.xpathSection,
    playwrightSection: !!elements.playwrightSection,
    playwrightLocators: !!elements.playwrightLocators,
    xpathValueInput: !!elements.xpathValueInput,
    elementInfoPanel: !!elements.elementInfoPanel
  });

  // Test mock element creation
  const testElementData = {
    tagName: 'BUTTON',
    id: 'test-button',
    className: 'btn btn-primary',
    textContent: 'Click me',
    attributes: {
      'data-testid': 'submit-btn',
      'type': 'button'
    }
  };

  console.log('Testing mock element creation with:', testElementData);

  // Simulate element selection
  handleElementSelected('//*[@id="test-button"]', testElementData, testElementData);

  console.log('After handleElementSelected:');
  console.log('Current selected element:', currentSelectedElement);

  // Test Playwright mode switch
  if (currentLocatorMode !== 'playwright') {
    console.log('Switching to Playwright mode...');
    switchToPlaywrightMode();
  }

  console.log('=== End Inspector Test ===');
};

// Debug function to test XPath input specifically
window.testXPathInput = function() {
  console.log('=== XPath Input Test ===');

  const xpathInput = document.getElementById('xpath-value');
  console.log('XPath input element found:', !!xpathInput);
  console.log('XPath input in elements object:', !!elements.xpathValueInput);

  if (xpathInput) {
    console.log('XPath input current value:', xpathInput.value);
    xpathInput.value = 'TEST XPATH VALUE';
    console.log('XPath input after setting test value:', xpathInput.value);
  }

  // Test element info panel
  const elementInfoPanel = document.getElementById('element-info');
  console.log('Element info panel found:', !!elementInfoPanel);

  if (elementInfoPanel) {
    elementInfoPanel.innerHTML = '<div>TEST ELEMENT INFO</div>';
    console.log('Element info panel updated');
  }

  console.log('=== End XPath Input Test ===');
};

// Initialize settings when tab is shown
document.addEventListener('DOMContentLoaded', () => {
  // Load API key status when settings tab is first shown
  const settingsTab = document.querySelector('[data-tab="settings"]');
  if (settingsTab) {
    settingsTab.addEventListener('click', loadApiKeyStatus);
  }
});

