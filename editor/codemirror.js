// editor/codemirror.js

import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { basicSetup } from "codemirror"; // v6 basic setup
import { javascript } from "@codemirror/lang-javascript";

let editorView = null;

export function initCodeEditor(containerId, initialCode = '') {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Destroy old instance
    if (editorView) {
        editorView.destroy();
    }

    editorView = new EditorView({
        state: EditorState.create({
            doc: initialCode,
            extensions: [basicSetup, javascript()]
        }),
        parent: container
    });
}

export function getCodeValue() {
    return editorView ? editorView.state.doc.toString() : '';
}

export function destroyEditor() {
    if (editorView) {
        editorView.destroy();
        editorView = null;
    }
}

export function insertTextAtCursor(text) {
    if (!editorView) return;

    const transaction = editorView.state.update({
        changes: {
            from: editorView.state.selection.main.head,
            insert: text
        },
        selection: {
            anchor: editorView.state.selection.main.head + text.length
        }
    });

    editorView.dispatch(transaction);
    editorView.focus();
}

export function getCursorPosition() {
    return editorView ? editorView.state.selection.main.head : 0;
}

export function setCursorPosition(pos) {
    if (!editorView) return;

    editorView.dispatch({
        selection: { anchor: pos, head: pos }
    });
}

export function focusEditor() {
    if (editorView) {
        editorView.focus();
    }
}

export function getSelectedText() {
    if (!editorView) return '';

    const selection = editorView.state.selection.main;
    return editorView.state.doc.sliceString(selection.from, selection.to);
}

export function replaceSelection(text) {
    if (!editorView) return;

    const transaction = editorView.state.update({
        changes: {
            from: editorView.state.selection.main.from,
            to: editorView.state.selection.main.to,
            insert: text
        }
    });

    editorView.dispatch(transaction);
}


// Snippet Editor
// Global variable for snippet editor
let snippetEditorView = null;

export function initSnippetEditor(containerId, initialCode = '') {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Destroy old instance
    if (snippetEditorView) {
        snippetEditorView.destroy();
    }

    snippetEditorView = new EditorView({
        state: EditorState.create({
            doc: initialCode,
            extensions: [
                basicSetup,
                javascript(),
                EditorView.editable.of(false), // Make readonly
                EditorState.readOnly.of(true)  // Additional readonly protection
            ]
        }),
        parent: container
    });
}

export function updateSnippetContent(content) {
    if (!snippetEditorView) return;
    
    const transaction = snippetEditorView.state.update({
        changes: {
            from: 0,
            to: snippetEditorView.state.doc.length,
            insert: content
        }
    });
    
    snippetEditorView.dispatch(transaction);
}

export function getSnippetContent() {
    return snippetEditorView ? snippetEditorView.state.doc.toString() : '';
}

export function destroySnippetEditor() {
    if (snippetEditorView) {
        snippetEditorView.destroy();
        snippetEditorView = null;
    }
}