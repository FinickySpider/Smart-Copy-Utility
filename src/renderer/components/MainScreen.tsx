import React, { useState } from 'react';
import { FolderPicker } from './FolderPicker';
import { TreeView } from './TreeView';
import { ExplainPanel } from './ExplainPanel';
import { ConflictBanner } from './ConflictBanner';
import { LogPanel } from './LogPanel';
import { ProgressBar } from './ProgressBar';
import { ThemeToggle } from './ThemeToggle';
import { RulesScreen } from './RulesScreen';

export function MainScreen(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'copy' | 'rules'>('copy');
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
  const [copyStatus, setCopyStatus] = useState<string>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [currentJob, setCurrentJob] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [dryRunReport, setDryRunReport] = useState<any>(null);
  const [rootOnly, setRootOnly] = useState(false);

  // Set up copy event listeners
  React.useEffect(() => {
    const unsubStatus = window.electronAPI.onCopyStatus((data: any) => {
      setCopyStatus(data.status);
    });

    const unsubJobStart = window.electronAPI.onCopyJobStart((data: any) => {
      setLogs((prev) => [
        ...prev,
        `[JOB START] ${data.srcRoot} → ${data.dstRoot}`,
      ]);
    });

    const unsubJobEnd = window.electronAPI.onCopyJobEnd((data: any) => {
      setCurrentJob((prev) => prev + 1);
      setLogs((prev) => [
        ...prev,
        `[JOB END] ${data.success ? 'Success' : 'Failed'} (exit code: ${data.exitCode})`,
      ]);
    });

    const unsubLogLine = window.electronAPI.onCopyLogLine((data: any) => {
      setLogs((prev) => [...prev, data.line]);
    });

    const unsubDone = window.electronAPI.onCopyDone(() => {
      setLogs((prev) => [...prev, '\n=== Copy completed successfully ===']);
    });

    const unsubError = window.electronAPI.onCopyError((data: any) => {
      const errorMsg = data.error || 'Unknown error occurred';
      setLogs((prev) => [
        ...prev,
        '\n=== ERROR ===',
        errorMsg,
        '=============',
      ]);
    });

    return () => {
      unsubStatus();
      unsubJobStart();
      unsubJobEnd();
      unsubLogLine();
      unsubDone();
      unsubError();
    };
  }, []);

  // Handle menu actions
  React.useEffect(() => {
    const unsubMenuAction = window.electronAPI.onMenuAction((data: { action: string; message?: string }) => {
      switch (data.action) {
        case 'selectSourceFolder':
          if (activeTab === 'copy') {
            handleSelectFolder('source');
          }
          break;
        case 'selectDestFolder':
          if (activeTab === 'copy') {
            handleSelectFolder('destination');
          }
          break;
        case 'switchToCopyTab':
          setActiveTab('copy');
          break;
        case 'switchToRulesTab':
          setActiveTab('rules');
          break;
        case 'showAbout':
          if (data.message) {
            alert(data.message);
          }
          break;
        // openRuleFile and saveRuleFile are handled by RulesScreen
        default:
          break;
      }
    });

    return () => {
      unsubMenuAction();
    };
  }, [activeTab]);

  // Helper to extract clean error message
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  };

  // Reset operation state (for retry after error)
  const handleReset = () => {
    setCopyStatus('idle');
    setLogs([]);
    setCurrentJob(0);
    setTotalJobs(0);
    setDryRunReport(null);
  };

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
    setErrorMessage(null); // Clear previous errors
    try {
      const result = await window.electronAPI.scan({
        source: sourcePath,
        dest: destPath,
        rootOnly,
      });
      setScanResult(result);
      setSelectedNode(null);
      // Reset copy state
      handleReset();
    } catch (error) {
      console.error('Scan failed:', error);
      const errorMsg = getErrorMessage(error);
      setErrorMessage(`Scan failed: ${errorMsg}`);
    } finally {
      setScanning(false);
    }
  };

  const handleDryRun = async () => {
    if (!scanResult) return;

    setLogs(['Starting dry run...']);
    setCopyStatus('dryrun');

    try {
      const result = await window.electronAPI.dryRun({
        scanId: scanResult.scanId,
        rootOnly,
      });

      if (result.success && result.report) {
        const report = result.report;
        setDryRunReport(report);
        setTotalJobs(report.plan.totalJobs);
        setLogs((prev) => [
          ...prev,
          `Dry run complete: ${report.plan.totalJobs} jobs`,
          `Estimated files: ${report.estimatedFiles || 'N/A'}`,
          `Estimated bytes: ${report.estimatedBytes || 'N/A'}`,
          `Valid plan: ${report.validPlan ? 'Yes' : 'No'}`,
        ]);
      } else {
        const errorMsg = result.error || 'Unknown error';
        setLogs((prev) => [
          ...prev,
          '\n=== Dry Run Failed ===',
          errorMsg,
          '=====================',
        ]);
      }

      setCopyStatus('idle');
    } catch (error) {
      console.error('Dry run error:', error);
      const errorMsg = getErrorMessage(error);
      setLogs((prev) => [
        ...prev,
        '\n=== Dry Run Error ===',
        errorMsg,
        '====================',
      ]);
      setCopyStatus('error');
    }
  };

  const handleCopy = async () => {
    if (!scanResult) return;

    setLogs(['Starting copy operation...']);
    setCopyStatus('copying');
    setCurrentJob(0);

    try {
      const result = await window.electronAPI.copy({
        scanId: scanResult.scanId,
        rootOnly,
      });

      if (!result.success) {
        const errorMsg = result.error || 'Copy operation failed';
        setLogs((prev) => [
          ...prev,
          '\n=== Copy Failed ===',
          errorMsg,
          '==================',
        ]);
        setCopyStatus('error');
      }
    } catch (error) {
      console.error('Copy error:', error);
      const errorMsg = getErrorMessage(error);
      setLogs((prev) => [
        ...prev,
        '\n=== Copy Error ===',
        errorMsg,
        '==================',
      ]);
      setCopyStatus('error');
    }
  };

  const handleCancel = async () => {
    try {
      await window.electronAPI.cancel();
      setLogs((prev) => [...prev, 'Cancellation requested...']);
    } catch (error) {
      console.error('Cancel failed:', error);
      const errorMsg = getErrorMessage(error);
      setLogs((prev) => [...prev, `Cancel failed: ${errorMsg}`]);
    }
  };

  // Helper function to check if childPath is inside parentPath
  const isPathInside = (childPath: string | null, parentPath: string | null): boolean => {
    if (!childPath || !parentPath) return false;
    
    // Normalize paths: remove trailing slashes and convert to lowercase (Windows is case-insensitive)
    const normalizePathString = (p: string): string => {
      let normalized = p.replace(/[/\\]+$/, ''); // Remove trailing slashes
      normalized = normalized.toLowerCase(); // Case-insensitive comparison
      // Ensure consistent separator
      normalized = normalized.replace(/\\/g, '/');
      return normalized;
    };

    const normalizedChild = normalizePathString(childPath);
    const normalizedParent = normalizePathString(parentPath);

    // Check if child starts with parent followed by a separator
    return (
      normalizedChild.startsWith(normalizedParent + '/') ||
      normalizedChild.startsWith(normalizedParent + '\\')
    );
  };

  // Check if source and destination are the same
  const hasSameFolderError =
    sourcePath !== null &&
    destPath !== null &&
    sourcePath.toLowerCase() === destPath.toLowerCase();

  // Check if destination is inside source (would cause recursion)
  const isDestInsideSource = isPathInside(destPath, sourcePath);

  // Check if source is inside destination (would overwrite source)
  const isSourceInsideDest = isPathInside(sourcePath, destPath);

  // Check if paths are missing
  const isSourceMissing = sourcePath === null;
  const isDestMissing = destPath === null;

  // Check if conflicts exist
  const hasConflicts = scanResult ? scanResult.conflicts.length > 0 : false;

  // Actions are disabled when paths are missing or any path error
  const actionsDisabled = 
    isSourceMissing || 
    isDestMissing || 
    hasSameFolderError || 
    isDestInsideSource || 
    isSourceInsideDest;

  // Dry Run and Copy are additionally disabled when conflicts exist
  const dryRunCopyDisabled = actionsDisabled || hasConflicts;

  // Cancel is enabled when copy is in progress
  const canCancel = copyStatus === 'copying' || copyStatus === 'dryrun';

  // Determine error message
  React.useEffect(() => {
    if (hasSameFolderError) {
      setErrorMessage(
        'Error: Source and destination must be different folders.'
      );
    } else if (isDestInsideSource) {
      setErrorMessage(
        'Error: Destination cannot be inside source folder (would cause recursion).'
      );
    } else if (isSourceInsideDest) {
      setErrorMessage(
        'Error: Source cannot be inside destination folder (would overwrite source).'
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
  }, [sourcePath, destPath, hasSameFolderError, isDestInsideSource, isSourceInsideDest, isSourceMissing, isDestMissing]);

  return (
    <div
      style={{
        padding: '24px',
        fontFamily: 'Segoe UI, sans-serif',
        maxWidth: '1400px',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      <ThemeToggle />
      <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>
        Smart Copy Utility
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('copy')}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: `1px solid var(--border-color)`,
            backgroundColor: activeTab === 'copy' ? 'var(--button-bg)' : 'var(--bg-secondary)',
            color: activeTab === 'copy' ? 'var(--button-text)' : 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 700,
          }}
        >
          Copy
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: `1px solid var(--border-color)`,
            backgroundColor: activeTab === 'rules' ? 'var(--button-bg)' : 'var(--bg-secondary)',
            color: activeTab === 'rules' ? 'var(--button-text)' : 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 700,
          }}
        >
          Rules
        </button>
      </div>

      {activeTab === 'copy' ? (
        <>
          {/* Folder Pickers */}
          <div style={{ marginBottom: '24px' }}>
            <FolderPicker
              label="Source Folder"
              kind="source"
              path={sourcePath}
              onSelect={handleSelectFolder}
              hasError={hasSameFolderError || isDestInsideSource || isSourceInsideDest}
              disabled={scanning || copyStatus !== 'idle'}
            />
            <FolderPicker
              label="Destination Folder"
              kind="destination"
              path={destPath}
              onSelect={handleSelectFolder}
              hasError={hasSameFolderError || isDestInsideSource || isSourceInsideDest}
              disabled={scanning || copyStatus !== 'idle'}
            />
          </div>

      {/* Root-Only Mode Toggle */}
      <div style={{ marginBottom: '24px' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
          title="When enabled, only .copyignore/.copyinclude files at the source root are applied. Nested rule files are ignored."
        >
          <input
            type="checkbox"
            checked={rootOnly}
            onChange={(e) => setRootOnly(e.target.checked)}
            style={{
              marginRight: '8px',
              width: '16px',
              height: '16px',
              cursor: 'pointer',
            }}
          />
          <span>Root rules only (ignore nested rule files)</span>
        </label>
      </div>

      {/* Error/Info Message */}
      {errorMessage && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '24px',
            backgroundColor: actionsDisabled ? 'var(--error-bg)' : 'var(--success-bg)',
            border: `1px solid ${actionsDisabled ? 'var(--error-border)' : 'var(--success-border)'}`,
            borderRadius: '4px',
            color: actionsDisabled ? 'var(--error-text)' : 'var(--success-text)',
            fontSize: '14px',
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Scanning Progress Indicator */}
      {scanning && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              border: '3px solid var(--border-color)',
              borderTop: '3px solid var(--button-preview)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
            Scanning source folder and discovering rules...
          </span>
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
            backgroundColor: actionsDisabled || scanning ? 'var(--button-disabled)' : 'var(--button-preview)',
            color: 'var(--button-text)',
            opacity: actionsDisabled || scanning ? 0.6 : 1,
          }}
        >
          {scanning ? 'Scanning...' : 'Preview'}
        </button>
        <button
          disabled={dryRunCopyDisabled || copyStatus !== 'idle'}
          onClick={handleDryRun}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: dryRunCopyDisabled || copyStatus !== 'idle' ? 'not-allowed' : 'pointer',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: dryRunCopyDisabled || copyStatus !== 'idle' ? 'var(--button-disabled)' : 'var(--button-dryrun)',
            color: 'var(--button-text)',
            opacity: dryRunCopyDisabled || copyStatus !== 'idle' ? 0.6 : 1,
          }}
          title={hasConflicts ? 'Resolve conflicts before running Dry Run' : ''}
        >
          Dry Run
        </button>
        <button
          disabled={dryRunCopyDisabled || copyStatus !== 'idle'}
          onClick={handleCopy}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: dryRunCopyDisabled || copyStatus !== 'idle' ? 'not-allowed' : 'pointer',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: dryRunCopyDisabled || copyStatus !== 'idle' ? 'var(--button-disabled)' : 'var(--button-copy)',
            color: 'var(--button-text)',
            opacity: dryRunCopyDisabled || copyStatus !== 'idle' ? 0.6 : 1,
          }}
          title={hasConflicts ? 'Resolve conflicts before running Copy' : ''}
        >
          Copy
        </button>
        <button
          disabled={!canCancel}
          onClick={handleCancel}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: !canCancel ? 'not-allowed' : 'pointer',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: !canCancel ? 'var(--button-disabled)' : 'var(--button-cancel)',
            color: 'var(--button-text)',
            opacity: !canCancel ? 0.6 : 1,
          }}
        >
          Cancel
        </button>
        {copyStatus === 'error' && (
          <button
            onClick={handleReset}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'var(--button-reset)',
              color: 'var(--button-text)',
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Error Summary Banner */}
      {copyStatus === 'error' && (
        <div
          style={{
            padding: '16px',
            marginBottom: '24px',
            backgroundColor: 'var(--error-bg)',
            border: '2px solid var(--error-border)',
            borderRadius: '4px',
            color: 'var(--error-text)',
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>
            ⚠️ Operation Failed
          </h3>
          <p style={{ margin: 0, fontSize: '14px' }}>
            The operation encountered an error. Check the log below for details. Click "Reset" to clear the error and try again.
          </p>
        </div>
      )}

      {/* Progress Bar */}
      {copyStatus !== 'idle' && (
        <ProgressBar
          current={currentJob}
          total={totalJobs}
          status={copyStatus}
        />
      )}

      {/* Log Panel */}
      {logs.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Operation Log
          </h3>
          <LogPanel logs={logs} />
        </div>
      )}

      {/* Conflict Banner */}
      {scanResult && <ConflictBanner conflicts={scanResult.conflicts} />}

      {/* Scan Statistics */}
      {scanResult && (
        <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
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
        </>
      ) : (
        <RulesScreen />
      )}
    </div>
  );
}
