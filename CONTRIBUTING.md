# 🤝 Contributing to ScriptForge Inspector

Thank you for your interest in contributing to ScriptForge Inspector! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Documentation](#documentation)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our commitment to creating a welcoming and inclusive environment. By participating, you are expected to uphold this standard.

### Our Standards

- **Be respectful** and inclusive in your language and actions
- **Be collaborative** and help others learn and grow
- **Be constructive** when giving feedback
- **Focus on what is best** for the community and the project

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) (v8 or higher)
- [Git](https://git-scm.com/)
- Firefox Developer Edition (recommended for testing)

### First Contribution

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/scriptforge-inspector.git
   cd scriptforge-inspector
   ```
3. **Create a branch** for your contribution:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** and commit them
5. **Push to your fork** and create a pull request

## 🛠️ Development Setup

### Installation

```bash
# Install dependencies
npm install

# Build the extension
npm run build:bundles
npm run build

# Run in development mode
npm run dev
```

### Project Structure

```
scriptforge-inspector/
├── 📄 manifest.json              # Extension manifest
├── 🖥️ sidebar/                   # Main UI components
├── ⚙️ background/                # Background scripts
├── 🔧 content/                   # Content scripts
├── 📝 editor/                    # Code editor components
├── 🔨 src/                       # Source files
├── 📦 dist/                      # Build output
└── 🧪 test files/                # Test and demo files
```

## 📝 Contributing Guidelines

### Types of Contributions

We welcome several types of contributions:

- **🐛 Bug fixes** - Help us squash bugs
- **✨ New features** - Add functionality for test engineers
- **📚 Documentation** - Improve our docs
- **🧪 Testing** - Add or improve tests
- **🎨 UI/UX improvements** - Enhance user experience
- **⚡ Performance** - Make things faster

### Coding Standards

- **JavaScript**: Follow ESLint configuration
- **HTML/CSS**: Use semantic HTML and consistent styling
- **Comments**: Document complex logic and public APIs
- **Naming**: Use descriptive variable and function names
- **File organization**: Keep related code together

### Commit Messages

Use clear, descriptive commit messages:

```
type(scope): description

Examples:
feat(inspector): add Playwright locator generation
fix(analyzer): resolve markdown table rendering issue
docs(readme): update installation instructions
test(scripts): add unit tests for script execution
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `style`, `chore`

## 🔄 Pull Request Process

### Before Submitting

1. **Test your changes** thoroughly
2. **Run the linter**: `npm run lint`
3. **Build successfully**: `npm run build`
4. **Update documentation** if needed
5. **Add tests** for new functionality

### PR Requirements

- **Clear description** of changes
- **Link to related issues**
- **Screenshots** for UI changes
- **Test results** and verification steps
- **Updated documentation** if applicable

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by maintainers
3. **Testing verification** in Firefox
4. **Documentation review** if applicable
5. **Final approval** and merge

## 🐛 Issue Reporting

### Bug Reports

Use the bug report template and include:

- **Clear description** of the issue
- **Steps to reproduce** the problem
- **Expected vs actual behavior**
- **Environment details** (OS, Firefox version, etc.)
- **Console errors** if applicable
- **Screenshots** when helpful

### Feature Requests

Use the feature request template and include:

- **Problem statement** you're trying to solve
- **Proposed solution** with details
- **Use case** for test engineers
- **Priority level** and impact
- **Alternative solutions** considered

## 🔧 Development Workflow

### Branch Strategy

- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/**: New features and enhancements
- **fix/**: Bug fixes
- **docs/**: Documentation updates

### Development Process

1. **Create feature branch** from `develop`
2. **Implement changes** with tests
3. **Test thoroughly** in Firefox
4. **Update documentation** as needed
5. **Submit pull request** to `develop`
6. **Address review feedback**
7. **Merge after approval**

### Release Process

1. **Merge develop to main** for releases
2. **Tag release** with version number
3. **GitHub Actions** builds and publishes
4. **Update changelog** and documentation

## 🧪 Testing

### Manual Testing

- **Load extension** in Firefox development mode
- **Test all tabs** and features
- **Verify on different websites**
- **Check console** for errors
- **Test edge cases** and error conditions

### Automated Testing

- **Linting**: `npm run lint`
- **Build verification**: `npm run build`
- **Extension validation**: `npx web-ext lint`

### Testing Checklist

- [ ] Extension loads without errors
- [ ] All tabs function correctly
- [ ] Element selection works
- [ ] Script execution succeeds
- [ ] AI analysis features work (with API keys)
- [ ] No console errors
- [ ] Responsive design works

## 📚 Documentation

### What to Document

- **New features** and how to use them
- **API changes** and breaking changes
- **Configuration options** and settings
- **Troubleshooting** common issues
- **Examples** and use cases

### Documentation Standards

- **Clear and concise** language
- **Step-by-step instructions** where applicable
- **Code examples** with proper formatting
- **Screenshots** for UI features
- **Links** to related documentation

## 🎯 Focus Areas for Test Engineers

We especially welcome contributions that help test engineers:

### High-Priority Areas

- **Locator generation** improvements
- **Test automation** workflow enhancements
- **Playwright integration** features
- **Script templates** for common testing scenarios
- **AI analysis** prompts for QA use cases

### Feature Ideas

- **Test case generation** from user interactions
- **Cross-browser** locator compatibility
- **Test data management** features
- **Integration** with popular testing frameworks
- **Reporting** and analytics features

## 🆘 Getting Help

### Resources

- **📖 Documentation**: Check the README and user manual
- **🐛 Issues**: Search existing issues for solutions
- **💬 Discussions**: Use GitHub Discussions for questions
- **📧 Contact**: Reach out to [@reduanmasud](https://github.com/reduanmasud)

### Community

- **Be patient** - maintainers are volunteers
- **Be specific** when asking questions
- **Share context** about your use case
- **Help others** when you can

## 🙏 Recognition

Contributors will be recognized in:

- **README.md** contributors section
- **Release notes** for significant contributions
- **GitHub contributors** page
- **Special thanks** in documentation

## 📄 License

By contributing to ScriptForge Inspector, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to ScriptForge Inspector!** 🎉

Your contributions help make testing easier and more efficient for the entire QA community.

*Made with ❤️ by [MD. REDUAN MASUD](https://github.com/reduanmasud) - Software Test Engineer @ Startise in xCloud*
