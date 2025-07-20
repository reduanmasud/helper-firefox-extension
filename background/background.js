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
          return browser.tabs.sendMessage(tabs[0].id, { 
            action: 'runScript',
            code: message.code
          });
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

// Handle browser action click (toolbar icon)
browser.browserAction.onClicked.addListener((tab) => {
  // This won't be triggered if we have a popup defined in manifest.json
  // But we'll keep it here in case we want to change the behavior later
});