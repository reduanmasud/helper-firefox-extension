const esbuild = require('esbuild');
const path = require('path');

// Build configuration for the markdown library bundle
const buildMarkdownBundle = async () => {
  try {
    await esbuild.build({
      entryPoints: ['src/markdown-renderer.js'],
      bundle: true,
      outfile: 'sidebar/markdown-renderer.bundle.js',
      format: 'iife',
      globalName: 'MarkdownRenderer',
      platform: 'browser',
      target: 'es2020',
      minify: true,
      sourcemap: false,
      external: [], // Bundle everything
      define: {
        'process.env.NODE_ENV': '"production"'
      }
    });
    console.log('✅ Markdown bundle built successfully');
  } catch (error) {
    console.error('❌ Error building markdown bundle:', error);
    process.exit(1);
  }
};

// Build configuration for the CodeMirror bundle (existing)
const buildCodeMirrorBundle = async () => {
  try {
    await esbuild.build({
      entryPoints: ['editor/codemirror.js'],
      bundle: true,
      outfile: 'editor/codemirror.bundle.js',
      format: 'esm',
      platform: 'browser',
      target: 'es2020',
      minify: true,
      sourcemap: false,
      external: []
    });
    console.log('✅ CodeMirror bundle built successfully');
  } catch (error) {
    console.error('❌ Error building CodeMirror bundle:', error);
    process.exit(1);
  }
};

// Main build function
const build = async () => {
  console.log('🔨 Building QA Tools bundles...');

  await Promise.all([
    buildMarkdownBundle(),
    buildCodeMirrorBundle()
  ]);

  console.log('🎉 QA Tools bundles built successfully!');
};

// Run build if this file is executed directly
if (require.main === module) {
  build().catch(error => {
    console.error('❌ Build failed:', error);
    process.exit(1);
  });
}

module.exports = { build, buildMarkdownBundle, buildCodeMirrorBundle };
