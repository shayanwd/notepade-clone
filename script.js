$(document).ready(function() {
    const editor = $('#editor');
    let undoStack = [];
    let redoStack = [];
    let fontSize = 14; // Base font size for zoom
    let showLines = true;

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
            
            // Define file type patterns
            const textFilePattern = /\.(txt|json|xml|js|css|html|md|log|svg|csv)$/i;
            const codeFilePattern = /\.(js|css|html|xml|svg)$/i;
            const csvPattern = /\.(csv)$/i;
            
            // Handle different file types
            if (file.type.startsWith('text/') || 
                file.name.match(textFilePattern)) {
                
                reader.onload = function(e) {
                    let content = e.target.result;
                    
                    // Special handling for CSV files
                    if (file.name.match(csvPattern)) {
                        try {
                            // Format CSV content for better readability
                            const rows = content.split('\n');
                            const formattedRows = rows.map(row => 
                                row.split(',')
                                   .map(cell => cell.trim())
                                   .join('\t')
                            );
                            content = formattedRows.join('\n');
                        } catch (error) {
                            console.error('Error formatting CSV:', error);
                        }
                    }
                    
                    // Special handling for code files
                    if (file.name.match(codeFilePattern)) {
                        try {
                            // Add file type indicator at the top
                            const fileExtension = file.name.split('.').pop().toLowerCase();
                            content = `/* File type: ${fileExtension.toUpperCase()} */\n${content}`;
                            
                            // For SVG files, add viewing instructions
                            if (fileExtension === 'svg') {
                                content = `/* SVG Code - You can edit the code directly */\n${content}`;
                            }
                        } catch (error) {
                            console.error('Error formatting code:', error);
                        }
                    }
                    
                    editor.val(content);
                    updateCounts();
                    
                    // Update status bar with file info
                    updateFileInfo(file);
                };
                reader.readAsText(file);
                
            } else if (file.type.startsWith('image/')) {
                reader.onload = function(e) {
                    if (file.type === 'image/svg+xml') {
                        // Handle SVG files as text
                        editor.val(e.target.result);
                    } else {
                        // For other images, show file info and base64 data
                        const content = [
                            `/* Image File Information */`,
                            `Name: ${file.name}`,
                            `Size: ${formatFileSize(file.size)}`,
                            `Type: ${file.type}`,
                            ``,
                            `Base64 Data:`,
                            e.target.result
                        ].join('\n');
                        editor.val(content);
                    }
                    updateCounts();
                    updateFileInfo(file);
                };
                reader.readAsDataURL(file);
                
            } else {
                reader.onload = function(e) {
                    const content = [
                        `/* Binary File Information */`,
                        `Name: ${file.name}`,
                        `Size: ${formatFileSize(file.size)}`,
                        `Type: ${file.type || 'unknown'}`,
                        ``,
                        `Note: This file type cannot be edited in text format.`
                    ].join('\n');
                    editor.val(content);
                    updateCounts();
                    updateFileInfo(file);
                };
                reader.readAsArrayBuffer(file);
            }
        }
    });

    // Helper function to format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Update save functionality to handle different file types
    $('#saveFile').click(function() {
        const content = editor.val();
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Get original file name if available
        const originalFile = $('#fileInput')[0].files[0];
        a.download = originalFile ? originalFile.name : 'notepad.txt';
        
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

    // Add this new function to update file info in status bar
    function updateFileInfo(file) {
        const fileInfo = `File: ${file.name} (${formatFileSize(file.size)})`;
        
        // Create or update file info element
        if ($('#fileInfo').length === 0) {
            $('.status-bar').prepend(`<span id="fileInfo">${fileInfo}</span>`);
        } else {
            $('#fileInfo').text(fileInfo);
        }
    }

    // Add this helper function for CSV parsing
    function parseCSV(text) {
        return text.split('\n')
            .map(row => row.split(',')
                .map(cell => cell.trim())
                .join('\t'))
            .join('\n');
    }

    // Load Google Fonts
    loadGoogleFonts();

    // Preferences modal
    $('#preferences').click(function() {
        $('#preferencesModal').show();
        loadPreferences();
    });

    $('#closePreferences').click(function() {
        $('#preferencesModal').hide();
    });

    // Close modal when clicking outside
    $(window).click(function(e) {
        if ($(e.target).is('#preferencesModal')) {
            $('#preferencesModal').hide();
        }
    });

    // Save preferences
    $('#autoSaveOnClose').change(function() {
        localStorage.setItem('autoSaveOnClose', this.checked);
    });

    $('#fontSizeInput').change(function() {
        const newSize = $(this).val();
        localStorage.setItem('fontSize', newSize);
        editor.css('font-size', newSize + 'px');
    });

    $('#fontFamilySelect').change(function() {
        const newFont = $(this).val();
        localStorage.setItem('fontFamily', newFont);
        editor.css('font-family', newFont);
    });

    $('#fontWeightSelect').change(function() {
        const newWeight = $(this).val();
        localStorage.setItem('fontWeight', newWeight);
        editor.css('font-weight', newWeight);
    });

    // Font search functionality
    $('#fontSearch').on('input', function() {
        const searchTerm = $(this).val().toLowerCase();
        $('#fontFamilySelect option').each(function() {
            const fontName = $(this).text().toLowerCase();
            $(this).toggle(fontName.includes(searchTerm));
        });
    });

    // Reset preferences
    $('#resetPreferences').click(function() {
        if (confirm('Are you sure you want to reset all preferences?')) {
            localStorage.removeItem('autoSaveOnClose');
            localStorage.removeItem('fontSize');
            localStorage.removeItem('fontFamily');
            localStorage.removeItem('fontWeight');
            loadPreferences(); // Reload default preferences
        }
    });

    // Load preferences function
    function loadPreferences() {
        const autoSave = localStorage.getItem('autoSaveOnClose') === 'true';
        const fontSize = localStorage.getItem('fontSize') || '14';
        const fontFamily = localStorage.getItem('fontFamily') || 'Courier New';
        const fontWeight = localStorage.getItem('fontWeight') || '400';

        $('#autoSaveOnClose').prop('checked', autoSave);
        $('#fontSizeInput').val(fontSize);
        $('#fontFamilySelect').val(fontFamily);
        $('#fontWeightSelect').val(fontWeight);

        editor.css({
            'font-size': fontSize + 'px',
            'font-family': fontFamily,
            'font-weight': fontWeight
        });
    }

    // Load Google Fonts
    async function loadGoogleFonts() {
        try {
            // Add some default system fonts
            const systemFonts = [
                'Arial', 'Helvetica', 'Times New Roman', 'Times', 'Courier New', 
                'Courier', 'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman',
                'Comic Sans MS', 'Trebuchet MS', 'Impact'
            ];
            
            const select = $('#fontFamilySelect');
            
            // Add system fonts group
            const systemGroup = $('<optgroup label="System Fonts"></optgroup>');
            systemFonts.forEach(font => {
                systemGroup.append(`<option value="${font}">${font}</option>`);
            });
            select.append(systemGroup);
            
            // Add Google Fonts
            const API_KEY = 'YOUR_GOOGLE_FONTS_API_KEY'; // Replace with your API key
            if (API_KEY !== 'YOUR_GOOGLE_FONTS_API_KEY') {
                const response = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${API_KEY}`);
                const data = await response.json();
                
                // Add Google Fonts group
                const googleGroup = $('<optgroup label="Google Fonts"></optgroup>');
                data.items.forEach(font => {
                    googleGroup.append(`<option value="${font.family}">${font.family}</option>`);
                    
                    // Load the font
                    const link = document.createElement('link');
                    link.href = `https://fonts.googleapis.com/css?family=${font.family.replace(' ', '+')}:300,400,500,700`;
                    link.rel = 'stylesheet';
                    document.head.appendChild(link);
                });
                select.append(googleGroup);
            }
            
            loadPreferences(); // Load saved preferences after fonts are loaded
        } catch (error) {
            console.error('Error loading Google Fonts:', error);
            // Still load preferences even if Google Fonts fail
            loadPreferences();
        }
    }

    // Handle page close
    $(window).on('beforeunload', function() {
        if ($('#autoSaveOnClose').is(':checked')) {
            localStorage.setItem('notepadContent', editor.val());
        }
    });

    $('#toggleLines').click(function() {
        $(this).toggleClass('active');
        showLines = !showLines;
        if (showLines) {
            $('#editor').css('background-image', '');  // Reset to CSS default
        } else {
            $('#editor').css('background-image', 'none');
        }
        localStorage.setItem('showLines', showLines);
    });

    // Load lines preference
    const savedLinesPreference = localStorage.getItem('showLines');
    if (savedLinesPreference !== null) {
        showLines = savedLinesPreference === 'true';
        if (!showLines) {
            $('#editor').css('background-image', 'none');
        } else {
            $('#toggleLines').addClass('active');
        }
    }
}); 