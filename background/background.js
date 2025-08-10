// Background script for Console Script Manager extension

// Initialize extension when installed
browser.runtime.onInstalled.addListener(async () => {
  console.log('Console Script Manager extension installed');

  // Initialize storage with empty data
  await browser.storage.local.set({
    scripts: [],
    variables: [],
    results: []
  });

  // Initialize test suite storage with fallback
  try {
    // Fallback initialization for test suites
    const existingData = await browser.storage.local.get([
      'testSuites', 'suiteResults', 'testSuiteSettings'
    ]);

    const updates = {};

    if (!existingData.testSuites) {
      updates.testSuites = [];
    }

    if (!existingData.suiteResults) {
      updates.suiteResults = [];
    }

    if (!existingData.testSuiteSettings) {
      updates.testSuiteSettings = {
        defaultTimeout: 30000,
        maxResultHistory: 50,
        autoScreenshot: false,
        maxSuiteHistory: 10
      };
    }

    if (Object.keys(updates).length > 0) {
      await browser.storage.local.set(updates);
    }

    console.log('Test suite storage initialized');
  } catch (error) {
    console.error('Failed to initialize test suite storage:', error);
  }
});

// Listen for messages from popup or content scripts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle element selection mode
  if (message.action === 'startElementSelection') {
    // Send message to the active tab's content script
    browser.tabs.query({ active: true, currentWindow: true })
      .then(tabs => {
        if (tabs[0]) {
          return browser.tabs.sendMessage(tabs[0].id, { action: 'startElementSelection' });
        }
      })
      .then(response => {
        sendResponse(response);
      })
      .catch(error => {
        console.error('Error starting element selection:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Required for async sendResponse
  }
  
  // Handle script execution
  if (message.action === 'runScript') {
    browser.tabs.query({ active: true, currentWindow: true })
      .then(tabs => {
        if (tabs[0]) {
          const tabId = tabs[0].id;

          // Try to activate the tab (optional - don't fail if this doesn't work)
          browser.tabs.update(tabId, { active: true }).catch(() => {
            console.log('Could not activate tab, but continuing with script execution');
          });

          // Prepare console (optional - don't fail if this doesn't work)
          prepareConsoleForExecution(tabId).catch(() => {
            console.log('Could not prepare console, but continuing with script execution');
          });

          // Execute the script (this is the critical part)
          return browser.tabs.sendMessage(tabId, {
            action: 'runScript',
            code: message.code,
            scriptName: message.scriptName
          });
        } else {
          throw new Error('No active tab found');
        }
      })
      .then(response => {
        sendResponse(response);
      })
      .catch(error => {
        console.error('Error running script:', error);
        sendResponse({ success: false, output: `Error: ${error.message}` });
      });

    return true; // Required for async sendResponse
  }

  // Handle manual console opening
  if (message.action === 'openConsole') {
    browser.tabs.query({ active: true, currentWindow: true })
      .then(tabs => {
        if (tabs[0]) {
          const tabId = tabs[0].id;

          // Try to activate the tab
          browser.tabs.update(tabId, { active: true }).catch(() => {
            console.log('Could not activate tab');
          });

          // Prepare console
          return prepareConsoleForExecution(tabId);
        } else {
          throw new Error('No active tab found');
        }
      })
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('Error opening console:', error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // Required for async sendResponse
  }

  // Handle element selected event from content script
  if (message.action === 'elementSelected') {
    console.log('Background received elementSelected:', message);

    // Store the element data temporarily for popup/sidebar access
    browser.storage.local.set({
      lastSelectedElement: {
        xpath: message.xpath,
        elementInfo: message.elementInfo,
        elementData: message.elementData,
        timestamp: Date.now()
      }
    }).then(() => {
      console.log('Element data stored successfully');

      // Try to forward to popup/sidebar
      return browser.runtime.sendMessage({
        action: 'elementSelectedUpdate',
        xpath: message.xpath,
        elementInfo: message.elementInfo,
        elementData: message.elementData
      });
    }).catch(error => {
      // Popup or sidebar might be closed, which is expected
      console.log('Could not forward element selection to popup/sidebar (might be closed):', error);
    });

    sendResponse({ success: true });
    return true;
  }

  // Handle element selection cancelled event from content script
  if (message.action === 'elementSelectionCancelled') {
    console.log('Background received element selection cancelled');

    // Forward to popup/sidebar
    browser.runtime.sendMessage({
      action: 'elementSelectionCancelled'
    }).catch(error => {
      console.log('Could not forward cancellation to popup/sidebar (might be closed):', error);
    });

    sendResponse({ success: true });
    return true;
  }

  // Handle XPath insertion from sidebar to popup
  if (message.action === 'insertXPathIntoScript') {
    // Forward the XPath to the popup
    browser.runtime.sendMessage({
      action: 'insertXPathFromSidebar',
      xpath: message.xpath
    }).catch(error => {
      console.log('Could not forward XPath to popup (might be closed)');
    });

    sendResponse({ success: true });
    return true;
  }

  // Handle state synchronization requests
  if (message.action === 'syncState') {
    // Forward state sync request to both popup and sidebar
    browser.runtime.sendMessage({
      action: 'stateChanged',
      data: message.data
    }).catch(error => {
      console.log('Could not sync state (popup/sidebar might be closed)');
    });

    sendResponse({ success: true });
    return true;
  }
});


// Function to prepare console for script execution
function prepareConsoleForExecution(tabId) {
  return new Promise((resolve, reject) => {
    try {
      // Inject a script that creates prominent console messages and visual indicators
      const executeScript = chrome.tabs.executeScript || browser.tabs.executeScript;
      executeScript(tabId, {
      code: `
        (function() {
          // Clear console and add prominent header
          console.clear();
          console.log('%c🚀 Console Script Manager - Script Execution', 'color: #4f46e5; font-weight: bold; font-size: 18px; padding: 8px; background: linear-gradient(45deg, #4f46e5, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent;');
          console.log('%c' + '='.repeat(60), 'color: #4f46e5;');
          console.log('%c📍 Switched to this tab automatically!', 'color: #f59e0b; font-weight: 500; font-size: 14px;');
          console.log('%cDeveloper Console opened! Script output will appear below.', 'color: #22c55e; font-weight: 500; font-size: 14px;');
          console.log('%cTime: ' + new Date().toLocaleString(), 'color: #6b7280; font-style: italic;');
          console.log('%c' + '='.repeat(60), 'color: #4f46e5;');

          // Try to bring focus to console (works in some browsers)
          if (window.focus) window.focus();

          // Create a temporary visual indicator on the page
          // Remove any existing indicator first
          var existingIndicator = document.getElementById('console-script-manager-indicator');
          if (existingIndicator) {
            existingIndicator.remove();
          }

          var indicator = document.createElement('div');
          indicator.id = 'console-script-manager-indicator';
          indicator.innerHTML = '🚀 Tab switched! Console opened! Check Developer Tools below ↓';
          indicator.style.cssText = \`
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          font-weight: 500;
          animation: slideUp 0.3s ease-out;
        \`;

          // Add animation styles (remove existing first)
          var existingStyle = document.getElementById('console-script-manager-styles');
          if (existingStyle) {
            existingStyle.remove();
          }

          var style = document.createElement('style');
          style.id = 'console-script-manager-styles';
          style.textContent = \`
            @keyframes slideUp {
              from { transform: translateY(100%); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            @keyframes slideDown {
              from { transform: translateY(0); opacity: 1; }
              to { transform: translateY(100%); opacity: 0; }
            }
          \`;
          document.head.appendChild(style);
          document.body.appendChild(indicator);

          // Remove indicator after 3 seconds
          setTimeout(function() {
            indicator.style.animation = 'slideDown 0.3s ease-in forwards';
            setTimeout(function() {
              if (indicator && indicator.parentNode) {
                indicator.remove();
              }
            }, 300);
          }, 3000);
        })();
      `
    }, () => {
      const lastError = chrome.runtime.lastError || browser.runtime.lastError;
      if (lastError) {
        console.log('Could not inject console preparation script:', lastError.message);
        reject(new Error(lastError.message));
      } else {
        console.log('Console preparation script injected successfully');
        resolve();
      }
    });
    } catch (error) {
      console.error('Console preparation failed:', error);
      reject(error);
    }
  });
}

// Handle browser action click (toolbar icon)
browser.browserAction.onClicked.addListener((tab) => {
  // Toggle the sidebar when the extension icon is clicked
  browser.sidebarAction.toggle();
});