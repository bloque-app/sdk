import type { CSSProperties } from 'react';

interface EyebrowLabelProps {
  children: string;
  /** Override alignment, default 'left' */
  align?: 'left' | 'center';
  style?: CSSProperties;
}

/**
 * EyebrowLabel — The Bloque [●] section-header micro-label.
 *
 * Usage in MDX:
 *   import { EyebrowLabel } from '@theme';
 *   <EyebrowLabel>CHAPTER 01</EyebrowLabel>
 *
 * Renders: ● CHAPTER 01
 * Font: mono 10px, uppercase, tight letter-spacing, muted.
 * Dot: 6px circle in --bloque-accent (auto-switches dark/light).
 */
export const EyebrowLabel = ({
  children,
  align = 'left',
  style,
}: EyebrowLabelProps) => {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        ...style,
      }}
    >
      {/* Accent dot */}
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: 'var(--bloque-accent)',
          flexShrink: 0,
        }}
      />
      {/* Label */}
      <span
        style={{
          fontFamily: "'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace",
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.28em',
          color: 'var(--rp-c-text-3)',
          fontWeight: 400,
          lineHeight: 1,
        }}
      >
        {children}
      </span>
    </span>
  );
};
