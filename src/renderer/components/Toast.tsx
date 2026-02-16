/**
 * Toast notification system using Radix UI primitives.
 * 
 * Provides accessible, dismissible notifications with auto-dismiss support.
 */

import React from 'react';
import * as Toast from '@radix-ui/react-toast';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

interface ToastContextValue {
  showToast: (message: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const showToast = React.useCallback((message: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const toast: ToastMessage = { id, ...message };
    setToasts((prev) => [...prev, toast]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Toast.Provider swipeDirection="right">
        {children}
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            duration={toast.duration ?? 5000}
            onOpenChange={(open) => {
              if (!open) removeToast(toast.id);
            }}
            style={{
              backgroundColor: getToastColor(toast.type),
              border: `1px solid ${getToastBorderColor(toast.type)}`,
              borderRadius: '6px',
              padding: '12px 16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              maxWidth: '400px',
            }}
          >
            <Toast.Title
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: getToastTextColor(toast.type),
                margin: 0,
              }}
            >
              {toast.title}
            </Toast.Title>
            {toast.description && (
              <Toast.Description
                style={{
                  fontSize: '13px',
                  color: getToastTextColor(toast.type),
                  margin: 0,
                  opacity: 0.9,
                }}
              >
                {toast.description}
              </Toast.Description>
            )}
            <Toast.Close
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'transparent',
                border: 'none',
                color: getToastTextColor(toast.type),
                cursor: 'pointer',
                fontSize: '18px',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                opacity: 0.7,
              }}
              aria-label="Close"
            >
              ×
            </Toast.Close>
          </Toast.Root>
        ))}
        <Toast.Viewport
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxWidth: '420px',
            margin: 0,
            listStyle: 'none',
            zIndex: 2147483647,
            outline: 'none',
          }}
        />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function getToastColor(type?: string): string {
  switch (type) {
    case 'success':
      return 'rgba(34, 197, 94, 0.1)';
    case 'error':
      return 'rgba(239, 68, 68, 0.1)';
    case 'warning':
      return 'rgba(245, 158, 11, 0.1)';
    default:
      return 'rgba(59, 130, 246, 0.1)';
  }
}

function getToastBorderColor(type?: string): string {
  switch (type) {
    case 'success':
      return 'rgba(34, 197, 94, 0.3)';
    case 'error':
      return 'rgba(239, 68, 68, 0.3)';
    case 'warning':
      return 'rgba(245, 158, 11, 0.3)';
    default:
      return 'rgba(59, 130, 246, 0.3)';
  }
}

function getToastTextColor(type?: string): string {
  switch (type) {
    case 'success':
      return 'rgb(34, 197, 94)';
    case 'error':
      return 'rgb(239, 68, 68)';
    case 'warning':
      return 'rgb(245, 158, 11)';
    default:
      return 'rgb(59, 130, 246)';
  }
}
