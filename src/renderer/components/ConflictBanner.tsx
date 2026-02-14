import React from 'react';

interface ConflictBannerProps {
  conflicts: string[];
}

export function ConflictBanner({ conflicts }: ConflictBannerProps): React.ReactElement | null {
  if (conflicts.length === 0) {
    return null;
  }

  const handleOpenInExplorer = (dirPath: string) => {
    window.electronAPI.openInExplorer({ dirPath });
  };

  const handleCopyPath = (text: string) => {
    window.electronAPI.copyToClipboard({ text });
  };

  return (
    <div
      style={{
        padding: '16px',
        marginBottom: '24px',
        backgroundColor: 'var(--error-bg)',
        border: '2px solid var(--error-border)',
        borderRadius: '4px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '20px', marginRight: '12px' }}>⚠</span>
        <h3
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--error-text)',
          }}
        >
          Rule File Conflicts Detected
        </h3>
      </div>

      <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--error-text)' }}>
        The following directories contain both <code>.copyignore</code> and{' '}
        <code>.copyinclude</code> files. You must resolve these conflicts before
        running Dry Run or Copy operations.
      </p>

      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {conflicts.map((conflictPath, index) => (
          <div
            key={index}
            style={{
              padding: '8px 12px',
              marginBottom: '8px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--error-border)',
              borderRadius: '4px',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                fontFamily: 'Consolas, monospace',
                marginBottom: '6px',
                color: 'var(--text-primary)',
              }}
            >
              {conflictPath}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleOpenInExplorer(conflictPath)}
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                }}
              >
                Open in Explorer
              </button>
              <button
                onClick={() => handleCopyPath(conflictPath)}
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                }}
              >
                Copy Path
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
