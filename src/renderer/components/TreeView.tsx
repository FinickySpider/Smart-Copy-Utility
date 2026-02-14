import React, { useState } from 'react';
import { TreeNode } from './TreeNode';

interface TreeViewProps {
  rootNode: {
    path: string;
    name: string;
    isDir: boolean;
    state: string;
    hasChildren: boolean;
    modeAtPath: string;
  };
  scanId: string;
  onNodeSelect?: (node: TreeViewProps['rootNode']) => void;
}

export function TreeView({
  rootNode,
  scanId,
  onNodeSelect,
}: TreeViewProps): React.ReactElement {
  const [showExcluded, setShowExcluded] = useState(true);
  const [selectedNode, setSelectedNode] = useState<TreeViewProps['rootNode'] | null>(
    null
  );

  const handleNodeSelect = (node: TreeViewProps['rootNode']) => {
    setSelectedNode(node);
    if (onNodeSelect) {
      onNodeSelect(node);
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
      {/* Header with show excluded toggle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Preview Tree
        </h3>
        <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--text-primary)' }}>
          <input
            type="checkbox"
            checked={showExcluded}
            onChange={(e) => setShowExcluded(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          Show excluded files
        </label>
      </div>

      {/* Tree */}
      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <TreeNode
          node={rootNode}
          scanId={scanId}
          showExcluded={showExcluded}
          onSelect={handleNodeSelect}
          selected={selectedNode?.path === rootNode.path}
        />
      </div>
    </div>
  );
}
