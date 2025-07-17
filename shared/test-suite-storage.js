// Test Suite Storage Manager
// Handles storage operations for test suites, execution results, and related data

/**
 * Test Suite Storage Manager
 * Provides methods for storing and retrieving test suite data
 */
class TestSuiteStorage {
  constructor() {
    this.storageKeys = {
      testSuites: 'testSuites',
      suiteResults: 'suiteResults',
      settings: 'testSuiteSettings'
    };
    
    this.defaultSettings = {
      defaultTimeout: 30000,
      maxResultHistory: 50,
      autoScreenshot: false,
      maxSuiteHistory: 10
    };
  }

  /**
   * Initialize storage with default values if not present
   */
  async initialize() {
    try {
      const existingData = await browser.storage.local.get([
        this.storageKeys.testSuites,
        this.storageKeys.suiteResults,
        this.storageKeys.settings
      ]);

      const updates = {};

      if (!existingData[this.storageKeys.testSuites]) {
        updates[this.storageKeys.testSuites] = [];
      }

      if (!existingData[this.storageKeys.suiteResults]) {
        updates[this.storageKeys.suiteResults] = [];
      }

      if (!existingData[this.storageKeys.settings]) {
        updates[this.storageKeys.settings] = this.defaultSettings;
      }

      if (Object.keys(updates).length > 0) {
        await browser.storage.local.set(updates);
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize test suite storage:', error);
      return false;
    }
  }

  /**
   * Get all test suites
   */
  async getTestSuites() {
    try {
      const data = await browser.storage.local.get(this.storageKeys.testSuites);
      return data[this.storageKeys.testSuites] || [];
    } catch (error) {
      console.error('Failed to get test suites:', error);
      return [];
    }
  }

  /**
   * Get a specific test suite by ID
   */
  async getTestSuite(suiteId) {
    try {
      const suites = await this.getTestSuites();
      return suites.find(suite => suite.id === suiteId) || null;
    } catch (error) {
      console.error('Failed to get test suite:', error);
      return null;
    }
  }

  /**
   * Save a test suite (create or update)
   */
  async saveTestSuite(testSuite) {
    try {
      const suites = await this.getTestSuites();
      const existingIndex = suites.findIndex(suite => suite.id === testSuite.id);
      
      testSuite.updatedAt = new Date().toISOString();
      
      if (existingIndex >= 0) {
        suites[existingIndex] = testSuite;
      } else {
        suites.push(testSuite);
      }

      await browser.storage.local.set({
        [this.storageKeys.testSuites]: suites
      });

      return true;
    } catch (error) {
      console.error('Failed to save test suite:', error);
      return false;
    }
  }

  /**
   * Delete a test suite
   */
  async deleteTestSuite(suiteId) {
    try {
      const suites = await this.getTestSuites();
      const filteredSuites = suites.filter(suite => suite.id !== suiteId);
      
      await browser.storage.local.set({
        [this.storageKeys.testSuites]: filteredSuites
      });

      // Also delete related execution results
      await this.deleteExecutionResults(suiteId);

      return true;
    } catch (error) {
      console.error('Failed to delete test suite:', error);
      return false;
    }
  }

  /**
   * Get execution results for a specific suite
   */
  async getExecutionResults(suiteId = null) {
    try {
      const data = await browser.storage.local.get(this.storageKeys.suiteResults);
      const results = data[this.storageKeys.suiteResults] || [];
      
      if (suiteId) {
        return results.filter(result => result.suiteId === suiteId);
      }
      
      return results;
    } catch (error) {
      console.error('Failed to get execution results:', error);
      return [];
    }
  }

  /**
   * Save an execution result
   */
  async saveExecutionResult(executionResult) {
    try {
      const results = await this.getExecutionResults();
      results.unshift(executionResult); // Add to beginning for chronological order
      
      // Limit the number of stored results
      const settings = await this.getSettings();
      if (results.length > settings.maxResultHistory) {
        results.splice(settings.maxResultHistory);
      }

      await browser.storage.local.set({
        [this.storageKeys.suiteResults]: results
      });

      // Update the test suite's last executed timestamp
      await this.updateSuiteLastExecuted(executionResult.suiteId, executionResult.timestamp);

      return true;
    } catch (error) {
      console.error('Failed to save execution result:', error);
      return false;
    }
  }

  /**
   * Delete execution results for a specific suite
   */
  async deleteExecutionResults(suiteId) {
    try {
      const results = await this.getExecutionResults();
      const filteredResults = results.filter(result => result.suiteId !== suiteId);
      
      await browser.storage.local.set({
        [this.storageKeys.suiteResults]: filteredResults
      });

      return true;
    } catch (error) {
      console.error('Failed to delete execution results:', error);
      return false;
    }
  }

  /**
   * Update the last executed timestamp for a test suite
   */
  async updateSuiteLastExecuted(suiteId, timestamp) {
    try {
      const suites = await this.getTestSuites();
      const suite = suites.find(s => s.id === suiteId);
      
      if (suite) {
        suite.lastExecuted = timestamp;
        await this.saveTestSuite(suite);
      }

      return true;
    } catch (error) {
      console.error('Failed to update suite last executed:', error);
      return false;
    }
  }

  /**
   * Get test suite settings
   */
  async getSettings() {
    try {
      const data = await browser.storage.local.get(this.storageKeys.settings);
      return { ...this.defaultSettings, ...data[this.storageKeys.settings] };
    } catch (error) {
      console.error('Failed to get settings:', error);
      return this.defaultSettings;
    }
  }

  /**
   * Save test suite settings
   */
  async saveSettings(settings) {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      
      await browser.storage.local.set({
        [this.storageKeys.settings]: updatedSettings
      });

      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  /**
   * Clear all test suite data (for testing/reset purposes)
   */
  async clearAll() {
    try {
      await browser.storage.local.remove([
        this.storageKeys.testSuites,
        this.storageKeys.suiteResults,
        this.storageKeys.settings
      ]);

      await this.initialize();
      return true;
    } catch (error) {
      console.error('Failed to clear test suite data:', error);
      return false;
    }
  }

  /**
   * Export test suites and results for backup
   */
  async exportData() {
    try {
      const data = await browser.storage.local.get([
        this.storageKeys.testSuites,
        this.storageKeys.suiteResults,
        this.storageKeys.settings
      ]);

      return {
        version: '1.0',
        timestamp: new Date().toISOString(),
        testSuites: data[this.storageKeys.testSuites] || [],
        suiteResults: data[this.storageKeys.suiteResults] || [],
        settings: data[this.storageKeys.settings] || this.defaultSettings
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      return null;
    }
  }

  /**
   * Import test suites and results from backup
   */
  async importData(importData, options = { merge: false }) {
    try {
      if (!importData || !importData.version) {
        throw new Error('Invalid import data format');
      }

      if (options.merge) {
        // Merge with existing data
        const existingSuites = await this.getTestSuites();
        const existingResults = await this.getExecutionResults();
        
        const mergedSuites = [...existingSuites];
        const mergedResults = [...existingResults];
        
        // Add imported suites that don't already exist
        importData.testSuites.forEach(importedSuite => {
          if (!mergedSuites.find(suite => suite.id === importedSuite.id)) {
            mergedSuites.push(importedSuite);
          }
        });
        
        // Add imported results that don't already exist
        importData.suiteResults.forEach(importedResult => {
          if (!mergedResults.find(result => result.id === importedResult.id)) {
            mergedResults.push(importedResult);
          }
        });

        await browser.storage.local.set({
          [this.storageKeys.testSuites]: mergedSuites,
          [this.storageKeys.suiteResults]: mergedResults,
          [this.storageKeys.settings]: { ...this.defaultSettings, ...importData.settings }
        });
      } else {
        // Replace existing data
        await browser.storage.local.set({
          [this.storageKeys.testSuites]: importData.testSuites || [],
          [this.storageKeys.suiteResults]: importData.suiteResults || [],
          [this.storageKeys.settings]: { ...this.defaultSettings, ...importData.settings }
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}

// Create a singleton instance
const testSuiteStorage = new TestSuiteStorage();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TestSuiteStorage, testSuiteStorage };
}
