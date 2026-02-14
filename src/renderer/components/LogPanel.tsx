import React from 'react';

interface LogPanelProps {
  logs: string[];
}

/**
 * LogPanel displays streaming logs from copy operations.
 */
export function LogPanel({ logs }: LogPanelProps): React.ReactElement {
  const logContainerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  React.useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div
        style={{
          padding: '16px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          fontSize: '14px',
          color: '#6c757d',
          textAlign: 'center',
        }}
      >
        No logs yet. Start a copy operation to see progress.
      </div>
    );
  }

  return (
    <div
      ref={logContainerRef}
      style={{
        padding: '12px',
        backgroundColor: '#1e1e1e',
        border: '1px solid #444',
        borderRadius: '4px',
        fontSize: '13px',
        fontFamily: 'Consolas, Monaco, monospace',
        color: '#d4d4d4',
        maxHeight: '300px',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      }}
    >
      {logs.map((log, index) => (
        <div
          key={index}
          style={{
            marginBottom: '4px',
            lineHeight: '1.4',
          }}
        >
          {log}
        </div>
      ))}
    </div>
  );
}
