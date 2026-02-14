import React, { useState } from 'react';

interface TreeNodeProps {
  node: {
    path: string;
    name: string;
    isDir: boolean;
    state: string;
    hasChildren: boolean;
    modeAtPath: string;
  };
  scanId: string;
  showExcluded: boolean;
  onSelect?: (node: TreeNodeProps['node']) => void;
  selected?: boolean;
}

export function TreeNode({
  node,
  scanId,
  showExcluded,
  onSelect,
  selected = false,
}: TreeNodeProps): React.ReactElement | null {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<TreeNodeProps['node'][] | null>(null);
  const [loading, setLoading] = useState(false);

  // Don't render excluded nodes if showExcluded is false
  if (!showExcluded && node.state === 'EXCLUDED') {
    return null;
  }

  const handleToggle = async () => {
    if (!node.isDir || !node.hasChildren) return;

    if (!expanded && children === null) {
      // Load children
      setLoading(true);
      try {
        const result = await window.electronAPI.listChildren({
          scanId,
          dirPath: node.path,
        });
        setChildren(result.children);
      } catch (error) {
        console.error('Failed to load children:', error);
        setChildren([]);
      } finally {
        setLoading(false);
      }
    }

    setExpanded(!expanded);
  };

  const handleClick = () => {
    if (onSelect) {
      onSelect(node);
    }
  };

  // Determine node color/icon based on state
  const getStateColor = (): string => {
    switch (node.state) {
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

  const getStateIcon = (): string => {
    switch (node.state) {
      case 'INCLUDED':
        return '✓';
      case 'EXCLUDED':
        return '✗';
      case 'CONFLICT':
        return '⚠';
      default:
        return '?';
    }
  };

  return (
    <div>
      {/* Node row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          cursor: 'pointer',
          backgroundColor: selected ? 'var(--bg-hover)' : 'transparent',
          borderRadius: '4px',
        }}
        onClick={handleClick}
      >
        {/* Expand/collapse indicator */}
        {node.isDir && node.hasChildren ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            style={{
              marginRight: '8px',
              cursor: 'pointer',
              userSelect: 'none',
              width: '16px',
              display: 'inline-block',
            }}
          >
            {loading ? '⋯' : expanded ? '▼' : '▶'}
          </span>
        ) : (
          <span style={{ marginRight: '8px', width: '16px', display: 'inline-block' }} />
        )}

        {/* State icon */}
        <span
          style={{
            marginRight: '8px',
            color: getStateColor(),
            fontWeight: 'bold',
            fontSize: '12px',
          }}
        >
          {getStateIcon()}
        </span>

        {/* Node name */}
        <span
          style={{
            fontSize: '14px',
            color: node.state === 'EXCLUDED' ? 'var(--tree-excluded)' : 'var(--text-primary)',
            fontFamily: 'Segoe UI, sans-serif',
          }}
        >
          {node.name}
          {node.isDir && '/'}
        </span>
      </div>

      {/* Children */}
      {expanded && children && (
        <div style={{ marginLeft: '24px' }}>
          {children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              scanId={scanId}
              showExcluded={showExcluded}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
