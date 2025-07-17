module.exports = {
  // Global options:
  sourceDir: '.',
  artifactsDir: './dist',
  
  // Command options:
  build: {
  },
  run: {
    firefox: 'firefox',
    browserConsole: true,
    startUrl: ['about:debugging#/runtime/this-firefox'],
  },
  lint: {
    warningsAsErrors: false,
    selfHosted: true,
  },
};