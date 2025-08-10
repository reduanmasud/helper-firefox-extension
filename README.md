# ScriptForge Inspector - Firefox Extension

<div align="center">

![ScriptForge Inspector Logo](icons/icon-96.svg)

**A powerful Firefox extension designed for test engineers**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/reduanmasud/scriptforge-inspector)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Firefox](https://img.shields.io/badge/firefox-compatible-orange.svg)](https://www.mozilla.org/firefox/)

</div>

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [User Manual](#user-manual)
- [Development](#development)
- [Project Structure](#project-structure)
- [Author](#author)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## 🔍 Overview

ScriptForge Inspector is a comprehensive Firefox extension designed specifically for test engineers and QA professionals. It provides a powerful toolkit for creating, managing, and executing JavaScript scripts with advanced element inspection capabilities, AI-powered content analysis, and robust automation features for testing workflows.

### 🎯 Perfect for:
- **Test Engineers** - Automate testing workflows and element interactions
- **QA Professionals** - Streamline quality assurance processes
- **Test Automation Engineers** - Generate and test locators for automation frameworks
- **Manual Testers** - Transition to automation with guided tools
- **Web Developers** - Debug and analyze web applications

## ✨ Features

### 🔧 **Core Features**
- **Script Management**: Create, edit, save, and delete JavaScript scripts with syntax highlighting
- **Advanced Element Inspection**: Click on any webpage element to capture XPath and Playwright locators
- **Variable Management**: Define and use variables in scripts with placeholder syntax
- **Script Execution**: Run scripts directly in the browser console with real-time output
- **Results History**: View and manage execution results with timestamps and status indicators

### 🚀 **Advanced Features**
- **AI-Powered Content Analysis**: Extract and analyze webpage content using AI
- **Markdown Rendering**: Rich text formatting with table support for analysis results
- **Playwright Locator Generation**: Generate multiple locator strategies for robust automation
- **Code Snippet Generation**: Auto-generate Playwright test code snippets
- **XPath Validation**: Test and validate XPath expressions in real-time

### 🎨 **User Experience**
- **Intuitive Interface**: Clean, professional design optimized for testing workflows
- **Responsive Design**: Works seamlessly across different screen sizes
- **Dark/Light Theme**: Adapts to your Firefox theme preferences
- **Keyboard Shortcuts**: Efficient navigation and operation
- **Beta Features**: Inspector tab with cutting-edge functionality

## 📦 Installation

### 🔧 System Requirements

- **Firefox**: Version 78 or higher
- **Operating System**: Windows, macOS, or Linux
- **Memory**: Minimum 4GB RAM recommended
- **Storage**: 50MB free space

### 🚀 Production Installation (Recommended)

> **Note**: Currently in development. Will be available on Firefox Add-ons store soon.

1. Visit the [Firefox Add-ons Store](https://addons.mozilla.org/)
2. Search for "ScriptForge Inspector"
3. Click "Add to Firefox"
4. Confirm installation when prompted
5. The extension icon will appear in your toolbar

### 🛠️ Development Installation

#### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) (v8 or higher)
- [Git](https://git-scm.com/) (optional, for cloning)

#### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/reduanmasud/scriptforge-inspector.git
   cd scriptforge-inspector
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Firefox**
   - Open Firefox and navigate to `about:debugging`
   - Click "This Firefox" in the left sidebar
   - Click "Load Temporary Add-on..."
   - Select the `manifest.json` file from the project directory

### 📁 Manual Installation from Source

1. **Download the latest release**
   - Go to [Releases](https://github.com/reduanmasud/scriptforge-inspector/releases)
   - Download `scriptforge-inspector-x.x.x.zip`

2. **Install in Firefox**
   - Open Firefox and navigate to `about:debugging`
   - Click "This Firefox"
   - Click "Load Temporary Add-on..."
   - Select the downloaded ZIP file

## 📖 User Manual

### 🚀 Getting Started

After installation, you'll see the ScriptForge Inspector icon in your Firefox toolbar. Click it to open the sidebar interface.

### 📝 Scripts Tab

The Scripts tab is your main workspace for creating and managing JavaScript automation scripts.

#### Creating a New Script

1. **Open the Scripts Tab**
   - Click the ScriptForge Inspector icon in your toolbar
   - The Scripts tab should be active by default

2. **Create New Script**
   - Click the "New Script" button
   - Enter a descriptive name (e.g., "Login Test", "Form Validation")
   - The code editor will appear with syntax highlighting

3. **Write Your Script**
   ```javascript
   // Example: Click a button and verify text
   const button = document.querySelector('#submit-btn');
   button.click();
   
   // Use variables with ${variableName} syntax
   const username = '${testUsername}';
   document.querySelector('#username').value = username;
   ```

4. **Use Element Selection**
   - Click "Select Element" button
   - Your cursor will change to a crosshair
   - Click on any element on the webpage
   - The XPath will be automatically inserted into your script

5. **Save Your Script**
   - Click "Save" to store your script
   - Scripts are saved locally in your browser

#### Running Scripts

1. **Select a Script**
   - Choose from your saved scripts list
   - The script details will appear

2. **Execute**
   - Click "Run Script"
   - The script runs in the current tab's context
   - Results appear in the execution panel

#### Managing Scripts

- **Edit**: Click the "Edit" button to modify existing scripts
- **Delete**: Remove scripts you no longer need
- **Duplicate**: Copy scripts as templates for new ones

### 🔍 Analyzer Tab

The Analyzer tab provides AI-powered content analysis capabilities.

#### Content Extraction

1. **Inspect Elements**
   - Click "Inspect Element"
   - Select any element on the webpage
   - Content is automatically extracted

2. **AI Analysis**
   - Choose from preset analysis templates:
     - **Issue Analysis**: Identify problems and solutions
     - **Bug Investigation**: Root cause analysis
     - **Code Review**: Security and best practices check
     - **Performance Analysis**: Optimization suggestions

3. **Custom Analysis**
   - Select "Custom" from the dropdown
   - Write your own analysis instructions
   - Get tailored insights for your specific needs

#### Analysis Results

Results are displayed with rich markdown formatting including:
- **Tables**: Structured data presentation
- **Code blocks**: Syntax-highlighted code examples
- **Lists**: Organized information
- **Emphasis**: Bold and italic text for important points

### 🔧 Inspector Tab (BETA)

The Inspector tab offers advanced element inspection tools.

#### Element Selection

1. **Start Selection**
   - Click "Select Element"
   - Hover over webpage elements
   - Elements are highlighted as you move your cursor

2. **Locator Generation**
   - **XPath Mode**: Generates XPath expressions
   - **Playwright Mode**: Creates multiple locator strategies
     - `getByRole()`
     - `getByText()`
     - `getByTestId()`
     - `getByLabel()`

3. **Code Generation**
   - Click "Generate Code Snippet"
   - Get ready-to-use Playwright test code
   - Copy snippets directly to your test files

#### Locator Testing

- **Test Locator**: Verify locators work correctly
- **Highlight Elements**: Visual confirmation of selected elements
- **Multiple Strategies**: Fallback options for robust automation

### ⚙️ Settings Tab

Configure API keys for AI-powered features.

#### API Configuration

1. **OpenRouter API**
   - Enter your OpenRouter API key
   - Select your preferred model
   - Supports multiple AI providers

2. **OpenAI API**
   - Direct OpenAI integration
   - Choose from GPT models
   - Optimized for analysis tasks

### 🔧 Common Use Cases for Test Engineers

#### 1. **Automated Form Testing**
```javascript
// Fill and submit a login form
document.querySelector('#username').value = '${testUser}';
document.querySelector('#password').value = '${testPass}';
document.querySelector('#login-btn').click();

// Verify success
const successMsg = document.querySelector('.success-message');
console.log('Login successful:', successMsg ? 'Yes' : 'No');
```

#### 2. **Element Validation**
```javascript
// Check if required elements exist
const requiredElements = [
  '#header-logo',
  '.navigation-menu',
  '#main-content',
  '.footer-links'
];

requiredElements.forEach(selector => {
  const element = document.querySelector(selector);
  console.log(`${selector}: ${element ? 'Found' : 'Missing'}`);
});
```

#### 3. **Performance Testing**
```javascript
// Measure page load performance
const perfData = performance.getEntriesByType('navigation')[0];
console.log('Page Load Time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
console.log('DOM Content Loaded:', perfData.domContentLoadedEventEnd - perfData.fetchStart, 'ms');
```

### 🔧 Troubleshooting

#### Common Issues

**Script Not Running**
- Ensure you're on the correct webpage
- Check browser console for JavaScript errors
- Verify script syntax is correct

**Element Selection Not Working**
- Refresh the webpage and try again
- Check if the page has finished loading
- Some dynamic content may need time to load

**AI Analysis Not Working**
- Verify API keys are configured in Settings
- Check your internet connection
- Ensure you have API credits/quota available

**Extension Not Loading**
- Restart Firefox
- Check if extension is enabled in `about:addons`
- Try reinstalling the extension

#### Getting Help

1. **Check Console**: Open Firefox Developer Tools (F12) for error messages
2. **GitHub Issues**: Report bugs at [GitHub Issues](https://github.com/reduanmasud/scriptforge-inspector/issues)
3. **Documentation**: Review this manual for detailed instructions

## 🛠️ Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [npm](https://www.npmjs.com/) (v8+)
- Firefox Developer Edition (recommended)

### Development Commands

```bash
# Install dependencies
npm install

# Build bundles only
npm run build:bundles

# Build complete extension
npm run build

# Run in development mode
npm run dev

# Lint code
npm run lint
```

### Development Workflow

1. **Make Changes**: Edit source files
2. **Build**: Run `npm run build:bundles`
3. **Test**: Use `about:debugging` to reload extension
4. **Debug**: Use Firefox Developer Tools
5. **Build Release**: Run `npm run build` for production

## 📁 Project Structure

```
scriptforge-inspector/
├── 📄 manifest.json              # Extension manifest
├── 🎨 icons/                     # Extension icons
│   ├── icon-48.svg
│   └── icon-96.svg
├── 🖥️ sidebar/                   # Main UI
│   ├── sidebar.html
│   ├── sidebar.css
│   ├── sidebar.js
│   └── markdown-renderer.bundle.js
├── ⚙️ background/                # Background scripts
│   └── background.js
├── 🔧 content/                   # Content scripts
│   └── content.js
├── 📝 editor/                    # Code editor
│   ├── codemirror.js
│   └── codemirror.bundle.js
├── 🔨 src/                       # Source files
│   └── markdown-renderer.js
├── 📦 dist/                      # Build output
│   └── scriptforge-inspector-1.0.zip
├── 🧪 test files/                # Test and demo files
├── 📋 package.json               # Dependencies
├── 🔧 build.js                   # Build configuration
└── ⚙️ web-ext-config.cjs         # Web-ext configuration
```

## 👨‍💻 Author

**MD. REDUAN MASUD**
- 🏢 **Position**: Software Test Engineer @ Startise in xCloud
- 🐙 **GitHub**: [http://github.com/reduanmasud](http://github.com/reduanmasud)
- 💼 **Specialization**: Test Automation, Quality Assurance, Web Testing
- 🌟 **Expertise**: JavaScript, Test Frameworks, Browser Automation

### About the Author

Reduan is a passionate Software Test Engineer with extensive experience in test automation and quality assurance. Working at Startise in xCloud, he specializes in creating robust testing solutions and tools that help teams deliver high-quality software. ScriptForge Inspector was born from his daily experience with testing challenges and the need for better tooling in the QA workflow.

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

1. **🐛 Bug Reports**: Found a bug? [Open an issue](https://github.com/reduanmasud/scriptforge-inspector/issues)
2. **💡 Feature Requests**: Have an idea? We'd love to hear it!
3. **📝 Documentation**: Help improve our docs
4. **🔧 Code Contributions**: Submit pull requests

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- Use ESLint configuration provided
- Follow existing code patterns
- Add comments for complex logic
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### MIT License Summary

- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ❌ Liability
- ❌ Warranty

## 🆘 Support

### Getting Help

1. **📖 Documentation**: Start with this README and user manual
2. **🐛 Issues**: [GitHub Issues](https://github.com/reduanmasud/scriptforge-inspector/issues) for bugs and feature requests
3. **💬 Discussions**: [GitHub Discussions](https://github.com/reduanmasud/scriptforge-inspector/discussions) for questions and community support
4. **📧 Contact**: Reach out to the author for specific inquiries

### Reporting Issues

When reporting issues, please include:
- Firefox version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Console error messages (if any)
- Screenshots (if applicable)

---

<div align="center">

**Made with ❤️ for the testing community**

[⭐ Star this project](https://github.com/reduanmasud/scriptforge-inspector) | [🐛 Report Bug](https://github.com/reduanmasud/scriptforge-inspector/issues) | [💡 Request Feature](https://github.com/reduanmasud/scriptforge-inspector/issues)

</div>
