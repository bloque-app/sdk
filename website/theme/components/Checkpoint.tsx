interface CheckpointProps {
  title: string;
  expected?: string;
  hint?: string;
}

export const Checkpoint = ({ title, expected, hint }: CheckpointProps) => {
  return (
    <div
      style={{
        borderLeft: '3px solid var(--bloque-success-border)',
        background: 'var(--bloque-success-bg)',
        borderRadius: '0 8px 8px 0',
        padding: '14px 18px',
        margin: '1.5rem 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: expected ? '10px' : 0,
        }}
      >
        <CheckCircle />
        <span
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--bloque-success-text)',
            lineHeight: 1.4,
          }}
        >
          {title}
        </span>
      </div>
      {expected && (
        <div
          style={{
            fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
            fontSize: '0.75rem',
            color: 'var(--rp-c-text-3)',
            background: 'var(--rp-c-bg)',
            border: '1px solid var(--rp-c-border)',
            borderRadius: '6px',
            padding: '10px 12px',
            overflowX: 'auto',
            whiteSpace: 'pre',
            lineHeight: 1.6,
          }}
        >
          {expected}
        </div>
      )}
      {hint && (
        <div
          style={{
            marginTop: '8px',
            fontSize: '0.8rem',
            color: 'var(--bloque-success-text)',
            opacity: 0.75,
            lineHeight: 1.5,
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
};

const CheckCircle = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    style={{ color: 'var(--bloque-success-text)', flexShrink: 0 }}
  >
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.25" />
    <path
      d="M4.5 8L7 10.5L11.5 6"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
