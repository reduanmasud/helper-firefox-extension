// Global state
let state = {
  scripts: [],
  variables: [],
  results: [],
  currentScriptId: null,
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
  browser.storage.local.get(['scripts', 'variables', 'results'])
    .then(data => {
      state.scripts = data.scripts || [];
      state.variables = data.variables || [];
      state.results = data.results || [];
      renderScriptsList();
      renderVariablesList();
      renderResultsList();
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
    results: state.results
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
  if (state.results.length === 0) {
    elements.resultsContainer.innerHTML = '<div class="empty-state">No results yet. Run a script to see output here!</div>';
    return;
  }
  
  elements.resultsContainer.innerHTML = '';
  state.results.forEach(result => {
    const resultElement = document.createElement('div');
    resultElement.className = 'result-item';
    
    const timestamp = new Date(result.timestamp).toLocaleString();
    const statusClass = result.success ? 'result-success' : 'result-error';
    const statusText = result.success ? 'Success' : 'Error';
    
    // Create header element
    const headerDiv = document.createElement('div');
    headerDiv.className = 'result-header';
    
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
    contentPre.textContent = result.output; // No need for escapeHtml since we're using textContent
    
    // Append elements
    headerDiv.appendChild(timestampDiv);
    headerDiv.appendChild(statusDiv);
    resultElement.appendChild(headerDiv);
    resultElement.appendChild(contentPre);
    
    elements.resultsContainer.appendChild(resultElement);
  });
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