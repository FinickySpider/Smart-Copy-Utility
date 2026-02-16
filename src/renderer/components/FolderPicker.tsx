import React from 'react';

interface FolderPickerProps {
  label: string;
  kind: 'source' | 'destination';
  path: string | null;
  onSelect: (kind: 'source' | 'destination') => void;
  hasError?: boolean;
  disabled?: boolean;
}

export function FolderPicker({
  label,
  kind,
  path,
  onSelect,
  hasError = false,
  disabled = false,
}: FolderPickerProps): React.ReactElement {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => onSelect(kind)}
          disabled={disabled}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            backgroundColor: disabled ? 'var(--button-disabled)' : 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          Select Folder
        </button>
        <span
          style={{
            fontSize: '14px',
            color: path ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontFamily: 'Consolas, monospace',
            border: hasError ? '1px solid var(--error-border)' : 'none',
            backgroundColor: hasError ? 'var(--error-bg)' : 'transparent',
            padding: hasError ? '4px 8px' : '0',
            borderRadius: hasError ? '4px' : '0',
          }}
        >
          {path ?? 'No folder selected'}
        </span>
      </div>
    </div>
  );
}
