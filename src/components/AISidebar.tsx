import { useState, useEffect } from 'react';
import { useAI } from '../hooks/useAI';

interface AISidebarProps {
    selectedText: string;
    onInsertText: (text: string) => void;
}

export default function AISidebar({ selectedText, onInsertText }: AISidebarProps) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showSettings, setShowSettings] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');

    const {
        isLoading,
        error,
        response,
        isConfigured,
        maskedApiKey,
        rewrite,
        summarize,
        continueWriting,
        setApiKey,
        clearResponse,
        clearError,
    } = useAI();

    // Track online/offline status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleSaveApiKey = () => {
        if (apiKeyInput.trim()) {
            setApiKey(apiKeyInput.trim());
            setApiKeyInput('');
            setShowSettings(false);
        }
    };

    const handleInsert = () => {
        if (response) {
            onInsertText(response);
            clearResponse();
        }
    };

    const canUseAI = isOnline && isConfigured && selectedText.length > 0;

    return (
        <div className="ai-sidebar">
            <div className="ai-sidebar-header">
                <h3>🤖 AI Assistant</h3>
                <button
                    className="ai-settings-btn"
                    onClick={() => setShowSettings(!showSettings)}
                    title="Configure API Key"
                >
                    ⚙️
                </button>
            </div>

            {showSettings && (
                <div className="ai-settings">
                    <p className="ai-settings-label">Groq API Key:</p>
                    {maskedApiKey && (
                        <p className="ai-current-key">Current: {maskedApiKey}</p>
                    )}
                    <input
                        type="password"
                        className="ai-key-input"
                        placeholder="Enter your Groq API key..."
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                    />
                    <button className="ai-save-btn" onClick={handleSaveApiKey}>
                        Save Key
                    </button>
                    <p className="ai-settings-help">
                        Get your free API key at <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer">console.groq.com</a>
                    </p>
                </div>
            )}

            {!isOnline && (
                <div className="ai-offline-notice">
                    <p>⚠️ You're offline</p>
                    <p>AI features require an internet connection.</p>
                </div>
            )}

            {isOnline && !isConfigured && !showSettings && (
                <div className="ai-config-notice">
                    <p>🔑 API Key Required</p>
                    <p>Click the ⚙️ icon above to add your Groq API key.</p>
                </div>
            )}

            {isOnline && isConfigured && (
                <div className="ai-content">
                    <div className="ai-selection-preview">
                        <h4>Selected Text:</h4>
                        <p className="selected-text">
                            {selectedText || <span className="no-selection">Select text in the editor to use AI features</span>}
                        </p>
                    </div>

                    {error && (
                        <div className="ai-error" onClick={clearError}>
                            ⚠️ {error}
                            <span className="ai-error-dismiss">(click to dismiss)</span>
                        </div>
                    )}

                    {response && (
                        <div className="ai-response">
                            <h4>AI Response:</h4>
                            <div className="ai-response-content">
                                {response}
                            </div>
                            <div className="ai-response-actions">
                                <button className="ai-insert-btn" onClick={handleInsert}>
                                    ✅ Insert
                                </button>
                                <button className="ai-discard-btn" onClick={clearResponse}>
                                    ❌ Discard
                                </button>
                            </div>
                        </div>
                    )}

                    {!response && (
                        <div className="ai-actions">
                            <button
                                className="ai-action-btn"
                                disabled={!canUseAI || isLoading}
                                onClick={() => rewrite(selectedText)}
                                title="Rewrite the selected text"
                            >
                                {isLoading ? '⏳ Working...' : '✏️ Rewrite'}
                            </button>
                            <button
                                className="ai-action-btn"
                                disabled={!canUseAI || isLoading}
                                onClick={() => summarize(selectedText)}
                                title="Summarize the selected text"
                            >
                                {isLoading ? '⏳ Working...' : '📝 Summarize'}
                            </button>
                            <button
                                className="ai-action-btn"
                                disabled={!canUseAI || isLoading}
                                onClick={() => continueWriting(selectedText)}
                                title="Continue writing from selection"
                            >
                                {isLoading ? '⏳ Working...' : '➡️ Continue Writing'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
