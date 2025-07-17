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

  // Initialize test suite storage
  try {
    // Import test suite storage (we'll need to load it dynamically)
    const { testSuiteStorage } = await import('../shared/test-suite-storage.js');
    await testSuiteStorage.initialize();
    console.log('Test suite storage initialized');
  } catch (error) {
    console.error('Failed to initialize test suite storage:', error);
    // Fallback initialization
    await browser.storage.local.set({
      testSuites: [],
      suiteResults: [],
      testSuiteSettings: {
        defaultTimeout: 30000,
        maxResultHistory: 50,
        autoScreenshot: false,
        maxSuiteHistory: 10
      }
    });
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
    // Forward the message to both the popup and sidebar if they're open
    browser.runtime.sendMessage(message)
      .catch(error => {
        // Popup or sidebar might be closed, which is expected
        console.log('Could not forward element selection to popup/sidebar (might be closed)');
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