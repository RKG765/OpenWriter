import { useEffect, useRef, useCallback } from 'react';

const AUTOSAVE_KEY = 'openwriter_autosave';
const AUTOSAVE_PATH_KEY = 'openwriter_autosave_path';
const AUTOSAVE_INTERVAL = 30000; // 30 seconds

interface AutosaveData {
    content: string;
    timestamp: number;
    path: string | null;
}

interface UseAutosaveOptions {
    content: string;
    currentFilePath: string | null;
    isDirty: boolean;
    onRecover: (content: string, path: string | null) => void;
}

export function useAutosave({ content, currentFilePath, isDirty, onRecover }: UseAutosaveOptions) {
    const lastSaveRef = useRef<string>('');
    const hasCheckedRecovery = useRef(false);

    // Check for crash recovery on mount
    useEffect(() => {
        if (hasCheckedRecovery.current) return;
        hasCheckedRecovery.current = true;

        try {
            const savedData = localStorage.getItem(AUTOSAVE_KEY);
            if (savedData) {
                const data: AutosaveData = JSON.parse(savedData);
                const age = Date.now() - data.timestamp;
                const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

                if (age < MAX_AGE && data.content) {
                    const recover = window.confirm(
                        `Found unsaved work from ${new Date(data.timestamp).toLocaleString()}.\n\nWould you like to recover it?`
                    );

                    if (recover) {
                        onRecover(data.content, data.path);
                    }
                }

                // Clear old autosave
                localStorage.removeItem(AUTOSAVE_KEY);
                localStorage.removeItem(AUTOSAVE_PATH_KEY);
            }
        } catch (err) {
            console.error('Error checking autosave:', err);
        }
    }, [onRecover]);

    // Autosave periodically
    useEffect(() => {
        if (!isDirty) return;
        if (content === lastSaveRef.current) return;

        const timer = setTimeout(() => {
            try {
                const data: AutosaveData = {
                    content,
                    timestamp: Date.now(),
                    path: currentFilePath,
                };
                localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
                lastSaveRef.current = content;
                console.log('Autosaved at', new Date().toLocaleTimeString());
            } catch (err) {
                console.error('Autosave failed:', err);
            }
        }, AUTOSAVE_INTERVAL);

        return () => clearTimeout(timer);
    }, [content, currentFilePath, isDirty]);

    // Save immediately on content change (debounced)
    const saveNow = useCallback(() => {
        try {
            const data: AutosaveData = {
                content,
                timestamp: Date.now(),
                path: currentFilePath,
            };
            localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
            lastSaveRef.current = content;
        } catch (err) {
            console.error('Immediate save failed:', err);
        }
    }, [content, currentFilePath]);

    // Clear autosave when document is saved
    const clearAutosave = useCallback(() => {
        localStorage.removeItem(AUTOSAVE_KEY);
        localStorage.removeItem(AUTOSAVE_PATH_KEY);
        lastSaveRef.current = content;
    }, [content]);

    return { saveNow, clearAutosave };
}
