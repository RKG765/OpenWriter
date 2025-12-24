import { useFileOps } from '../hooks/useFileOps';
import { useState } from 'react';

interface ToolbarProps {
    getContent: () => string;
    currentFilePath: string | null;
    onNewDocument: () => void;
    onContentLoaded: (content: string) => void;
    onFileSaved: (path: string) => void;
    editorRef?: React.MutableRefObject<any>;
}

export default function Toolbar({
    getContent,
    currentFilePath,
    onNewDocument,
    onContentLoaded,
    onFileSaved,
    editorRef,
}: ToolbarProps) {
    const { isLoading, error, openDocument, saveDocument, saveDocumentAs, exportPDF, clearError } = useFileOps();
    const [activeTab, setActiveTab] = useState('home');

    const handleOpen = async () => {
        const result = await openDocument();
        if (result) {
            onContentLoaded(result.content);
            onFileSaved(result.path);
        }
    };

    const handleSave = async () => {
        const content = getContent();
        const path = await saveDocument(content, currentFilePath);
        if (path) {
            onFileSaved(path);
        }
    };

    const handleSaveAs = async () => {
        const content = getContent();
        const path = await saveDocumentAs(content);
        if (path) {
            onFileSaved(path);
        }
    };

    const handleExportPDF = async () => {
        const content = getContent();
        await exportPDF(content);
    };

    // Execute simple CKEditor command
    const execCommand = (command: string) => {
        if (editorRef?.current) {
            editorRef.current.execute(command);
            editorRef.current.editing.view.focus();
        }
    };

    // Execute alignment command
    const setAlignment = (value: string) => {
        if (editorRef?.current) {
            editorRef.current.execute('alignment', { value });
            editorRef.current.editing.view.focus();
        }
    };

    // Execute heading command
    const setHeading = (value: string) => {
        if (editorRef?.current) {
            editorRef.current.execute('heading', { value });
            editorRef.current.editing.view.focus();
        }
    };

    // Clipboard operations
    const handleCut = () => document.execCommand('cut');
    const handleCopy = () => document.execCommand('copy');
    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (editorRef?.current) {
                editorRef.current.execute('insertText', { text });
            }
        } catch {
            document.execCommand('paste');
        }
    };

    // ============ INSERT TAB FUNCTIONS ============

    // Insert blank page (page break + empty paragraph)
    const insertBlankPage = () => {
        if (editorRef?.current) {
            editorRef.current.execute('pageBreak');
            editorRef.current.editing.view.focus();
        }
    };

    // Paste screenshot from clipboard
    const pasteScreenshot = async () => {
        try {
            const clipboardItems = await navigator.clipboard.read();
            for (const item of clipboardItems) {
                for (const type of item.types) {
                    if (type.startsWith('image/')) {
                        const blob = await item.getType(type);
                        const reader = new FileReader();
                        reader.onload = () => {
                            if (editorRef?.current && typeof reader.result === 'string') {
                                editorRef.current.execute('insertImage', { source: reader.result });
                                editorRef.current.editing.view.focus();
                            }
                        };
                        reader.readAsDataURL(blob);
                        return;
                    }
                }
            }
            alert('No image found in clipboard. Copy a screenshot first (Win+Shift+S).');
        } catch (err) {
            alert('Could not access clipboard. Please paste directly into the editor.');
        }
    };

    // Insert bookmark (placeholder)
    const insertBookmark = () => {
        const name = prompt('Enter bookmark name:');
        if (name && editorRef?.current) {
            const html = `<a id="bookmark-${name}" name="${name}"></a>`;
            editorRef.current.execute('insertHtml', html);
            editorRef.current.editing.view.focus();
        }
    };

    // Insert header placeholder
    const insertHeader = () => {
        if (editorRef?.current) {
            const html = `<div style="border-bottom: 1px solid #ccc; padding: 10px; margin-bottom: 20px; color: #666; font-size: 10pt;">[HEADER - Document Title]</div>`;
            // Insert at the beginning
            const currentData = editorRef.current.getData();
            editorRef.current.setData(html + currentData);
        }
    };

    // Insert footer placeholder
    const insertFooter = () => {
        if (editorRef?.current) {
            const html = `<div style="border-top: 1px solid #ccc; padding: 10px; margin-top: 20px; color: #666; font-size: 10pt;">[FOOTER]</div>`;
            const currentData = editorRef.current.getData();
            editorRef.current.setData(currentData + html);
        }
    };

    // Insert page number placeholder
    const insertPageNumber = () => {
        if (editorRef?.current) {
            editorRef.current.execute('insertHtml', '<span style="color: #999;">[Page X of Y]</span>');
            editorRef.current.editing.view.focus();
        }
    };

    // Insert date and time
    const insertDateTime = () => {
        if (editorRef?.current) {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const timeStr = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
            editorRef.current.execute('insertHtml', `<span>${dateStr} ${timeStr}</span>`);
            editorRef.current.editing.view.focus();
        }
    };

    const fileName = currentFilePath
        ? currentFilePath.split(/[\\/]/).pop()
        : 'Document';

    return (
        <>
            {/* Title Bar */}
            <div className="title-bar">
                <div className="title-bar-icon">W</div>
                <div className="title-bar-actions">
                    <button onClick={handleSave} className="title-bar-btn" disabled={isLoading} title="Save">💾</button>
                    <button onClick={() => execCommand('undo')} className="title-bar-btn" title="Undo">↶</button>
                    <button onClick={() => execCommand('redo')} className="title-bar-btn" title="Redo">↷</button>
                </div>
                <div className="title-bar-title">{fileName} - OpenWriter</div>
            </div>

            {/* Ribbon Tabs */}
            <div className="ribbon-tabs">
                <button className={`ribbon-tab ${activeTab === 'file' ? 'active' : ''}`} onClick={() => setActiveTab('file')}>File</button>
                <button className={`ribbon-tab ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>Home</button>
                <button className={`ribbon-tab ${activeTab === 'insert' ? 'active' : ''}`} onClick={() => setActiveTab('insert')}>Insert</button>
                <button className={`ribbon-tab ${activeTab === 'view' ? 'active' : ''}`} onClick={() => setActiveTab('view')}>View</button>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="toolbar-error" onClick={clearError}>
                    ⚠️ {error} — Click to dismiss
                </div>
            )}

            {/* HOME TAB - Main Word-like ribbon */}
            {activeTab === 'home' && (
                <div className="ribbon-toolbar">
                    {/* CLIPBOARD GROUP */}
                    <div className="ribbon-group">
                        <div className="ribbon-group-content">
                            <button onClick={handlePaste} className="ribbon-btn ribbon-btn-large" title="Paste (Ctrl+V)">
                                <span className="ribbon-btn-icon">📋</span>
                                <span>Paste</span>
                            </button>
                            <div className="ribbon-btn-stack">
                                <button onClick={handleCut} className="ribbon-btn ribbon-btn-small" title="Cut (Ctrl+X)">
                                    <span className="ribbon-btn-icon">✂️</span> Cut
                                </button>
                                <button onClick={handleCopy} className="ribbon-btn ribbon-btn-small" title="Copy (Ctrl+C)">
                                    <span className="ribbon-btn-icon">📄</span> Copy
                                </button>
                                <button className="ribbon-btn ribbon-btn-small" title="Format Painter">
                                    <span className="ribbon-btn-icon">🖌️</span> Format
                                </button>
                            </div>
                        </div>
                        <div className="ribbon-group-label">Clipboard</div>
                    </div>

                    {/* FONT GROUP */}
                    <div className="ribbon-group ribbon-group-wide">
                        <div className="ribbon-group-content ribbon-font-group">
                            <div className="ribbon-font-row">
                                <button onClick={() => execCommand('bold')} className="ribbon-btn ribbon-btn-icon-only" title="Bold (Ctrl+B)"><b>B</b></button>
                                <button onClick={() => execCommand('italic')} className="ribbon-btn ribbon-btn-icon-only" title="Italic (Ctrl+I)"><i>I</i></button>
                                <button onClick={() => execCommand('underline')} className="ribbon-btn ribbon-btn-icon-only" title="Underline (Ctrl+U)"><u>U</u></button>
                                <button onClick={() => execCommand('strikethrough')} className="ribbon-btn ribbon-btn-icon-only" title="Strikethrough"><s>ab</s></button>
                                <button onClick={() => execCommand('subscript')} className="ribbon-btn ribbon-btn-icon-only" title="Subscript">X₂</button>
                                <button onClick={() => execCommand('superscript')} className="ribbon-btn ribbon-btn-icon-only" title="Superscript">X²</button>
                            </div>
                            <div className="ribbon-font-row">
                                <button className="ribbon-btn ribbon-btn-icon-only" title="Text Color">🔤</button>
                                <button className="ribbon-btn ribbon-btn-icon-only" title="Highlight">🖍️</button>
                                <button onClick={() => execCommand('removeFormat')} className="ribbon-btn ribbon-btn-icon-only" title="Clear Formatting">🚫</button>
                            </div>
                        </div>
                        <div className="ribbon-group-label">Font</div>
                    </div>

                    {/* PARAGRAPH GROUP */}
                    <div className="ribbon-group">
                        <div className="ribbon-group-content ribbon-para-group">
                            <div className="ribbon-font-row">
                                <button onClick={() => execCommand('bulletedList')} className="ribbon-btn ribbon-btn-icon-only" title="Bullets">•≡</button>
                                <button onClick={() => execCommand('numberedList')} className="ribbon-btn ribbon-btn-icon-only" title="Numbering">1≡</button>
                                <button onClick={() => execCommand('outdent')} className="ribbon-btn ribbon-btn-icon-only" title="Decrease Indent">⇤</button>
                                <button onClick={() => execCommand('indent')} className="ribbon-btn ribbon-btn-icon-only" title="Increase Indent">⇥</button>
                            </div>
                            <div className="ribbon-font-row">
                                <button onClick={() => setAlignment('left')} className="ribbon-btn ribbon-btn-icon-only" title="Align Left">⫷</button>
                                <button onClick={() => setAlignment('center')} className="ribbon-btn ribbon-btn-icon-only" title="Center">≡</button>
                                <button onClick={() => setAlignment('right')} className="ribbon-btn ribbon-btn-icon-only" title="Align Right">⫸</button>
                                <button onClick={() => setAlignment('justify')} className="ribbon-btn ribbon-btn-icon-only" title="Justify">☰</button>
                                <button onClick={() => execCommand('showBlocks')} className="ribbon-btn ribbon-btn-icon-only" title="Show ¶">¶</button>
                            </div>
                        </div>
                        <div className="ribbon-group-label">Paragraph</div>
                    </div>

                    {/* STYLES GROUP */}
                    <div className="ribbon-group ribbon-group-wide">
                        <div className="ribbon-group-content">
                            <div className="ribbon-styles-gallery">
                                <button onClick={() => setHeading('paragraph')} className="ribbon-style-btn" title="Normal">Normal</button>
                                <button onClick={() => setHeading('heading1')} className="ribbon-style-btn ribbon-style-h1" title="Heading 1">Heading 1</button>
                                <button onClick={() => setHeading('heading2')} className="ribbon-style-btn ribbon-style-h2" title="Heading 2">Heading 2</button>
                                <button onClick={() => setHeading('heading3')} className="ribbon-style-btn ribbon-style-h3" title="Heading 3">Heading 3</button>
                            </div>
                        </div>
                        <div className="ribbon-group-label">Styles</div>
                    </div>

                    {/* EDITING GROUP */}
                    <div className="ribbon-group">
                        <div className="ribbon-group-content">
                            <button onClick={() => execCommand('findAndReplace')} className="ribbon-btn" title="Find & Replace">
                                <span className="ribbon-btn-icon">🔍</span>
                                <span>Find</span>
                            </button>
                            <button onClick={() => execCommand('selectAll')} className="ribbon-btn" title="Select All">
                                <span className="ribbon-btn-icon">▣</span>
                                <span>Select</span>
                            </button>
                        </div>
                        <div className="ribbon-group-label">Editing</div>
                    </div>

                    {isLoading && <div className="toolbar-loading">⏳ Working...</div>}
                </div>
            )}

            {/* FILE TAB */}
            {activeTab === 'file' && (
                <div className="ribbon-toolbar">
                    <div className="ribbon-group">
                        <div className="ribbon-group-content">
                            <button onClick={onNewDocument} className="ribbon-btn" disabled={isLoading} title="New Document">
                                <span className="ribbon-btn-icon">📄</span><span>New</span>
                            </button>
                            <button onClick={handleOpen} className="ribbon-btn" disabled={isLoading} title="Open">
                                <span className="ribbon-btn-icon">📂</span><span>Open</span>
                            </button>
                            <button onClick={handleSave} className="ribbon-btn" disabled={isLoading} title="Save">
                                <span className="ribbon-btn-icon">💾</span><span>Save</span>
                            </button>
                            <button onClick={handleSaveAs} className="ribbon-btn" disabled={isLoading} title="Save As">
                                <span className="ribbon-btn-icon">📁</span><span>Save As</span>
                            </button>
                        </div>
                        <div className="ribbon-group-label">File</div>
                    </div>
                    <div className="ribbon-group">
                        <div className="ribbon-group-content">
                            <button onClick={handleExportPDF} className="ribbon-btn" disabled={isLoading} title="Export PDF">
                                <span className="ribbon-btn-icon">📑</span><span>Export PDF</span>
                            </button>
                        </div>
                        <div className="ribbon-group-label">Export</div>
                    </div>
                    {isLoading && <div className="toolbar-loading">⏳ Working...</div>}
                </div>
            )}

            {/* INSERT TAB */}
            {activeTab === 'insert' && (
                <div className="ribbon-toolbar">
                    {/* PAGES GROUP */}
                    <div className="ribbon-group">
                        <div className="ribbon-group-content">
                            <button onClick={() => insertBlankPage()} className="ribbon-btn" title="Blank Page">
                                <span className="ribbon-btn-icon">📄</span><span>Blank Page</span>
                            </button>
                            <button onClick={() => execCommand('pageBreak')} className="ribbon-btn" title="Page Break">
                                <span className="ribbon-btn-icon">📃</span><span>Page Break</span>
                            </button>
                        </div>
                        <div className="ribbon-group-label">Pages</div>
                    </div>

                    {/* TABLES GROUP */}
                    <div className="ribbon-group">
                        <div className="ribbon-group-content">
                            <button onClick={() => execCommand('insertTable')} className="ribbon-btn ribbon-btn-large" title="Insert Table">
                                <span className="ribbon-btn-icon">📊</span><span>Table</span>
                            </button>
                        </div>
                        <div className="ribbon-group-label">Tables</div>
                    </div>

                    {/* ILLUSTRATIONS GROUP */}
                    <div className="ribbon-group">
                        <div className="ribbon-group-content">
                            <button onClick={() => execCommand('insertImage')} className="ribbon-btn ribbon-btn-large" title="Insert Picture">
                                <span className="ribbon-btn-icon">🖼️</span><span>Picture</span>
                            </button>
                            <div className="ribbon-btn-stack">
                                <button onClick={() => pasteScreenshot()} className="ribbon-btn ribbon-btn-small" title="Paste Screenshot">
                                    <span className="ribbon-btn-icon">📸</span> Screenshot
                                </button>
                                <button className="ribbon-btn ribbon-btn-small" disabled title="Shapes (Coming Soon)">
                                    <span className="ribbon-btn-icon">⬡</span> Shapes
                                </button>
                            </div>
                        </div>
                        <div className="ribbon-group-label">Illustrations</div>
                    </div>

                    {/* LINKS GROUP */}
                    <div className="ribbon-group">
                        <div className="ribbon-group-content">
                            <button onClick={() => execCommand('link')} className="ribbon-btn ribbon-btn-large" title="Insert Link">
                                <span className="ribbon-btn-icon">🔗</span><span>Link</span>
                            </button>
                            <div className="ribbon-btn-stack">
                                <button onClick={() => insertBookmark()} className="ribbon-btn ribbon-btn-small" title="Bookmark">
                                    <span className="ribbon-btn-icon">🔖</span> Bookmark
                                </button>
                            </div>
                        </div>
                        <div className="ribbon-group-label">Links</div>
                    </div>

                    {/* HEADER & FOOTER GROUP */}
                    <div className="ribbon-group">
                        <div className="ribbon-group-content">
                            <button onClick={() => insertHeader()} className="ribbon-btn" title="Header">
                                <span className="ribbon-btn-icon">⬆️</span><span>Header</span>
                            </button>
                            <button onClick={() => insertFooter()} className="ribbon-btn" title="Footer">
                                <span className="ribbon-btn-icon">⬇️</span><span>Footer</span>
                            </button>
                            <button onClick={() => insertPageNumber()} className="ribbon-btn" title="Page Number">
                                <span className="ribbon-btn-icon">#</span><span>Page No.</span>
                            </button>
                        </div>
                        <div className="ribbon-group-label">Header & Footer</div>
                    </div>

                    {/* TEXT GROUP */}
                    <div className="ribbon-group">
                        <div className="ribbon-group-content">
                            <button onClick={() => insertDateTime()} className="ribbon-btn" title="Date & Time">
                                <span className="ribbon-btn-icon">📅</span><span>Date & Time</span>
                            </button>
                            <button onClick={() => execCommand('blockQuote')} className="ribbon-btn" title="Text Box / Quote">
                                <span className="ribbon-btn-icon">📝</span><span>Quote</span>
                            </button>
                            <button onClick={() => execCommand('horizontalLine')} className="ribbon-btn" title="Horizontal Line">
                                <span className="ribbon-btn-icon">─</span><span>Line</span>
                            </button>
                        </div>
                        <div className="ribbon-group-label">Text</div>
                    </div>

                    {/* SYMBOLS GROUP */}
                    <div className="ribbon-group">
                        <div className="ribbon-group-content">
                            <button onClick={() => execCommand('specialCharacters')} className="ribbon-btn ribbon-btn-large" title="Insert Symbol">
                                <span className="ribbon-btn-icon">Ω</span><span>Symbol</span>
                            </button>
                        </div>
                        <div className="ribbon-group-label">Symbols</div>
                    </div>
                </div>
            )}

            {/* VIEW TAB */}
            {activeTab === 'view' && (
                <div className="ribbon-toolbar">
                    <div className="ribbon-group">
                        <div className="ribbon-group-content">
                            <button onClick={() => execCommand('showBlocks')} className="ribbon-btn" title="Show Paragraph Marks">
                                <span className="ribbon-btn-icon">¶</span><span>¶ Marks</span>
                            </button>
                        </div>
                        <div className="ribbon-group-label">Show</div>
                    </div>
                </div>
            )}
        </>
    );
}
