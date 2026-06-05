/**
 * ============================================================================
 * BUTTON COMPONENT
 * ============================================================================
 * Interactive button that dispatches A2UI actions when clicked.
 *
 * The `action` prop is the key A2UI concept here — it's a declarative
 * descriptor of WHAT should happen, not HOW. The action is dispatched to
 * the centralized A2UI state via the useA2UIBinding hook.
 *
 * Example action from the AI:
 *   { "type": "select_plan", "payload": { "planId": "unlimited-plus" } }
 *
 * The Button doesn't know what "select_plan" means — it just dispatches it.
 * The state reducer handles the actual state mutation.
 * ============================================================================
 */

import { useA2UIBinding } from '../../context/A2UIStateContext';
import { IconComponent } from './IconComponent';

export function ButtonComponent({ id, label, variant = 'primary', size = 'md', disabled = false, fullWidth = false, action, icon, accessibility }) {

  const { dispatchAction } = useA2UIBinding();

  const handleClick = () => {
    if (disabled) return;
    if (action) {
      dispatchAction(action);
    }
  };

  const className = [
    'a2ui-button',
    `a2ui-button--${variant}`,
    `a2ui-button--${size}`,
    fullWidth ? 'a2ui-button--full' : '',
    disabled ? 'a2ui-button--disabled' : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      id={id}
      className={className}
      onClick={handleClick}
      disabled={disabled}
      aria-label={accessibility?.label || label}
      aria-description={accessibility?.description}
    >
      {icon && <IconComponent id={`${id}-icon`} name={icon} size="sm" />}
      <span>{label}</span>
    </button>
  );
}
