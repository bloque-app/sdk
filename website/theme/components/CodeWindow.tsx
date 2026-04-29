import type { ReactNode } from 'react';

interface CodeWindowProps {
  filename?: string;
  children: ReactNode;
  /** 'dark' forces dark chrome even in light mode — for hero code demos */
  variant?: 'auto' | 'dark';
}

/**
 * CodeWindow — Window chrome wrapper for code demos.
 *
 * Usage in MDX (for hero or featured sections):
 *   import { CodeWindow } from '@theme';
 *   <CodeWindow filename="sdk.ts">
 *     ```typescript
 *     const bloque = new SDK({ ... });
 *     ```
 *   </CodeWindow>
 *
 * Renders traffic-light dots + optional filename label above the code.
 */
export const CodeWindow = ({
  filename,
  children,
  variant = 'auto',
}: CodeWindowProps) => {
  const isDark = variant === 'dark';

  return (
    <div
      style={{
        borderRadius: '12px',
        border: isDark
          ? '1px solid rgba(255,255,255,0.10)'
          : '1px solid var(--rp-c-border)',
        background: isDark ? '#0f0e1a' : 'var(--rp-code-block-bg)',
        overflow: 'hidden',
        margin: '1.25rem 0',
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          borderBottom: isDark
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid var(--rp-c-border)',
          background: isDark ? '#0f0e1a' : 'var(--rp-code-block-bg)',
        }}
      >
        {/* Traffic-light dots */}
        <span
          aria-hidden="true"
          style={{
            display: 'inline-flex',
            gap: '5px',
            marginRight: '6px',
          }}
        >
          {['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0.15)'].map(
            (bg, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: isDark ? bg : 'rgba(13,12,23,0.12)',
                }}
              />
            ),
          )}
        </span>
        {/* Filename */}
        {filename && (
          <span
            style={{
              fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.02em',
              color: isDark
                ? 'rgba(160,154,191,0.60)'
                : 'var(--rp-c-text-3)',
            }}
          >
            {filename}
          </span>
        )}
      </div>
      {/* Content */}
      <div>{children}</div>
    </div>
  );
};
