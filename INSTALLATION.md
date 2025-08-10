# Installation Guide for ScriptForge Inspector

## Development Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (v6 or higher)
- [Firefox](https://www.mozilla.org/firefox/) browser

### Steps

1. **Clone or download the repository**

   ```bash
   git clone <repository-url>
   cd scriptforge-inspector
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the extension in development mode**

   ```bash
   npm start
   ```

   This will launch Firefox with the extension temporarily installed.

4. **Build the extension**

   ```bash
   npm run build
   ```

   This will create a `.zip` file in the `dist` directory that can be submitted to the Firefox Add-ons store.

## Manual Installation

1. **Download the latest release**

   Download the latest `.xpi` file from the releases page.

2. **Install in Firefox**

   - Open Firefox
   - Navigate to `about:addons`
   - Click the gear icon and select "Install Add-on From File..."
   - Select the downloaded `.xpi` file

## Temporary Installation for Testing

1. **Open Firefox**
2. **Navigate to `about:debugging#/runtime/this-firefox`**
3. **Click "Load Temporary Add-on..."**
4. **Select the `manifest.json` file from the project directory**

## Troubleshooting

### Extension not appearing in toolbar

- Right-click on the Firefox toolbar
- Select "Customize..."
- Find the ScriptForge Inspector icon and drag it to your toolbar

### Element selection not working

- Make sure you have allowed the extension to access the website
- Some websites with strict Content Security Policy (CSP) may block content scripts

### Script execution errors

- Check the browser console for error messages
- Ensure your script is compatible with the website's environment
- Some websites may block script execution through CSP

## Updating

### Development version

1. Pull the latest changes from the repository
   ```bash
   git pull
   ```

2. Reinstall the extension using the steps above

### Released version

Firefox will automatically update the extension when new versions are released.