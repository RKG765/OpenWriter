import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
    ClassicEditor,
    Essentials,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Subscript,
    Superscript,
    Heading,
    Paragraph,
    Font,
    FontFamily,
    FontSize,
    FontColor,
    FontBackgroundColor,
    Alignment,
    List,
    ListProperties,
    TodoList,
    Indent,
    IndentBlock,
    Table,
    TableToolbar,
    TableProperties,
    TableCellProperties,
    TableColumnResize,
    Image,
    ImageUpload,
    ImageInsert,
    ImageResize,
    ImageStyle,
    ImageToolbar,
    ImageCaption,
    Base64UploadAdapter,
    Link,
    LinkImage,
    AutoLink,
    BlockQuote,
    HorizontalLine,
    PageBreak,
    Undo,
    Clipboard,
    PasteFromOffice,
    RemoveFormat,
    SpecialCharacters,
    SpecialCharactersEssentials,
    FindAndReplace,
    SelectAll,
    ShowBlocks,
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';
import { useRef, useEffect } from 'react';

interface EditorProps {
    content: string;
    onContentChange: (content: string) => void;
    onSelectionChange?: (selectedText: string) => void;
    onEditorReady?: (editor: ClassicEditor) => void;
}

export default function Editor({ content, onContentChange, onSelectionChange, onEditorReady }: EditorProps) {
    const editorRef = useRef<ClassicEditor | null>(null);
    const lastContent = useRef<string>(content);
    const isInternalChange = useRef(false);

    // Sync content from parent
    useEffect(() => {
        if (editorRef.current && content !== lastContent.current) {
            isInternalChange.current = true;
            editorRef.current.setData(content);
            lastContent.current = content;
            isInternalChange.current = false;
        }
    }, [content]);

    return (
        <div className="document-canvas">
            <div className="page">
                <CKEditor
                    editor={ClassicEditor}
                    data={content}
                    config={{
                        licenseKey: 'GPL',
                        plugins: [
                            Essentials, Undo, Clipboard, PasteFromOffice, SelectAll,
                            FindAndReplace, ShowBlocks, Bold, Italic, Underline,
                            Strikethrough, Subscript, Superscript, RemoveFormat,
                            Font, FontFamily, FontSize, FontColor, FontBackgroundColor,
                            Heading, Paragraph, Alignment, List, ListProperties,
                            TodoList, Indent, IndentBlock, Table, TableToolbar,
                            TableProperties, TableCellProperties, TableColumnResize,
                            Image, ImageUpload, ImageInsert, ImageResize, ImageStyle,
                            ImageToolbar, ImageCaption, Base64UploadAdapter,
                            Link, LinkImage, AutoLink, BlockQuote, HorizontalLine,
                            PageBreak, SpecialCharacters, SpecialCharactersEssentials,
                        ],
                        toolbar: { items: [] },
                        heading: {
                            options: [
                                { model: 'paragraph', title: 'Normal', class: 'ck-heading_paragraph' },
                                { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                                { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
                                { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
                            ]
                        },
                        fontFamily: {
                            options: [
                                'default', 'Arial, Helvetica, sans-serif',
                                'Calibri, sans-serif', 'Times New Roman, Times, serif',
                                'Courier New, Courier, monospace', 'Georgia, serif',
                            ],
                            supportAllValues: true
                        },
                        fontSize: {
                            options: [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72],
                            supportAllValues: true
                        },
                        alignment: { options: ['left', 'center', 'right', 'justify'] },
                        table: { contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'] },
                        image: {
                            toolbar: ['imageStyle:inline', 'imageStyle:block'],
                            insert: { integrations: ['upload', 'url'] }
                        },
                        placeholder: ''
                    }}
                    onReady={(editor) => {
                        editorRef.current = editor;
                        lastContent.current = content;
                        if (onEditorReady) onEditorReady(editor);

                        editor.model.document.selection.on('change:range', () => {
                            if (onSelectionChange) {
                                const selection = editor.model.document.selection;
                                const range = selection.getFirstRange();
                                if (range) {
                                    let selectedText = '';
                                    for (const item of range.getItems()) {
                                        if (item.is('$textProxy')) {
                                            selectedText += item.data;
                                        }
                                    }
                                    onSelectionChange(selectedText);
                                }
                            }
                        });
                    }}
                    onChange={(_event, editor) => {
                        if (isInternalChange.current) return;
                        const data = editor.getData();
                        if (data !== lastContent.current) {
                            lastContent.current = data;
                            onContentChange(data);
                        }
                    }}
                    onError={(error) => console.error('CKEditor error:', error)}
                />
            </div>
        </div>
    );
}
