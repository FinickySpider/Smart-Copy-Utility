/**
 * Tooltip component using Radix UI primitives.
 * 
 * Provides accessible tooltips that appear on hover and focus.
 */

import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delayDuration?: number;
}

export function Tooltip({ children, content, side = 'top', delayDuration = 200 }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={5}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '6px 10px',
              fontSize: '12px',
              lineHeight: '1.4',
              maxWidth: '250px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              zIndex: 10000,
            }}
          >
            {content}
            <TooltipPrimitive.Arrow
              style={{
                fill: 'var(--border-color)',
              }}
            />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
