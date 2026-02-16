import React, { useState, useEffect } from 'react';

export function SettingsScreen(): React.ReactElement {
  const [robocopyThreads, setRobocopyThreads] = useState<number>(8);
  const [scannerThreads, setScannerThreads] = useState<number>(4);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load current settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const [robocopyResult, scannerResult] = await Promise.all([
          window.electronAPI.getRobocopyThreads(),
          window.electronAPI.getScannerThreads(),
        ]);
        
        setRobocopyThreads(robocopyResult.threads);
        setScannerThreads(scannerResult.threads);
      } catch (error) {
        console.error('Failed to load settings:', error);
        setMessage({ type: 'error', text: 'Failed to load settings' });
      } finally {
        setLoading(false);
      }
    }
    
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const [robocopyResult, scannerResult] = await Promise.all([
        window.electronAPI.setRobocopyThreads({ threads: robocopyThreads }),
        window.electronAPI.setScannerThreads({ threads: scannerThreads }),
      ]);

      if (!robocopyResult.success || !scannerResult.success) {
        const errors = [];
        if (!robocopyResult.success) errors.push(`Robocopy: ${robocopyResult.error}`);
        if (!scannerResult.success) errors.push(`Scanner: ${scannerResult.error}`);
        throw new Error(errors.join('; '));
      }

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save settings' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Reset to defaults: robocopy=8, scanner=CPU/2
      const cpuCount = navigator.hardwareConcurrency || 4;
      const defaultScanner = Math.max(1, Math.floor(cpuCount / 2));

      await Promise.all([
        window.electronAPI.setRobocopyThreads({ threads: 8 }),
        window.electronAPI.setScannerThreads({ threads: defaultScanner }),
      ]);

      setRobocopyThreads(8);
      setScannerThreads(defaultScanner);
      setMessage({ type: 'success', text: 'Settings reset to defaults!' });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to reset settings:', error);
      setMessage({ type: 'error', text: 'Failed to reset settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading settings...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ 
        fontSize: '18px', 
        fontWeight: 700, 
        marginBottom: '24px',
        color: 'var(--text-primary)' 
      }}>
        Settings
      </h2>

      {/* Performance Section */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '20px',
        marginBottom: '16px',
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: 700,
          marginBottom: '16px',
          color: 'var(--text-primary)',
        }}>
          Performance
        </h3>

        {/* Robocopy Threads */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '8px',
            color: 'var(--text-primary)',
          }}>
            Robocopy Threads
          </label>
          <input
            type="number"
            min="1"
            max="128"
            value={robocopyThreads}
            onChange={(e) => setRobocopyThreads(Math.max(1, Math.min(128, parseInt(e.target.value) || 1)))}
            style={{
              width: '100px',
              padding: '6px 10px',
              fontSize: '13px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
          />
          <div style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginTop: '6px',
          }}>
            Number of parallel file copy threads (1-128). Default: 8. Higher values speed up copying many small files.
          </div>
        </div>

        {/* Scanner Threads */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '8px',
            color: 'var(--text-primary)',
          }}>
            Scanner Threads
          </label>
          <input
            type="number"
            min="1"
            max="32"
            value={scannerThreads}
            onChange={(e) => setScannerThreads(Math.max(1, Math.min(32, parseInt(e.target.value) || 1)))}
            style={{
              width: '100px',
              padding: '6px 10px',
              fontSize: '13px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
          />
          <div style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginTop: '6px',
          }}>
            Number of parallel directory scanner threads (1-32). Default: CPU count / 2. Higher values speed up scanning large projects.
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '4px',
          marginBottom: '16px',
          backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: message.type === 'success' ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
          fontSize: '13px',
        }}>
          {message.text}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '8px 20px',
            fontSize: '13px',
            fontWeight: 600,
            borderRadius: '4px',
            border: 'none',
            backgroundColor: saving ? 'var(--bg-secondary)' : 'var(--button-bg)',
            color: saving ? 'var(--text-secondary)' : 'var(--button-text)',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        <button
          onClick={handleReset}
          disabled={saving}
          style={{
            padding: '8px 20px',
            fontSize: '13px',
            fontWeight: 600,
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'transparent',
            color: 'var(--text-primary)',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
