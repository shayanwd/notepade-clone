$(document).ready(function() {
    const editor = $('#editor');
    let undoStack = [];
    let redoStack = [];
    let fontSize = 14; // Base font size for zoom

    // Update counts
    function updateCounts() {
        const text = editor.val();
        $('#charCount').text(`Characters: ${text.length}`);
        $('#wordCount').text(`Words: ${text.trim() === '' ? 0 : text.trim().split(/\s+/).length}`);
        $('#lineCount').text(`Lines: ${text.split('\n').length}`);
    }

    // Save current state for undo
    function saveState() {
        undoStack.push(editor.val());
        redoStack = []; // Clear redo stack when new changes are made
        if (undoStack.length > 100) undoStack.shift(); // Limit stack size
    }

    // Event listeners
    editor.on('input', function() {
        updateCounts();
        saveState();
    });

    // New file
    $('#newFile').click(function() {
        if (confirm('Are you sure? Any unsaved changes will be lost.')) {
            editor.val('');
            updateCounts();
        }
    });

    // Open file
    $('#openFile').click(function() {
        $('#fileInput').click();
    });

    $('#fileInput').change(function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                editor.val(e.target.result);
                updateCounts();
            };
            reader.readAsText(file);
        }
    });

    // Save file
    $('#saveFile').click(function() {
        const content = editor.val();
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'notepad.txt';
        a.click();
        window.URL.revokeObjectURL(url);
    });

    // Undo
    $('#undoBtn').click(function() {
        if (undoStack.length > 0) {
            redoStack.push(editor.val());
            editor.val(undoStack.pop());
            updateCounts();
        }
    });

    // Redo
    $('#redoBtn').click(function() {
        if (redoStack.length > 0) {
            undoStack.push(editor.val());
            editor.val(redoStack.pop());
            updateCounts();
        }
    });

    // Dark mode toggle
    $('#darkMode').click(function() {
        $('body').toggleClass('dark-mode');
    });

    // Auto-save to localStorage
    setInterval(function() {
        localStorage.setItem('notepadContent', editor.val());
    }, 30000); // Save every 30 seconds

    // Load saved content
    const savedContent = localStorage.getItem('notepadContent');
    if (savedContent) {
        editor.val(savedContent);
        updateCounts();
    }

    // Cut text
    $('#cutText').click(function() {
        const selectedText = editor.val().substring(editor[0].selectionStart, editor[0].selectionEnd);
        navigator.clipboard.writeText(selectedText).then(() => {
            const start = editor[0].selectionStart;
            const end = editor[0].selectionEnd;
            const text = editor.val();
            editor.val(text.slice(0, start) + text.slice(end));
            updateCounts();
        });
    });

    // Copy text
    $('#copyText').click(function() {
        const selectedText = editor.val().substring(editor[0].selectionStart, editor[0].selectionEnd);
        navigator.clipboard.writeText(selectedText);
    });

    // Paste text
    $('#pasteText').click(function() {
        navigator.clipboard.readText().then(text => {
            const start = editor[0].selectionStart;
            const end = editor[0].selectionEnd;
            const currentText = editor.val();
            editor.val(currentText.slice(0, start) + text + currentText.slice(end));
            updateCounts();
        });
    });

    // Duplicate text
    $('#duplicateText').click(function() {
        const start = editor[0].selectionStart;
        const end = editor[0].selectionEnd;
        const selectedText = editor.val().substring(start, end);
        if (selectedText) {
            const currentText = editor.val();
            editor.val(currentText.slice(0, end) + selectedText + currentText.slice(end));
            updateCounts();
        }
    });

    // Share text
    $('#shareFile').click(function() {
        if (navigator.share) {
            navigator.share({
                title: 'Notepad Content',
                text: editor.val(),
            }).catch(console.error);
        } else {
            alert('Sharing is not supported in your browser');
        }
    });

    // Zoom in
    $('#zoomIn').click(function() {
        if (fontSize < 40) {
            fontSize += 2;
            editor.css('font-size', fontSize + 'px');
        }
    });

    // Zoom out
    $('#zoomOut').click(function() {
        if (fontSize > 8) {
            fontSize -= 2;
            editor.css('font-size', fontSize + 'px');
        }
    });

    // Add keyboard shortcuts
    $(document).keydown(function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key.toLowerCase()) {
                case 'z':
                    if (e.shiftKey) {
                        e.preventDefault();
                        $('#redoBtn').click();
                    } else {
                        e.preventDefault();
                        $('#undoBtn').click();
                    }
                    break;
                case 'c':
                    $('#copyText').click();
                    break;
                case 'x':
                    $('#cutText').click();
                    break;
                case 'v':
                    $('#pasteText').click();
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    $('#zoomIn').click();
                    break;
                case '-':
                    e.preventDefault();
                    $('#zoomOut').click();
                    break;
            }
        }
    });
}); 