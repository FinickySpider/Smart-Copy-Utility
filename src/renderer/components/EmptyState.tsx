/**
 * Empty state component for showing friendly messages when there's no content.
 */

import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon = '📂', title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-16)',
        textAlign: 'center',
        minHeight: '300px',
      }}
      className="fade-in"
    >
      <div
        style={{
          fontSize: '64px',
          marginBottom: 'var(--space-4)',
          opacity: 0.6,
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-2)',
          margin: 0,
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: 'var(--font-size-base)',
            color: 'var(--text-secondary)',
            maxWidth: '400px',
            marginTop: 'var(--space-2)',
            marginBottom: 'var(--space-6)',
            lineHeight: 'var(--line-height-relaxed)',
          }}
        >
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            fontSize: 'var(--font-size-md)',
            fontWeight: 'var(--font-weight-semibold)',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            backgroundColor: 'var(--button-bg)',
            color: 'var(--button-text)',
            cursor: 'pointer',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
