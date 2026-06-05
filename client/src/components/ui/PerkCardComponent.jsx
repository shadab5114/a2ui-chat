/**
 * ============================================================================
 * PERK CARD COMPONENT
 * ============================================================================
 * A specialized card for entertainment perks and add-ons.
 * Combines display elements (icon, title, description, price, badge)
 * with an embedded Toggle for activation.
 *
 * This demonstrates how A2UI components can be "composite" — the PerkCard
 * is a single catalog entry that internally uses a Toggle for data binding,
 * but the AI interacts with it as one unit.
 *
 * When `included` is true, the perk is already part of the user's plan
 * and the toggle is forced on / non-interactive.
 * ============================================================================
 */

import { useA2UIBinding } from '../../context/A2UIStateContext';
import { IconComponent } from './IconComponent';

export function PerkCardComponent({
  id, title, description, price, icon, bindingKey,
  included = false, badge, badgeVariant = 'default', accessibility
}) {

  const { getValue, setValue, dispatchAction } = useA2UIBinding();

  // Read toggle state from binding key
  const currentValue = getValue(bindingKey);
  const isEnabled = included || (currentValue !== undefined ? !!currentValue : false);

  const handleToggle = () => {
    if (included) return; // Can't toggle off included perks

    const newValue = !isEnabled;
    setValue(bindingKey, newValue);

    // Also dispatch toggle_perk action
    const perkId = bindingKey?.split('/').pop();
    if (perkId) {
      dispatchAction({
        type: 'toggle_perk',
        payload: { perkId },
      });
    }
  };

  const className = [
    'a2ui-perk-card',
    isEnabled ? 'a2ui-perk-card--enabled' : '',
    included ? 'a2ui-perk-card--included' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      id={id}
      className={className}
      aria-label={accessibility?.label || title}
    >
      {/* Badge */}
      {badge && (
        <div className={`a2ui-perk-card__badge a2ui-badge--${badgeVariant}`}>
          {badge}
        </div>
      )}

      <div className="a2ui-perk-card__content">
        {/* Icon */}
        {icon && (
          <div className="a2ui-perk-card__icon">
            <IconComponent id={`${id}-icon`} name={icon} size="lg" color="accent" />
          </div>
        )}

        {/* Info */}
        <div className="a2ui-perk-card__info">
          <h4 className="a2ui-perk-card__title">{title}</h4>
          {description && (
            <p className="a2ui-perk-card__description">{description}</p>
          )}
          {price && (
            <span className="a2ui-perk-card__price">
              {included ? 'Included with your plan' : price}
            </span>
          )}
        </div>

        {/* Toggle */}
        <div className="a2ui-perk-card__toggle">
          <button
            type="button"
            role="switch"
            aria-checked={isEnabled}
            aria-label={`${isEnabled ? 'Disable' : 'Enable'} ${title}`}
            className={`a2ui-toggle ${isEnabled ? 'a2ui-toggle--on' : 'a2ui-toggle--off'} ${included ? 'a2ui-toggle--disabled' : ''}`}
            onClick={handleToggle}
            disabled={included}
          >
            <span className="a2ui-toggle__track">
              <span className="a2ui-toggle__thumb" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
