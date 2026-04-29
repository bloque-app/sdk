import {
  Badge as BasicBadge,
  Tag as BasicTag,
} from '@rspress/core/theme-original';

/**
 * Tag — Bloque-styled pill component.
 * Preserves the original non-ejectable / eject-only / ejectable logic,
 * visual output is handled by .rspress-badge overrides in global.css.
 */
export const Tag = ({ tag }: { tag?: string }) => {
  if (!tag) return null;

  const tags = tag.includes(',') ? tag.split(',').map(t => t.trim()) : [tag];

  return (
    <>
      {tags.map(t => {
        if (t === 'non-ejectable') {
          return <BasicBadge key={t} text="non-ejectable" type="danger" />;
        }
        if (t === 'eject-only') {
          return <BasicBadge key={t} text="eject-only" type="warning" />;
        }
        if (t === 'ejectable') {
          return <BasicBadge key={t} text="ejectable" type="tip" />;
        }
        return <BasicTag key={t} tag={t} />;
      })}
    </>
  );
};
