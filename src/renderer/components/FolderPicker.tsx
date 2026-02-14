import React from 'react';

interface FolderPickerProps {
  label: string;
  kind: 'source' | 'destination';
  path: string | null;
  onSelect: (kind: 'source' | 'destination') => void;
  hasError?: boolean;
}

export function FolderPicker({
  label,
  kind,
  path,
  onSelect,
  hasError = false,
}: FolderPickerProps): React.ReactElement {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => onSelect(kind)}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            cursor: 'pointer',
            borderRadius: '4px',
            border: '1px solid #ccc',
            backgroundColor: '#f5f5f5',
          }}
        >
          Select Folder
        </button>
        <span
          style={{
            fontSize: '14px',
            color: path ? '#333' : '#999',
            fontFamily: 'Consolas, monospace',
            border: hasError ? '1px solid #e74c3c' : 'none',
            backgroundColor: hasError ? '#fee' : 'transparent',
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
