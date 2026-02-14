import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  status: string;
}

/**
 * ProgressBar displays copy operation progress.
 */
export function ProgressBar({
  current,
  total,
  status,
}: ProgressBarProps): React.ReactElement {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  const getStatusColor = () => {
    switch (status) {
      case 'copying':
        return '#3498db';
      case 'done':
        return '#27ae60';
      case 'error':
        return '#e74c3c';
      case 'cancelled':
        return '#95a5a6';
      default:
        return '#95a5a6';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Idle';
      case 'scanning':
        return 'Scanning...';
      case 'ready':
        return 'Ready';
      case 'dryrun':
        return 'Dry Run...';
      case 'copying':
        return 'Copying...';
      case 'cancelled':
        return 'Cancelled';
      case 'done':
        return 'Complete';
      case 'error':
        return 'Error';
      default:
        return status;
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: 500,
          color: '#333',
        }}
      >
        <span>{getStatusText()}</span>
        <span>
          {current} / {total} jobs
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: '24px',
          backgroundColor: '#e9ecef',
          borderRadius: '4px',
          overflow: 'hidden',
          border: '1px solid #ced4da',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: getStatusColor(),
            transition: 'width 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          {percentage > 10 && `${percentage}%`}
        </div>
      </div>
    </div>
  );
}
