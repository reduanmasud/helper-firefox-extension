# Console Script Manager - Firefox Extension

Console Script Manager is a Firefox extension that allows you to create, manage, and execute JavaScript scripts directly in the browser console. It provides a user-friendly interface for selecting DOM elements, capturing XPaths, defining variables, and running custom scripts on any webpage.

## Features

- **Script Management**: Create, edit, save, and delete JavaScript scripts with descriptive names
- **Element Selection**: Visual element picker that generates XPath expressions for selected elements
- **Variable Management**: Create and manage variables to use within your scripts
- **Script Execution**: Run scripts on any webpage with a single click
- **Results Tracking**: View execution results and history

## Installation

### Development Installation

1. Clone this repository or download the source code
2. Open Firefox and navigate to `about:debugging`
3. Click on "This Firefox" in the left sidebar
4. Click "Load Temporary Add-on..."
5. Select the `manifest.json` file from the project directory

### Production Installation

Once the extension is published to the Firefox Add-ons store:

1. Visit the extension page on [Firefox Add-ons](https://addons.mozilla.org/)
2. Click "Add to Firefox"

## Usage

### Creating a Script

1. Click the extension icon in the toolbar to open the popup
2. Click the "New Script" button
3. Enter a name for your script
4. Write your JavaScript code in the editor
5. To select an element from the page:
   - Click the "Select Element" button
   - The popup will close and you'll enter selection mode
   - Hover over elements on the page and click to select
   - The element's XPath will be added to your script
6. Click "Save" to save your script

### Managing Variables

1. Click the "Variables" tab in the extension popup
2. Click "New Variable" to create a variable
3. Enter a name and value for the variable
4. Click "Save" to save the variable
5. Use variables in your scripts with the syntax `${variableName}`

### Running Scripts

1. Navigate to the webpage where you want to run your script
2. Click the extension icon to open the popup
3. Select a script from the list
4. Click "Run Script" to execute it
5. View the results in the "Results" tab

## Development

### Project Structure

```
/
├── manifest.json        # Extension manifest
├── icons/               # Extension icons
│   ├── icon-48.svg
│   └── icon-96.svg
├── popup/               # Popup UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── background/          # Background scripts
│   └── background.js
├── content/             # Content scripts
│   └── content.js
├── examples/            # Example scripts
│   └── example-scripts.md
└── dist/                # Build output directory
    └── console_script_manager-1.0.zip
```

### Building for Production

1. Ensure all files are in place and properly configured
2. Install dependencies with `npm install`
3. Run the build script with `npm run build`
4. The built extension will be available in the `dist` directory
5. Submit the ZIP file from the `dist` directory to the Firefox Add-ons store for review

### Development Commands

- `npm run build` - Build the extension for production
- `npm run lint` - Run linting checks on the extension code

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please open an issue on the GitHub repository.