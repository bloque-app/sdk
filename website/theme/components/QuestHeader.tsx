import type { ReactNode } from 'react';

interface QuestHeaderProps {
  prereqs?: string[];
  unlocks?: string[];
  time?: string;
}

export const QuestHeader = ({ prereqs = [], unlocks = [], time }: QuestHeaderProps) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: prereqs.length && unlocks.length ? '1fr 1fr' : '1fr',
        gap: '1px',
        border: '1px solid var(--rp-c-border)',
        borderRadius: '10px',
        overflow: 'hidden',
        margin: '1.5rem 0 2rem',
        background: 'var(--rp-c-border)',
      }}
    >
      {prereqs.length > 0 && (
        <Column
          label="Before this"
          items={prereqs}
          icon={<Arrow />}
          iconColor="var(--rp-c-text-3)"
          time={unlocks.length === 0 ? time : undefined}
        />
      )}
      {unlocks.length > 0 && (
        <Column
          label="After this"
          items={unlocks}
          icon={<Check />}
          iconColor="var(--bloque-success-text)"
          time={time}
        />
      )}
    </div>
  );
};

const Column = ({
  label,
  items,
  icon,
  iconColor,
  time,
}: {
  label: string;
  items: string[];
  icon: ReactNode;
  iconColor: string;
  time?: string;
}) => (
  <div
    style={{
      background: 'var(--rp-c-bg)',
      padding: '16px 20px',
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '10px',
      }}
    >
      <span
        style={{
          fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: 'var(--rp-c-text-3)',
          fontWeight: 400,
        }}
      >
        {label}
      </span>
      {time && (
        <span
          style={{
            fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
            fontSize: '10px',
            color: 'var(--bloque-accent)',
            letterSpacing: '0.05em',
          }}
        >
          {time}
        </span>
      )}
    </div>
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((item) => (
        <li
          key={item}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '3px 0',
            fontSize: '0.8125rem',
            color: 'var(--rp-c-text-2)',
            lineHeight: 1.5,
          }}
        >
          <span style={{ color: iconColor, flexShrink: 0, marginTop: '2px' }}>{icon}</span>
          {item}
        </li>
      ))}
    </ul>
  </div>
);

const Check = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="6.5" cy="6.5" r="6" stroke="currentColor" strokeWidth="1" />
    <path d="M3.5 6.5L5.5 8.5L9 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Arrow = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2.5 6.5H10.5M10.5 6.5L7.5 3.5M10.5 6.5L7.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
