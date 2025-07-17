# Example Scripts for Console Script Manager

This document provides a collection of example scripts that you can use with the Console Script Manager extension. Feel free to copy, modify, and adapt these examples for your own needs.

## Table of Contents

1. [Form Filling](#form-filling)
2. [Data Extraction](#data-extraction)
3. [Page Interaction](#page-interaction)
4. [DOM Manipulation](#dom-manipulation)
5. [Utility Functions](#utility-functions)

## Form Filling

### Basic Form Fill

```javascript
// Fill out a simple login form
const usernameField = document.querySelector('#username');
const passwordField = document.querySelector('#password');
const submitButton = document.querySelector('#login-button');

if (usernameField && passwordField && submitButton) {
  usernameField.value = '${username}';
  passwordField.value = '${password}';
  submitButton.click();
  console.log('Login form submitted');
} else {
  console.error('Could not find all form elements');
}
```

### Complex Form with Multiple Fields

```javascript
// Fill out a registration form
const formData = {
  'first-name': '${firstName}',
  'last-name': '${lastName}',
  'email': '${email}',
  'phone': '${phone}',
  'address': '${address}',
  'city': '${city}',
  'state': '${state}',
  'zip': '${zip}'
};

// Fill each field
let allFieldsFound = true;
for (const [id, value] of Object.entries(formData)) {
  const field = document.querySelector(`#${id}`);
  if (field) {
    field.value = value;
    // Trigger input event to activate any listeners
    field.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    console.error(`Field #${id} not found`);
    allFieldsFound = false;
  }
}

// Submit the form if all fields were found
if (allFieldsFound) {
  const submitButton = document.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.click();
    console.log('Form submitted successfully');
  } else {
    console.error('Submit button not found');
  }
}
```

## Data Extraction

### Extract Table Data

```javascript
// Extract data from a table
const table = document.querySelector('table');
if (!table) {
  console.error('No table found on the page');
  return;
}

// Get headers
const headers = [];
const headerCells = table.querySelectorAll('thead th');
headerCells.forEach(cell => headers.push(cell.textContent.trim()));

// Get rows
const rows = [];
const rowElements = table.querySelectorAll('tbody tr');

rowElements.forEach(row => {
  const rowData = {};
  const cells = row.querySelectorAll('td');
  
  cells.forEach((cell, index) => {
    if (index < headers.length) {
      rowData[headers[index]] = cell.textContent.trim();
    }
  });
  
  rows.push(rowData);
});

console.log('Extracted Table Data:');
console.log(rows);

// Return the data for potential use in other scripts
return rows;
```

### Extract Product Information

```javascript
// Extract product information from an e-commerce page
const productInfo = {};

// Get product title
const titleElement = document.querySelector('h1.product-title');
if (titleElement) {
  productInfo.title = titleElement.textContent.trim();
}

// Get product price
const priceElement = document.querySelector('.product-price');
if (priceElement) {
  productInfo.price = priceElement.textContent.trim();
}

// Get product description
const descriptionElement = document.querySelector('.product-description');
if (descriptionElement) {
  productInfo.description = descriptionElement.textContent.trim();
}

// Get product images
productInfo.images = [];
const imageElements = document.querySelectorAll('.product-image img');
imageElements.forEach(img => {
  if (img.src) {
    productInfo.images.push(img.src);
  }
});

console.log('Product Information:');
console.log(productInfo);

return productInfo;
```

## Page Interaction

### Click Through Pagination

```javascript
// Click through pagination and collect data
const maxPages = 5; // Set the maximum number of pages to navigate
let currentPage = 1;

// Function to extract data from the current page
function extractPageData() {
  const items = document.querySelectorAll('.item');
  const pageData = [];
  
  items.forEach(item => {
    const title = item.querySelector('.title')?.textContent.trim();
    const price = item.querySelector('.price')?.textContent.trim();
    
    pageData.push({ title, price });
  });
  
  return pageData;
}

// Start collecting data
const allData = [];
allData.push(...extractPageData());
console.log(`Collected data from page ${currentPage}`);

// Function to click the next page button and collect data
function processNextPage() {
  const nextButton = document.querySelector('.pagination .next');
  
  if (nextButton && !nextButton.disabled && currentPage < maxPages) {
    nextButton.click();
    
    // Wait for page to load
    setTimeout(() => {
      currentPage++;
      const newData = extractPageData();
      allData.push(...newData);
      console.log(`Collected data from page ${currentPage}`);
      
      // Process next page
      processNextPage();
    }, 2000); // Adjust timeout as needed for page load
  } else {
    console.log('Finished collecting data or reached max pages');
    console.log('All collected data:', allData);
  }
}

// Start the process for subsequent pages
processNextPage();
```

### Infinite Scroll Data Collection

```javascript
// Collect data from an infinite scroll page
const maxScrolls = 5;
let scrollCount = 0;
const allItems = new Set();

// Function to extract items currently visible
function extractItems() {
  const items = document.querySelectorAll('.item');
  let newItemsFound = 0;
  
  items.forEach(item => {
    const itemId = item.id || item.dataset.id || item.textContent.trim();
    if (!allItems.has(itemId)) {
      allItems.add(itemId);
      newItemsFound++;
    }
  });
  
  return newItemsFound;
}

// Initial extraction
let newItems = extractItems();
console.log(`Initially found ${newItems} items`);

// Function to scroll and extract more items
function scrollAndExtract() {
  if (scrollCount >= maxScrolls) {
    console.log(`Reached maximum scroll count (${maxScrolls})`);
    console.log(`Total unique items found: ${allItems.size}`);
    return;
  }
  
  // Scroll down
  window.scrollTo(0, document.body.scrollHeight);
  scrollCount++;
  
  // Wait for new content to load
  setTimeout(() => {
    newItems = extractItems();
    console.log(`Scroll ${scrollCount}: Found ${newItems} new items`);
    
    if (newItems > 0) {
      scrollAndExtract();
    } else {
      console.log('No new items found, stopping');
      console.log(`Total unique items found: ${allItems.size}`);
    }
  }, 2000); // Adjust timeout as needed for content load
}

// Start the scrolling process
scrollAndExtract();
```

## DOM Manipulation

### Add Custom Styling

```javascript
// Add custom CSS to the page
function addCustomStyle(css) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  console.log('Custom style added');
}

// Define your custom CSS
const customCSS = `
  .highlight {
    background-color: yellow !important;
    border: 2px solid red !important;
  }
  
  .hidden-element {
    display: none !important;
  }
  
  .enlarged-text {
    font-size: 1.5em !important;
  }
`;

// Add the custom CSS
addCustomStyle(customCSS);

// Apply the custom classes to elements
const importantElements = document.querySelectorAll('${importantSelector}');
importantElements.forEach(el => el.classList.add('highlight'));

const distractingElements = document.querySelectorAll('${distractingSelector}');
distractingElements.forEach(el => el.classList.add('hidden-element'));

const textElements = document.querySelectorAll('${textSelector}');
textElements.forEach(el => el.classList.add('enlarged-text'));

console.log('Custom styling applied to elements');
```

### Create Custom Controls

```javascript
// Add custom controls to the page
function createControlPanel() {
  // Create the panel container
  const panel = document.createElement('div');
  panel.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: white;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 10px;
    z-index: 9999;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  `;
  
  // Add a title
  const title = document.createElement('h3');
  title.textContent = 'Custom Controls';
  title.style.margin = '0 0 10px 0';
  panel.appendChild(title);
  
  // Add a button
  const button = document.createElement('button');
  button.textContent = 'Highlight Headers';
  button.style.marginRight = '10px';
  button.onclick = () => {
    document.querySelectorAll('h1, h2, h3').forEach(el => {
      el.style.backgroundColor = 'yellow';
    });
  };
  panel.appendChild(button);
  
  // Add another button
  const button2 = document.createElement('button');
  button2.textContent = 'Hide Images';
  button2.onclick = () => {
    document.querySelectorAll('img').forEach(el => {
      el.style.display = el.style.display === 'none' ? '' : 'none';
    });
    button2.textContent = button2.textContent === 'Hide Images' ? 'Show Images' : 'Hide Images';
  };
  panel.appendChild(button2);
  
  // Add the panel to the page
  document.body.appendChild(panel);
  console.log('Control panel added');
}

// Create the control panel
createControlPanel();
```

## Utility Functions

### Wait for Element

```javascript
// Wait for an element to appear on the page
async function waitForElement(selector, timeout = 10000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) {
      console.log(`Element ${selector} found`);
      return element;
    }
    
    // Wait a bit before checking again
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.error(`Timeout waiting for element ${selector}`);
  return null;
}

// Usage example
(async () => {
  const button = await waitForElement('#dynamic-button');
  if (button) {
    button.click();
    console.log('Button clicked');
  }
})();
```

### Monitor Network Requests

```javascript
// Monitor network requests (XHR and Fetch)
function monitorNetworkRequests() {
  // Store original methods
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalFetch = window.fetch;
  
  // Override XHR open method
  XMLHttpRequest.prototype.open = function(method, url) {
    console.log(`XHR Request: ${method} ${url}`);
    return originalXHROpen.apply(this, arguments);
  };
  
  // Override fetch
  window.fetch = function(resource, init) {
    const url = typeof resource === 'string' ? resource : resource.url;
    const method = init?.method || 'GET';
    console.log(`Fetch Request: ${method} ${url}`);
    return originalFetch.apply(this, arguments);
  };
  
  console.log('Network request monitoring enabled');
}

// Start monitoring
monitorNetworkRequests();
```

### Save Data to CSV

```javascript
// Convert data to CSV and download it
function saveToCSV(data, filename = 'export.csv') {
  if (!data || !data.length) {
    console.error('No data to export');
    return;
  }
  
  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV rows
  const csvRows = [];
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape quotes and wrap in quotes if needed
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }
  
  // Create CSV content
  const csvContent = csvRows.join('\n');
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log(`CSV file "${filename}" created and downloaded`);
}

// Example usage
const tableData = Array.from(document.querySelectorAll('table tr')).map(row => {
  const cells = Array.from(row.querySelectorAll('td, th'));
  return {
    column1: cells[0]?.textContent.trim() || '',
    column2: cells[1]?.textContent.trim() || '',
    column3: cells[2]?.textContent.trim() || ''
  };
});

saveToCSV(tableData, 'table-data.csv');
```

---

Feel free to combine and modify these examples to suit your specific needs. Remember to create variables for any values that might change between script executions.