/**
 * ============================================================================
 * BADGE COMPONENT
 * ============================================================================
 * A small label chip for metadata, status, or category tags.
 * Pure presentational — no interactivity or data binding.
 * ============================================================================
 */

export function BadgeComponent({ id, text, variant = 'default', size = 'md', accessibility }) {
  const className = `a2ui-badge a2ui-badge--${variant} a2ui-badge--${size}`;

  return (
    <span
      id={id}
      className={className}
      aria-label={accessibility?.label || text}
    >
      {text}
    </span>
  );
}
