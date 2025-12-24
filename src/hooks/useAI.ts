import { useState, useCallback } from 'react';
import { callAI, AIAction, isAIConfigured, saveAIConfig, getMaskedApiKey } from '../services/ai-client';

interface UseAIResult {
    isLoading: boolean;
    error: string | null;
    response: string | null;
    isConfigured: boolean;
    maskedApiKey: string;
    rewrite: (text: string, context?: string) => Promise<void>;
    summarize: (text: string, context?: string) => Promise<void>;
    continueWriting: (text: string, context?: string) => Promise<void>;
    setApiKey: (key: string) => void;
    clearResponse: () => void;
    clearError: () => void;
}

export function useAI(): UseAIResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<string | null>(null);
    const [isConfigured, setIsConfigured] = useState(isAIConfigured());
    const [maskedApiKey, setMaskedApiKey] = useState(getMaskedApiKey());

    const performAction = useCallback(async (action: AIAction) => {
        setIsLoading(true);
        setError(null);
        setResponse(null);

        try {
            const result = await callAI(action);

            if (result.success && result.content) {
                setResponse(result.content);
            } else {
                setError(result.error || 'Unknown error occurred');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'AI request failed');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const rewrite = useCallback(async (text: string, context?: string) => {
        await performAction({ type: 'rewrite', selectedText: text, documentContext: context });
    }, [performAction]);

    const summarize = useCallback(async (text: string, context?: string) => {
        await performAction({ type: 'summarize', selectedText: text, documentContext: context });
    }, [performAction]);

    const continueWriting = useCallback(async (text: string, context?: string) => {
        await performAction({ type: 'continue', selectedText: text, documentContext: context });
    }, [performAction]);

    const setApiKey = useCallback((key: string) => {
        saveAIConfig({ apiKey: key });
        setIsConfigured(isAIConfigured());
        setMaskedApiKey(getMaskedApiKey());
    }, []);

    const clearResponse = useCallback(() => setResponse(null), []);
    const clearError = useCallback(() => setError(null), []);

    return {
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
    };
}
