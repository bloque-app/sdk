interface ConceptCardProps {
  term: string;
  definition: string;
  example?: string;
  format?: 'inline' | 'code';
}

export const ConceptCard = ({ term, definition, example, format = 'inline' }: ConceptCardProps) => {
  return (
    <div
      style={{
        borderLeft: '3px solid var(--bloque-accent-border)',
        background: 'var(--bloque-surface)',
        borderRadius: '0 8px 8px 0',
        padding: '14px 18px',
        margin: '1rem 0',
      }}
    >
      <div
        style={{
          fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'var(--bloque-accent)',
          marginBottom: '6px',
          letterSpacing: '-0.01em',
        }}
      >
        {term}
      </div>
      <div
        style={{
          fontSize: '0.875rem',
          color: 'var(--rp-c-text-2)',
          lineHeight: 1.65,
        }}
      >
        {definition}
      </div>
      {example && (
        <div
          style={{
            marginTop: '10px',
            fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
            fontSize: '0.75rem',
            color: 'var(--rp-c-text-3)',
            background: 'var(--rp-c-bg)',
            border: '1px solid var(--rp-c-border)',
            borderRadius: '6px',
            padding: '8px 12px',
            overflowX: 'auto',
            whiteSpace: format === 'code' ? 'pre' : 'normal',
          }}
        >
          {example}
        </div>
      )}
    </div>
  );
};
