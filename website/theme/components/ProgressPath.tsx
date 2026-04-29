interface Step {
  label: string;
  href: string;
}

interface ProgressPathProps {
  steps: Step[];
  current: string;
}

export const ProgressPath = ({ steps, current }: ProgressPathProps) => {
  const currentIndex = steps.findIndex((s) => s.href === current || s.label === current);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0',
        margin: '0 0 2rem',
        padding: '12px 16px',
        background: 'var(--bloque-surface)',
        border: '1px solid var(--rp-c-border)',
        borderRadius: '8px',
        overflowX: 'auto',
      }}
    >
      {steps.map((step, i) => {
        const isActive = i === currentIndex;
        const isDone = i < currentIndex;
        const isLast = i === steps.length - 1;

        return (
          <div
            key={step.label}
            style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
          >
            <a
              href={step.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
                padding: '2px 4px',
              }}
            >
              <span
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontFamily: "'Geist Mono', monospace",
                  fontWeight: 600,
                  flexShrink: 0,
                  background: isActive
                    ? 'var(--bloque-accent)'
                    : isDone
                      ? 'var(--bloque-success-text)'
                      : 'transparent',
                  border: isActive
                    ? '1.5px solid var(--bloque-accent)'
                    : isDone
                      ? '1.5px solid var(--bloque-success-text)'
                      : '1.5px solid var(--rp-c-border)',
                  color: isActive || isDone ? 'var(--rp-c-bg)' : 'var(--rp-c-text-3)',
                }}
              >
                {isDone ? '✓' : i + 1}
              </span>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive
                    ? 'var(--bloque-accent)'
                    : isDone
                      ? 'var(--rp-c-text-2)'
                      : 'var(--rp-c-text-3)',
                  whiteSpace: 'nowrap',
                }}
              >
                {step.label}
              </span>
            </a>
            {!isLast && (
              <span
                style={{
                  width: '24px',
                  height: '1px',
                  background: isDone ? 'var(--bloque-success-text)' : 'var(--rp-c-border)',
                  margin: '0 4px',
                  opacity: isDone ? 0.5 : 1,
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
