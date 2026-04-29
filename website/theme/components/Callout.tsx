import type { ReactNode } from 'react';

type CalloutType = 'tip' | 'warning' | 'danger' | 'info' | 'note';

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}

const LABELS: Record<CalloutType, string> = {
  tip: 'Tip',
  note: 'Note',
  warning: 'Warning',
  danger: 'Danger',
  info: 'Info',
};

/**
 * Callout — Bloque-styled note/tip/warning/danger block for MDX.
 *
 * Usage:
 *   import { Callout } from '@theme';
 *   <Callout type="tip" title="Custom title">Content here</Callout>
 *
 * All colors resolve via CSS tokens → auto-adapts dark/light.
 */
export const Callout = ({ type = 'note', title, children }: CalloutProps) => {
  const label = title ?? LABELS[type];

  return (
    <div
      style={{
        borderLeft: '3px solid',
        borderLeftColor: `var(--bloque-${type}-border, var(--bloque-tip-border))`,
        background: `var(--bloque-${type}-bg, var(--bloque-tip-bg))`,
        borderRadius: '8px',
        padding: '12px 16px',
        margin: '1.25rem 0',
        fontSize: '0.875rem',
        lineHeight: 1.6,
      }}
    >
      {label && (
        <div
          style={{
            fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.25em',
            fontWeight: 400,
            color: `var(--bloque-${type}-text, var(--bloque-tip-text))`,
            marginBottom: '6px',
            opacity: 0.85,
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          color: `var(--bloque-${type}-text, var(--bloque-tip-text))`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
