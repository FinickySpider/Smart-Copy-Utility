import React, { useState } from 'react';

function App(): React.ReactElement {
  const [sourcePath, setSourcePath] = useState<string | null>(null);
  const [destPath, setDestPath] = useState<string | null>(null);

  const handleSelectFolder = async (kind: 'source' | 'destination') => {
    const result = await window.electronAPI.selectFolder({ kind });
    if (result.path) {
      if (kind === 'source') {
        setSourcePath(result.path);
      } else {
        setDestPath(result.path);
      }
    }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'Segoe UI, sans-serif' }}>
      <h1>Smart Copy Utility</h1>
      <div style={{ marginBottom: '16px' }}>
        <button onClick={() => handleSelectFolder('source')}>
          Select Source Folder
        </button>
        <span style={{ marginLeft: '12px' }}>{sourcePath ?? 'No folder selected'}</span>
      </div>
      <div style={{ marginBottom: '16px' }}>
        <button onClick={() => handleSelectFolder('destination')}>
          Select Destination Folder
        </button>
        <span style={{ marginLeft: '12px' }}>{destPath ?? 'No folder selected'}</span>
      </div>
    </div>
  );
}

export default App;
