/**
 * ============================================================================
 * CONTAINER COMPONENT
 * ============================================================================
 * A layout wrapper that arranges child components using CSS flexbox.
 * Maps to the A2UI "Container" catalog entry.
 *
 * This is the most-used structural component — nearly every AI response
 * will use Container to group and arrange other components.
 *
 * Variants:
 *   - default:  Transparent, no border or shadow
 *   - card:     Rounded corners, subtle background, slight shadow
 *   - elevated: Like card but with stronger shadow and border
 *   - outlined: Transparent background with a visible border
 *   - glass:    Glassmorphism effect with backdrop blur
 * ============================================================================
 */

import { A2UIRenderer } from '../A2UIRenderer';

export function ContainerComponent({ id, children = [], direction = 'column', gap = 'md', padding = 'none', align = 'stretch', justify = 'start', wrap = false, variant = 'default', accessibility }) {

  const gapMap = { none: '0', xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' };
  const paddingMap = { none: '0', sm: '8px', md: '16px', lg: '24px' };
  const justifyMap = { start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between', around: 'space-around' };
  const alignMap = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' };

  const style = {
    display: 'flex',
    flexDirection: direction,
    gap: gapMap[gap] || gapMap.md,
    padding: paddingMap[padding] || paddingMap.none,
    alignItems: alignMap[align] || alignMap.stretch,
    justifyContent: justifyMap[justify] || justifyMap.start,
    flexWrap: wrap ? 'wrap' : 'nowrap',
  };

  const className = `a2ui-container a2ui-container--${variant}`;

  return (
    <div
      id={id}
      className={className}
      style={style}
      aria-label={accessibility?.label}
      aria-description={accessibility?.description}
    >
      {children.map((child, index) => (
        <A2UIRenderer key={child.id || `${id}-child-${index}`} node={child} />
      ))}
    </div>
  );
}
