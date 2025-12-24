import { useState, useEffect } from 'react';

interface StatusBarProps {
    currentFilePath: string | null;
    isDirty: boolean;
}

export default function StatusBar({ currentFilePath, isDirty }: StatusBarProps) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

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

    const fileName = currentFilePath
        ? currentFilePath.split(/[\\/]/).pop()
        : 'Untitled Document';

    return (
        <div className="status-bar">
            <div className="status-left">
                <span className="file-path" title={currentFilePath || 'Untitled'}>
                    {fileName}
                    {isDirty && <span className="dirty-indicator"> (unsaved)</span>}
                </span>
            </div>

            <div className="status-right">
                <span className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
                    {isOnline ? '🟢 Online' : '🔴 Offline'}
                </span>
            </div>
        </div>
    );
}
