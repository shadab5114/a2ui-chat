/**
 * ============================================================================
 * DIVIDER COMPONENT
 * ============================================================================
 * A simple horizontal separator between content sections.
 * Purely presentational.
 * ============================================================================
 */

export function DividerComponent({ id, spacing = 'md' }) {
  const className = `a2ui-divider a2ui-divider--${spacing}`;
  return <hr id={id} className={className} aria-hidden="true" />;
}
