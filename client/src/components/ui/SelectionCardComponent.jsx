/**
 * ============================================================================
 * SELECTION CARD COMPONENT
 * ============================================================================
 * A clickable card representing a selectable option, primarily used for
 * telecom plans. This is the most complex interactive A2UI component.
 *
 * DATA BINDING PATTERN:
 * When the AI sets bindingKey="selectedPlan", clicking this card writes
 * the card's planId to state.selectedPlan. The component also READS from
 * that key to show whether it's currently selected (two-way binding).
 *
 * This demonstrates the A2UI principle: the AI defines the UI structure
 * and binding topology, the client manages the actual state.
 * ============================================================================
 */

import { useA2UIBinding } from '../../context/A2UIStateContext';
import { A2UIRenderer } from '../A2UIRenderer';

export function SelectionCardComponent({
  id, title, subtitle, price, features = [], badge, badgeVariant = 'default',
  bindingKey, action, highlighted = false, children = [], accessibility
}) {

  const { getValue, dispatchAction, setValue } = useA2UIBinding();

  // Two-way binding: check if THIS card is currently selected
  const currentSelection = bindingKey ? getValue(bindingKey) : null;
  const isSelected = currentSelection === id ||
    currentSelection === action?.payload?.planId;

  const handleClick = () => {
    // Update the binding key with this card's identifier
    if (bindingKey && action?.payload?.planId) {
      setValue(bindingKey, action.payload.planId);
    }
    // Dispatch the action (e.g., SELECT_PLAN)
    if (action) {
      dispatchAction(action);
    }
  };

  const className = [
    'a2ui-selection-card',
    isSelected ? 'a2ui-selection-card--selected' : '',
    highlighted ? 'a2ui-selection-card--highlighted' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      id={id}
      className={className}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={accessibility?.label || title}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
    >
      {/* Badge (e.g., "Most Popular") */}
      {badge && (
        <div className={`a2ui-selection-card__badge a2ui-badge--${badgeVariant}`}>
          {badge}
        </div>
      )}

      {/* Card Header */}
      <div className="a2ui-selection-card__header">
        <h3 className="a2ui-selection-card__title">{title}</h3>
        {subtitle && <p className="a2ui-selection-card__subtitle">{subtitle}</p>}
      </div>

      {/* Price */}
      {price && (
        <div className="a2ui-selection-card__price">
          {price}
        </div>
      )}

      {/* Features List */}
      {features.length > 0 && (
        <ul className="a2ui-selection-card__features">
          {features.map((feature, i) => (
            <li key={`${id}-feat-${i}`}>
              <span className="a2ui-selection-card__check">✓</span>
              {feature}
            </li>
          ))}
        </ul>
      )}

      {/* Optional nested children (rendered via the A2UI renderer) */}
      {children.length > 0 && (
        <div className="a2ui-selection-card__children">
          {children.map((child, index) => (
            <A2UIRenderer key={child.id || `${id}-child-${index}`} node={child} />
          ))}
        </div>
      )}

      {/* Selection indicator */}
      <div className="a2ui-selection-card__indicator">
        <div className={`a2ui-selection-card__radio ${isSelected ? 'a2ui-selection-card__radio--active' : ''}`}>
          {isSelected && <div className="a2ui-selection-card__radio-dot" />}
        </div>
        <span>{isSelected ? 'Selected' : 'Select this plan'}</span>
      </div>
    </div>
  );
}
