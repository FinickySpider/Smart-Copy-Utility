import React, { useState } from 'react';
import { FolderPicker } from './FolderPicker';
import { TreeView } from './TreeView';
import { ExplainPanel } from './ExplainPanel';
import { ConflictBanner } from './ConflictBanner';

export function MainScreen(): React.ReactElement {
  const [sourcePath, setSourcePath] = useState<string | null>(null);
  const [destPath, setDestPath] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{
    scanId: string;
    rootNode: any;
    stats: any;
    conflicts: string[];
  } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const handleSelectFolder = async (kind: 'source' | 'destination') => {
    const result = await window.electronAPI.selectFolder({ kind });
    if (result.path) {
      if (kind === 'source') {
        setSourcePath(result.path);
      } else {
        setDestPath(result.path);
      }
      // Clear error when a folder is selected
      setErrorMessage(null);
      // Clear scan result when paths change
      setScanResult(null);
      setSelectedNode(null);
    }
  };

  const handlePreview = async () => {
    if (!sourcePath || !destPath) return;

    setScanning(true);
    try {
      const result = await window.electronAPI.scan({
        source: sourcePath,
        dest: destPath,
        rootOnly: false,
      });
      setScanResult(result);
      setSelectedNode(null);
    } catch (error) {
      console.error('Scan failed:', error);
      setErrorMessage('Failed to scan source directory.');
    } finally {
      setScanning(false);
    }
  };

  // Check if source and destination are the same
  const hasSameFolderError =
    sourcePath !== null &&
    destPath !== null &&
    sourcePath.toLowerCase() === destPath.toLowerCase();

  // Check if paths are missing
  const isSourceMissing = sourcePath === null;
  const isDestMissing = destPath === null;

  // Check if conflicts exist
  const hasConflicts = scanResult ? scanResult.conflicts.length > 0 : false;

  // Actions are disabled when paths are missing or same folder error
  const actionsDisabled = isSourceMissing || isDestMissing || hasSameFolderError;

  // Dry Run and Copy are additionally disabled when conflicts exist
  const dryRunCopyDisabled = actionsDisabled || hasConflicts;

  // Determine error message
  React.useEffect(() => {
    if (hasSameFolderError) {
      setErrorMessage(
        'Error: Source and destination must be different folders.'
      );
    } else if (isSourceMissing && isDestMissing) {
      setErrorMessage('Please select both source and destination folders.');
    } else if (isSourceMissing) {
      setErrorMessage('Please select a source folder.');
    } else if (isDestMissing) {
      setErrorMessage('Please select a destination folder.');
    } else {
      setErrorMessage(null);
    }
  }, [sourcePath, destPath, hasSameFolderError, isSourceMissing, isDestMissing]);

  return (
    <div
      style={{
        padding: '24px',
        fontFamily: 'Segoe UI, sans-serif',
        maxWidth: '1400px',
      }}
    >
      <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 600 }}>
        Smart Copy Utility
      </h1>

      {/* Folder Pickers */}
      <div style={{ marginBottom: '24px' }}>
        <FolderPicker
          label="Source Folder"
          kind="source"
          path={sourcePath}
          onSelect={handleSelectFolder}
          hasError={hasSameFolderError}
        />
        <FolderPicker
          label="Destination Folder"
          kind="destination"
          path={destPath}
          onSelect={handleSelectFolder}
          hasError={hasSameFolderError}
        />
      </div>

      {/* Error/Info Message */}
      {errorMessage && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '24px',
            backgroundColor: hasSameFolderError ? '#fee' : '#f0f8ff',
            border: `1px solid ${hasSameFolderError ? '#e74c3c' : '#3498db'}`,
            borderRadius: '4px',
            color: hasSameFolderError ? '#c0392b' : '#2980b9',
            fontSize: '14px',
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          disabled={actionsDisabled || scanning}
          onClick={handlePreview}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: actionsDisabled || scanning ? 'not-allowed' : 'pointer',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: actionsDisabled || scanning ? '#ccc' : '#3498db',
            color: actionsDisabled || scanning ? '#666' : '#fff',
            opacity: actionsDisabled || scanning ? 0.6 : 1,
          }}
        >
          {scanning ? 'Scanning...' : 'Preview'}
        </button>
        <button
          disabled={dryRunCopyDisabled}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: dryRunCopyDisabled ? 'not-allowed' : 'pointer',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: dryRunCopyDisabled ? '#ccc' : '#95a5a6',
            color: dryRunCopyDisabled ? '#666' : '#fff',
            opacity: dryRunCopyDisabled ? 0.6 : 1,
          }}
          title={hasConflicts ? 'Resolve conflicts before running Dry Run' : ''}
        >
          Dry Run
        </button>
        <button
          disabled={dryRunCopyDisabled}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: dryRunCopyDisabled ? 'not-allowed' : 'pointer',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: dryRunCopyDisabled ? '#ccc' : '#27ae60',
            color: dryRunCopyDisabled ? '#666' : '#fff',
            opacity: dryRunCopyDisabled ? 0.6 : 1,
          }}
          title={hasConflicts ? 'Resolve conflicts before running Copy' : ''}
        >
          Copy
        </button>
      </div>

      {/* Conflict Banner */}
      {scanResult && <ConflictBanner conflicts={scanResult.conflicts} />}

      {/* Scan Statistics */}
      {scanResult && (
        <div style={{ marginBottom: '16px', fontSize: '14px', color: '#555' }}>
          <strong>Scan Complete:</strong> {scanResult.stats.directoriesScanned}{' '}
          directories scanned, {scanResult.stats.ruleFilesFound} rule files found,{' '}
          {scanResult.stats.conflictsFound} conflicts detected.
        </div>
      )}

      {/* Two-column layout for tree and explain panel */}
      {scanResult && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Preview Tree */}
          <TreeView
            rootNode={scanResult.rootNode}
            scanId={scanResult.scanId}
            onNodeSelect={setSelectedNode}
          />

          {/* Explain Panel */}
          <ExplainPanel
            scanId={scanResult.scanId}
            selectedNode={selectedNode}
          />
        </div>
      )}
    </div>
  );
}
