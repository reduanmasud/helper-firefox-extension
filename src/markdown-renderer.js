import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked for enhanced security and features
const renderer = new marked.Renderer();

// Custom table renderer with enhanced styling
renderer.table = function(header, body) {
  return `<table>
    <thead>${header}</thead>
    <tbody>${body}</tbody>
  </table>`;
};

renderer.tablerow = function(content) {
  return `<tr>${content}</tr>`;
};

renderer.tablecell = function(content, flags) {
  const type = flags.header ? 'th' : 'td';
  const align = flags.align ? ` style="text-align: ${flags.align}"` : '';
  return `<${type}${align}>${content}</${type}>`;
};

// Custom blockquote renderer
renderer.blockquote = function(quote) {
  return `<blockquote>${quote}</blockquote>`;
};

// Custom horizontal rule renderer
renderer.hr = function() {
  return '<hr>';
};

// Custom code block renderer
renderer.code = function(code, language) {
  const validLanguage = language && /^[a-zA-Z0-9-_]+$/.test(language);
  const langClass = validLanguage ? ` class="language-${language}"` : '';
  return `<pre><code${langClass}>${code}</code></pre>`;
};

// Custom inline code renderer
renderer.codespan = function(code) {
  return `<code>${code}</code>`;
};

// Configure marked options
marked.setOptions({
  renderer: renderer,
  gfm: true,           // GitHub Flavored Markdown
  tables: true,        // Enable table support
  breaks: false,       // Don't convert \n to <br>
  pedantic: false,     // Don't be pedantic about original markdown
  sanitize: false,     // We'll use DOMPurify instead
  smartLists: true,    // Use smarter list behavior
  smartypants: false,  // Don't use smart quotes
  xhtml: false         // Don't use XHTML
});

// Configure DOMPurify for XSS protection
const purifyConfig = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'strong', 'em', 'del', 'code', 'pre',
    'ul', 'ol', 'li',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'blockquote', 'hr', 'a'
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'class', 'style'
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  SANITIZE_DOM: true
};

/**
 * Enhanced markdown renderer using marked.js with XSS protection
 * @param {string} text - The markdown text to render
 * @returns {string} - The rendered and sanitized HTML
 */
function renderMarkdown(text) {
  if (!text || typeof text !== 'string') {
    return text || '';
  }

  try {
    // Parse markdown with marked
    const rawHtml = marked.parse(text);
    
    // Sanitize the HTML with DOMPurify
    const cleanHtml = DOMPurify.sanitize(rawHtml, purifyConfig);
    
    return cleanHtml;
  } catch (error) {
    console.error('Error rendering markdown:', error);
    // Fallback to escaped text
    return text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/\n/g, '<br>');
  }
}

/**
 * Test function to verify markdown rendering capabilities
 * @returns {Object} - Test results
 */
function testMarkdownFeatures() {
  const testCases = {
    table: `| Feature | Status | Notes |
|---------|:------:|-------|
| Tables | ✅ Working | With alignment |
| Strikethrough | ~~Working~~ | Uses del tag |`,
    
    strikethrough: 'This is ~~strikethrough~~ text.',
    blockquote: '> This is a blockquote with **bold** text.',
    hr: 'Above\n\n---\n\nBelow',
    code: 'Here is `inline code` and:\n\n```javascript\nconst test = "code block";\n```'
  };

  const results = {};
  
  Object.keys(testCases).forEach(testName => {
    try {
      const html = renderMarkdown(testCases[testName]);
      results[testName] = {
        success: true,
        html: html,
        hasExpectedElements: checkExpectedElements(testName, html)
      };
    } catch (error) {
      results[testName] = {
        success: false,
        error: error.message
      };
    }
  });

  return results;
}

/**
 * Check if rendered HTML contains expected elements for each test
 * @param {string} testName - Name of the test
 * @param {string} html - Rendered HTML
 * @returns {boolean} - Whether expected elements are present
 */
function checkExpectedElements(testName, html) {
  switch (testName) {
    case 'table':
      return html.includes('<table>') && html.includes('<thead>') && html.includes('<tbody>');
    case 'strikethrough':
      return html.includes('<del>');
    case 'blockquote':
      return html.includes('<blockquote>');
    case 'hr':
      return html.includes('<hr>');
    case 'code':
      return html.includes('<code>') && html.includes('<pre>');
    default:
      return true;
  }
}

// Export functions for use in the extension
window.MarkdownRenderer = {
  renderMarkdown,
  testMarkdownFeatures
};

// Also export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { renderMarkdown, testMarkdownFeatures };
}
