# User Guide for Console Script Manager

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Initial Setup](#initial-setup)
  - [Permissions](#permissions)
- [Interface Overview](#interface-overview)
  - [Scripts Tab](#1-scripts-tab)
  - [Variables Tab](#2-variables-tab)
  - [Results Tab](#3-results-tab)
- [Creating and Managing Scripts](#creating-and-managing-scripts)
  - [Creating a New Script](#creating-a-new-script)
  - [Editing a Script](#editing-a-script)
  - [Organizing Scripts](#organizing-scripts)
  - [Deleting a Script](#deleting-a-script)
- [Using the Element Selector](#using-the-element-selector)
  - [Basic Selection](#basic-selection)
  - [Advanced Selection Techniques](#advanced-selection-techniques)
  - [Using XPath](#using-xpath)
  - [Selection Tips](#selection-tips)
- [Managing Variables](#managing-variables)
  - [Creating Variables](#creating-variables)
  - [Using Variables in Scripts](#using-variables-in-scripts)
  - [Variable Best Practices](#variable-best-practices)
  - [Editing and Deleting Variables](#editing-and-deleting-variables)
- [Running Scripts](#running-scripts)
  - [Basic Script Execution](#basic-script-execution)
  - [Script Execution Options](#script-execution-options)
- [Viewing Results](#viewing-results)
  - [Results Interface](#results-interface)
  - [Managing Results](#managing-results)
  - [Troubleshooting with Results](#troubleshooting-with-results)
- [Advanced Usage](#advanced-usage)
  - [Accessing and Manipulating DOM Elements](#accessing-and-manipulating-dom-elements)
  - [Traversing the DOM](#traversing-the-dom)
  - [Simulating User Actions](#simulating-user-actions)
  - [Handling Asynchronous Operations](#handling-asynchronous-operations)
  - [Working with Network Requests](#working-with-network-requests)
- [Troubleshooting](#troubleshooting)
  - [Common Issues and Solutions](#common-issues-and-solutions)
  - [Debugging Techniques](#debugging-techniques)
- [Tips and Best Practices](#tips-and-best-practices)
  - [Script Organization](#script-organization)
  - [Performance](#performance)
  - [Maintenance](#maintenance)
  - [Security](#security)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Exporting and Importing Scripts](#exporting-and-importing-scripts)
  - [Exporting Scripts](#exporting-scripts)
  - [Importing Scripts](#importing-scripts)
- [Conclusion](#conclusion)

## Overview

Console Script Manager is a Firefox extension that allows you to create, manage, and execute JavaScript scripts directly in the browser console. This guide will help you understand how to use all the features of the extension effectively.

![Console Script Manager Icon](icons/icon-48.svg)

This extension is designed for web developers, QA engineers, automation enthusiasts, data scrapers, and web researchers who need to interact with web pages programmatically.

## Getting Started

### Installation

1. **Install the extension** using one of the following methods:
   - **Firefox Add-ons Store**: Search for "Console Script Manager" and click "Add to Firefox"
   - **Manual Installation**: Follow the detailed instructions in the [INSTALLATION.md](INSTALLATION.md) file

### Initial Setup

1. **Click the extension icon** in the Firefox toolbar to open the popup interface
2. **Familiarize yourself** with the three main tabs: Scripts, Variables, and Results
3. **Create your first script** by clicking the "New Script" button

### Permissions

The extension requires the following permissions:
- **activeTab**: To interact with the current webpage
- **storage**: To save your scripts and variables
- **tabs**: To execute scripts in the current tab
- **<all_urls>**: To run scripts on any website you visit

## Interface Overview

The extension popup has a clean, intuitive interface with three main tabs:

### 1. Scripts Tab

![Scripts Tab](icons/icon-48.svg) *(Screenshot placeholder)*

- **Script List**: Displays all your saved scripts
- **New Script Button**: Creates a new script
- **Edit Button**: Modifies the selected script
- **Delete Button**: Removes the selected script
- **Run Button**: Executes the selected script on the current page
- **Script Editor**: Code editor with syntax highlighting
- **Element Selector Button**: Activates the visual element picker

### 2. Variables Tab

![Variables Tab](icons/icon-48.svg) *(Screenshot placeholder)*

- **Variable List**: Shows all defined variables with their names and values
- **New Variable Button**: Creates a new variable
- **Edit Button**: Modifies the selected variable
- **Delete Button**: Removes the selected variable
- **Variable Form**: Fields for entering variable name and value

### 3. Results Tab

![Results Tab](icons/icon-48.svg) *(Screenshot placeholder)*

- **Results List**: Shows execution history with timestamps
- **Result Details**: Displays console output and return values
- **Clear Results Button**: Removes all previous results

## Creating and Managing Scripts

### Creating a New Script

1. Open the extension popup by clicking the icon in the Firefox toolbar
2. Ensure you're on the **Scripts** tab
3. Click the **New Script** button
4. Enter a descriptive name for your script in the "Script Name" field
   - Use names that clearly indicate the script's purpose (e.g., "Fill Login Form")
5. Write your JavaScript code in the editor area
   - The editor supports syntax highlighting for better readability
   - You can use standard JavaScript syntax and browser APIs
   - See the [Examples](#advanced-usage) section for script templates
6. Click **Save** to store your script
   - Scripts are saved locally in your browser's storage

### Editing a Script

1. In the Scripts tab, click on a script in the list to select it
2. Click the **Edit** button
3. Make your changes to the script name or code
   - You can modify both the name and the code
   - Use the Element Selector if you need to add references to page elements
4. Click **Save** to update the script
   - The previous version will be overwritten

### Organizing Scripts

1. Use consistent naming conventions for related scripts
   - Example: "Amazon - Search Products", "Amazon - Extract Prices"
2. Consider adding version numbers or dates to script names if you make significant changes
   - Example: "Login Form Filler v2"

### Deleting a Script

1. In the Scripts tab, click on a script in the list to select it
2. Click the **Delete** button
3. Confirm the deletion when prompted
   - This action cannot be undone
   - Consider exporting important scripts before deletion (see [Advanced Usage](#advanced-usage))

## Using the Element Selector

The Element Selector is a powerful feature that allows you to visually select elements on a webpage and automatically generate the XPath code to reference them in your scripts.

### Basic Element Selection

1. While editing a script, position your cursor where you want to insert the element reference
2. Click the **Select Element** button in the script editor toolbar
3. The popup will close and you'll enter selection mode
   - You'll see a notification that selection mode is active
   - The cursor will change to indicate selection mode
4. Hover over elements on the page to see them highlighted
   - Elements will be outlined with a colored border
   - The element's tag name and attributes will be displayed in a tooltip
5. Click on an element to select it
   - The element will be highlighted with a different color to indicate selection
6. The extension will automatically generate the XPath code for the selected element
7. The popup will reopen with the XPath code inserted at your cursor position

### Advanced Selection Techniques

#### Selecting Specific Elements

- **Precise Selection**: Use the keyboard arrow keys while hovering to navigate between nested elements
- **Parent/Child Navigation**: Hold Shift while using arrow keys to move up (parent) or down (child) in the DOM tree

#### Working with XPath

The generated XPath will look something like this:

```javascript
const element = document.evaluate("/html/body/div[1]/main/article/section[2]/a[3]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
```

You can then use this element reference in your script to:
- Click the element: `element.click();`
- Get its text content: `const text = element.textContent;`
- Modify its attributes: `element.setAttribute('class', 'highlighted');`

#### Tips for Effective Element Selection

- Try to select elements with unique IDs or distinctive attributes
- Avoid selecting elements that might change position in the DOM
- For dynamic websites, consider using more robust selectors (see Advanced Usage section)

## Managing Variables

Variables allow you to make your scripts more flexible, reusable, and adaptable to different situations without modifying the script code.

### Creating Variables

1. Click the **Variables** tab in the extension popup
2. Click the **New Variable** button
3. Enter a descriptive name for your variable
   - Use camelCase naming convention (e.g., `searchTerm`, `loginUsername`)
   - Names must start with a letter and can contain letters, numbers, and underscores
   - Names are case-sensitive (`searchTerm` and `SearchTerm` are different variables)
4. Enter a value for your variable
   - Values can be strings, numbers, or boolean values
   - String values don't need quotes in the variable definition
5. Click **Save** to create the variable
   - The variable will appear in the variables list

### Using Variables in Scripts

To use a variable in your script, use the syntax `${variableName}` where you want the variable value to be inserted.

#### Example: Search Form

```javascript
// If you have a variable named "searchTerm" with value "Firefox"
const searchInput = document.querySelector('#search-input');
searchInput.value = '${searchTerm}';
searchInput.dispatchEvent(new Event('input'));
```

#### Example: Login Form

```javascript
// Using username and password variables
const usernameField = document.querySelector('#username');
const passwordField = document.querySelector('#password');

usernameField.value = '${username}';
passwordField.value = '${password}';

document.querySelector('#login-button').click();
```

When the script runs, all instances of `${variableName}` will be replaced with the current value of the corresponding variable.

### Variable Best Practices

1. **Use variables for values that might change**, such as:
   - Search terms
   - Usernames and passwords
   - URLs
   - Selector patterns
   - Configuration values

2. **Create descriptive variable names** that clearly indicate their purpose

3. **Update variable values** before running scripts on different websites or for different tasks

### Editing and Deleting Variables

1. In the Variables tab, find the variable you want to modify
2. Click **Edit** to change its name or value
   - Updating a variable will affect all scripts that use it
3. Click **Delete** to remove the variable
   - Scripts that reference deleted variables will show the variable placeholder as-is
   - Consider checking your scripts before deleting frequently used variables

## Running Scripts

### Basic Script Execution

1. Navigate to the webpage where you want to run your script
2. Open the extension popup by clicking the icon in the Firefox toolbar
3. Click on a script in the scripts list to select it
4. Click the **Run Script** button
5. The script will execute on the current page
   - The extension will inject your script into the page context
   - Any console output will be captured
   - The script will run with the same permissions as the webpage
6. View the execution results in the **Results** tab

### Script Execution Options

#### Before Running a Script

1. **Check the webpage**: Ensure you're on the correct page where the script should run
2. **Verify variables**: If your script uses variables, make sure they have the correct values
3. **Prepare the page state**: Some scripts may require the page to be in a specific state (e.g., a form to be visible)

#### During Script Execution

- The extension icon may show an indicator that a script is running
- For long-running scripts, the page will remain interactive
- Scripts run in the page context, not in the extension context

#### After Script Execution

- Check the Results tab for output and any errors
- The page state will reflect any changes made by the script
- You can run another script immediately if needed

## Viewing Results

The Results tab provides a detailed view of your script execution history and output:

### Results Interface

- **Results List**: Shows all executed scripts in chronological order
  - Each entry shows the script name and execution timestamp
  - Color coding indicates success (green) or errors (red)

- **Result Details**: When you select a result, you'll see:
  - **Console Output**: All console.log(), console.error(), console.warn(), and console.info() messages
  - **Return Value**: Any value explicitly returned by the script
  - **Execution Time**: How long the script took to run
  - **Error Details**: If the script encountered an error, you'll see the error message and stack trace

### Managing Results

- Results are stored locally in your browser
- Click the **Clear Results** button to remove all previous results
  - This action cannot be undone
  - Consider taking screenshots of important results before clearing

### Troubleshooting with Results

- If a script doesn't produce the expected outcome, check for error messages
- Add additional console.log() statements to your script to debug issues
- Compare results across different executions to identify patterns

## Advanced Usage

### Accessing and Manipulating DOM Elements

Use standard DOM methods to access and manipulate page elements with precision:

```javascript
// Finding elements with different selectors
const heading = document.querySelector('h1'); // First h1 element
const buttons = document.querySelectorAll('.btn'); // All elements with class 'btn'
const inputField = document.getElementById('search'); // Element with id 'search'
const formElements = document.forms[0].elements; // All elements in the first form
const tableRows = document.querySelectorAll('table tr'); // All table rows

// Using more complex CSS selectors
const nestedElement = document.querySelector('.container > .row > .column');
const specificInput = document.querySelector('input[type="email"][required]');
const thirdListItem = document.querySelectorAll('ul li')[2]; // 0-based index

// Modifying elements
heading.textContent = 'New Heading'; // Change text content
heading.innerHTML = 'New <em>Styled</em> Heading'; // Change HTML content (use with caution)
inputField.value = 'Search term'; // Change input value
buttons[0].style.backgroundColor = 'red'; // Change CSS style
buttons[0].classList.add('highlighted'); // Add a CSS class
buttons[0].setAttribute('disabled', 'true'); // Set an attribute
```

### Traversing the DOM

```javascript
// Navigate between elements
const parent = element.parentNode;
const children = element.children;
const nextSibling = element.nextElementSibling;
const previousSibling = element.previousElementSibling;

// Finding specific parent elements
function findParentWithClass(element, className) {
  let current = element;
  while (current && !current.classList.contains(className)) {
    current = current.parentElement;
  }
  return current;
}

// Example: Find the parent card of a button
const button = document.querySelector('.action-button');
const card = findParentWithClass(button, 'card');
```

### Simulating User Actions

```javascript
// Click interactions
document.querySelector('#submit-button').click(); // Simple click

// Creating and dispatching mouse events
const button = document.querySelector('#advanced-button');
const clickEvent = new MouseEvent('click', {
  bubbles: true,
  cancelable: true,
  view: window
});
button.dispatchEvent(clickEvent);

// Input text and trigger events
const input = document.querySelector('#username');
input.value = 'user123';

// Trigger input event (as user types)
input.dispatchEvent(new Event('input', { bubbles: true }));

// Trigger change event (after field loses focus)
input.dispatchEvent(new Event('change', { bubbles: true }));

// Focus and blur
document.querySelector('#password').focus();
document.querySelector('#username').blur();

// Select dropdown option
const select = document.querySelector('select#country');
select.value = 'US'; // Set by value
select.dispatchEvent(new Event('change', { bubbles: true }));

// Check/uncheck checkbox
const checkbox = document.querySelector('#terms');
checkbox.checked = true;
checkbox.dispatchEvent(new Event('change', { bubbles: true }));
```

### Handling Asynchronous Operations

Use async/await for operations that take time to complete:

```javascript
// Wait for an element to appear
async function waitForElement(selector, timeout = 10000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) {
      return element; // Element found
    }
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms before checking again
  }
  
  throw new Error(`Element ${selector} not found within ${timeout}ms`);
}

// Example: Wait for a dynamic element and click it
async function waitAndClick() {
  try {
    const element = await waitForElement('.dynamic-element');
    element.click();
    console.log('Element clicked successfully');
  } catch (error) {
    console.error(error.message);
  }
}

// Example: Wait for page to load completely
async function waitForPageLoad() {
  if (document.readyState === 'complete') {
    return;
  }
  
  return new Promise(resolve => {
    window.addEventListener('load', resolve);
  });
}

// Execute the function
waitAndClick();
```

### Working with Network Requests

```javascript
// Monitor fetch requests
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  console.log('Fetch request:', args[0]);
  const response = await originalFetch.apply(this, args);
  const responseClone = response.clone();
  responseClone.text().then(body => {
    console.log('Fetch response:', body.substring(0, 200) + '...');
  });
  return response;
};

// Make your own fetch request
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const data = await response.json();
    console.log('Fetched data:', data);
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
  }
}
```

## Troubleshooting

### Common Issues and Solutions

- **Script doesn't run**:
  - Make sure you're on the correct webpage and the script is selected
  - Check if the website has a Content Security Policy (CSP) that blocks scripts
  - Try running a simple `console.log('test')` script to verify basic functionality

- **Element not found**:
  - Check if your selectors are correct using browser DevTools (F12 > Elements)
  - Verify the elements exist when your script runs (they might load dynamically)
  - Use `waitForElement()` function for elements that load after the page
  - Try different selector methods (querySelector, getElementById, etc.)

- **Permission errors**:
  - Some websites restrict script execution; check the console for errors
  - Certain operations like file downloads may be restricted
  - Cross-origin requests may be blocked by the browser

- **Variables not working**:
  - Verify that variable names match exactly, including case
  - Check the Variables tab to ensure variables exist and have correct values
  - Make sure you're using the correct syntax: `${variableName}`

- **Script timing issues**:
  - Use async/await and the waitForElement function for dynamic content
  - Add delays with `await new Promise(resolve => setTimeout(resolve, 1000))`
  - Check if the script runs before the page is fully loaded

### Debugging Techniques

- Add `console.log()` statements to track script execution
- Use `console.error()` to highlight issues
- Check the Results tab for detailed error messages
- Use `try/catch` blocks to handle errors gracefully

## Tips and Best Practices

### Script Organization

- Keep scripts focused on a single task for better reusability
- Use descriptive names that indicate what the script does
- Group related scripts with similar naming conventions
- Add comments to explain complex operations

### Performance

- Minimize DOM operations, which can be slow
- Use `document.querySelectorAll()` once and cache the results instead of repeated queries
- Be cautious with loops on large collections
- Add delays between actions that might overload the page

### Maintenance

- Test scripts on different pages to ensure they work consistently
- Back up important scripts by exporting them regularly
- Document complex scripts with comments
- Use variables for values that might change

### Security

- Never store sensitive information in scripts or variables
- Be cautious when automating actions that involve personal data
- Respect website terms of service when automating interactions

## Keyboard Shortcuts

The Firefox Console Script Manager extension supports several keyboard shortcuts to improve your productivity:

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+Shift+F` | Open Extension | Opens the extension popup |
| `Ctrl+Enter` | Run Script | Runs the currently selected script |
| `Ctrl+S` | Save Script | Saves the current script edits |
| `Ctrl+N` | New Script | Creates a new script |
| `Esc` | Close Popup | Closes the extension popup |
| `Tab` | Navigate Fields | Move between fields in the interface |

> Note: On macOS, use `Cmd` instead of `Ctrl` for these shortcuts.

## Exporting and Importing Scripts

To back up your scripts or transfer them to another browser:

### Exporting Scripts

1. Open the extension popup
2. Click on the **Settings** icon (gear icon)
3. Select **Export Scripts**
4. Choose a location to save the JSON file containing your scripts

### Importing Scripts

1. Open the extension popup
2. Click on the **Settings** icon (gear icon)
3. Select **Import Scripts**
4. Select the JSON file containing your scripts
5. Confirm the import when prompted

> Note: Importing scripts will not overwrite existing scripts with the same name. Duplicate scripts will be imported with "(Copy)" added to their names.

## Conclusion

The Firefox Console Script Manager is a powerful tool for automating browser tasks, extracting data, and enhancing your browsing experience. By mastering the techniques described in this guide, you can create sophisticated scripts to handle a wide variety of web automation tasks.

Remember to:

- Start with simple scripts and gradually build more complex ones
- Use the element selector to accurately target page elements
- Leverage variables to make your scripts flexible and reusable
- Check the Results tab for debugging information
- Back up your scripts regularly using the export feature

For additional help, example scripts, or to report issues, visit the [extension's support page](https://github.com/yourusername/firefox-console-script-manager/issues) or refer to the examples directory in the project repository.