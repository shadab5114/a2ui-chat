/**
 * ============================================================================
 * TOGGLE COMPONENT
 * ============================================================================
 * An animated on/off switch for binary choices (e.g., enabling a perk add-on).
 *
 * DATA BINDING:
 * This is the clearest example of A2UI data binding. The Toggle's bindingKey
 * connects it to the centralized state:
 *
 *   AI generates: { "component": "Toggle", "bindingKey": "toggles/streammax" }
 *   Client reads:  state.toggles.streammax → true/false
 *   Client writes: setValue("toggles/streammax", !currentValue)
 *
 * The AI never sees or manages this state directly — it only declares the
 * binding topology. The client handles the actual toggling.
 * ============================================================================
 */

import { useA2UIBinding } from '../../context/A2UIStateContext';

export function ToggleComponent({ id, label, bindingKey, defaultValue = false, disabled = false, description, accessibility }) {

  const { getValue, setValue, dispatchAction } = useA2UIBinding();

  // Read the current value from state via the binding key
  const currentValue = getValue(bindingKey);
  const isOn = currentValue !== undefined ? !!currentValue : defaultValue;

  const handleToggle = () => {
    if (disabled) return;

    // Write the new value to state via the binding key
    setValue(bindingKey, !isOn);

    // Also dispatch a toggle_perk action if this looks like a perk toggle
    const perkId = bindingKey?.split('/').pop();
    if (perkId && bindingKey?.startsWith('toggles')) {
      dispatchAction({
        type: 'toggle_perk',
        payload: { perkId },
      });
    }
  };

  const className = [
    'a2ui-toggle',
    isOn ? 'a2ui-toggle--on' : 'a2ui-toggle--off',
    disabled ? 'a2ui-toggle--disabled' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="a2ui-toggle-wrapper" id={id}>
      <div className="a2ui-toggle-content">
        <label className="a2ui-toggle-label" htmlFor={`${id}-input`}>
          {label}
        </label>
        {description && (
          <span className="a2ui-toggle-description">{description}</span>
        )}
      </div>
      <button
        id={`${id}-input`}
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-label={accessibility?.label || label}
        aria-description={accessibility?.description}
        className={className}
        onClick={handleToggle}
        disabled={disabled}
      >
        <span className="a2ui-toggle__track">
          <span className="a2ui-toggle__thumb" />
        </span>
      </button>
    </div>
  );
}
