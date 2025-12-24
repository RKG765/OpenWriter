import { useState, useCallback, useRef } from "react";
import Editor from "./components/Editor";
import PagedView from "./components/PagedView";
import Toolbar from "./components/Toolbar";
import StatusBar from "./components/StatusBar";
import { ClassicEditor } from "ckeditor5";
import "./App.css";

function App() {
  // Document state - SINGLE SOURCE OF TRUTH
  const [content, setContent] = useState<string>("");
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Editor reference for direct API access
  const editorRef = useRef<ClassicEditor | null>(null);

  // Handle editor ready
  const handleEditorReady = useCallback((editor: ClassicEditor) => {
    editorRef.current = editor;
  }, []);

  // Handle content change from editor
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setIsDirty(true);
  }, []);

  // NEW: Clear everything
  const handleNewDocument = useCallback(async () => {
    if (isDirty) {
      const result = window.confirm(
        "Do you want to save changes?\n\n" +
        "OK = Discard and create new\n" +
        "Cancel = Go back"
      );
      if (!result) return;
    }

    setContent("");
    setCurrentFilePath(null);
    setIsDirty(false);

    if (editorRef.current) {
      editorRef.current.setData("");
    }
  }, [isDirty]);

  // OPEN: Load content
  const handleContentLoaded = useCallback((newContent: string) => {
    setContent(newContent);
    setIsDirty(false);
    if (editorRef.current) {
      editorRef.current.setData(newContent);
    }
  }, []);

  // SAVE: Mark as saved
  const handleFileSaved = useCallback((path: string) => {
    setCurrentFilePath(path);
    setIsDirty(false);
  }, []);

  // Get current content
  const getCurrentContent = useCallback((): string => {
    if (editorRef.current) {
      return editorRef.current.getData();
    }
    return content;
  }, [content]);

  return (
    <div className="app-container">
      <Toolbar
        getContent={getCurrentContent}
        currentFilePath={currentFilePath}
        onNewDocument={handleNewDocument}
        onContentLoaded={handleContentLoaded}
        onFileSaved={handleFileSaved}
        editorRef={editorRef}
      />

      <div className="main-content">
        {/* Hidden continuous editor - the real document */}
        <div className="editor-hidden">
          <Editor
            content={content}
            onContentChange={handleContentChange}
            onEditorReady={handleEditorReady}
          />
        </div>

        {/* Visible paginated view - read-only layout layer */}
        <div className="paged-view-wrapper">
          <PagedView content={content} />
        </div>
      </div>

      <StatusBar
        currentFilePath={currentFilePath}
        isDirty={isDirty}
      />
    </div>
  );
}

export default App;

