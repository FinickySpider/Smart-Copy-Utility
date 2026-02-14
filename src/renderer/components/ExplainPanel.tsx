import React, { useEffect, useState } from 'react';

interface ExplainPanelProps {
  scanId: string;
  selectedNode: {
    path: string;
    name: string;
    state: string;
    modeAtPath: string;
  } | null;
}

interface ExplainData {
  path: string;
  name: string;
  decision: string;
  mode: string;
  ruleChain: string[];
  matchingPatterns: Array<{
    patternText: string;
    lineNumber: number;
    ruleFilePath: string;
  }>;
}

export function ExplainPanel({
  scanId,
  selectedNode,
}: ExplainPanelProps): React.ReactElement {
  const [explainData, setExplainData] = useState<ExplainData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedNode) {
      setExplainData(null);
      return;
    }

    // Load explain data for the selected node
    setLoading(true);
    window.electronAPI
      .explain({ scanId, nodePath: selectedNode.path })
      .then((response) => {
        setExplainData(response.explain);
      })
      .catch((error) => {
        console.error('Failed to load explain data:', error);
        setExplainData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [scanId, selectedNode]);

  const handleOpenInExplorer = (dirPath: string) => {
    window.electronAPI.openInExplorer({ dirPath });
  };

  const handleCopyPath = (text: string) => {
    window.electronAPI.copyToClipboard({ text });
  };

  if (!selectedNode) {
    return (
      <div
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '16px',
          backgroundColor: 'var(--bg-secondary)',
          fontFamily: 'Segoe UI, sans-serif',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Explain Decision
        </h3>
        <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-tertiary)' }}>
          Select a file or folder in the tree to see why it was included or excluded.
        </p>
      </div>
    );
  }

  if (loading || !explainData) {
    return (
      <div
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '16px',
          backgroundColor: 'var(--bg-secondary)',
          fontFamily: 'Segoe UI, sans-serif',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Explain Decision
        </h3>
        <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-tertiary)' }}>
          Loading...
        </p>
      </div>
    );
  }

  const getDecisionColor = (): string => {
    switch (explainData.decision) {
      case 'INCLUDED':
        return 'var(--tree-included)';
      case 'EXCLUDED':
        return 'var(--tree-excluded)';
      case 'CONFLICT':
        return 'var(--tree-conflict)';
      default:
        return 'var(--text-primary)';
    }
  };

  const getDecisionText = (): string => {
    switch (explainData.decision) {
      case 'INCLUDED':
        return 'Included';
      case 'EXCLUDED':
        return 'Excluded';
      case 'CONFLICT':
        return 'Conflict';
      default:
        return 'Unknown';
    }
  };

  return (
    <div
      style={{
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
        padding: '16px',
        backgroundColor: 'var(--bg-secondary)',
        fontFamily: 'Segoe UI, sans-serif',
      }}
    >
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
        Explain Decision
      </h3>

      {/* Path */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          Path
        </div>
        <div
          style={{
            fontSize: '14px',
            fontFamily: 'Consolas, monospace',
            backgroundColor: 'var(--bg-primary)',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
          }}
        >
          {explainData.path}
        </div>
        <button
          onClick={() => handleCopyPath(explainData.path)}
          style={{
            marginTop: '6px',
            padding: '4px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--button-bg)',
            color: 'var(--text-primary)',
          }}
        >
          Copy Path
        </button>
      </div>

      {/* Decision */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          Decision
        </div>
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: getDecisionColor(),
          }}
        >
          {getDecisionText()}
        </div>
      </div>

      {/* Mode */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          Active Mode
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{explainData.mode}</div>
      </div>

      {/* Rule Chain */}
      {explainData.ruleChain.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Rule File Chain
          </div>
          <div style={{ fontSize: '14px' }}>
            {explainData.ruleChain.map((rulePath, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '6px',
                  padding: '6px',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  fontFamily: 'Consolas, monospace',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                }}
              >
                <div>{rulePath}</div>
                <button
                  onClick={() => handleOpenInExplorer(rulePath.substring(0, rulePath.lastIndexOf('\\')))}
                  style={{
                    marginTop: '4px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--button-bg)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Open in Explorer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matching Patterns */}
      {explainData.matchingPatterns.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Matching Patterns
          </div>
          <div style={{ fontSize: '14px' }}>
            {explainData.matchingPatterns.map((pattern, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '8px',
                  padding: '8px',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'Consolas, monospace',
                    fontSize: '13px',
                    marginBottom: '4px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {pattern.patternText}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {pattern.ruleFilePath} : line {pattern.lineNumber}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {explainData.matchingPatterns.length === 0 && explainData.mode !== 'NONE' && (
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', opacity: 0.7 }}>
          No patterns matched this file.
        </div>
      )}
    </div>
  );
}
