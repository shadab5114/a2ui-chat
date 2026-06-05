/**
 * ============================================================================
 * A2UI STATE CONTEXT — CENTRALIZED INTERACTION STATE
 * ============================================================================
 *
 * This is the "data binding" layer of the A2UI system. When the AI generates
 * a component with a `bindingKey` (e.g., a Toggle with bindingKey="toggles/streammax"),
 * that component reads and writes to THIS centralized state object.
 *
 * WHY THIS MATTERS:
 * In the A2UI protocol, the AI declares WHAT the UI should look like, but the
 * CLIENT owns the state. The AI says "render a Toggle bound to toggles/streammax",
 * and the client manages that boolean value. This clean separation means:
 *   - The AI never directly manipulates DOM state
 *   - All user interactions are tracked in one place
 *   - The state can be sent back to the AI for context-aware follow-ups
 *
 * STATE SHAPE:
 * {
 *   selectedPlan: string | null,     // ID of the currently selected plan
 *   toggles: { [perkId]: boolean },  // On/off state for each perk toggle
 *   cart: {                          // Accumulated selections for checkout
 *     planId: string | null,
 *     perks: string[],
 *   },
 *   interactions: [],                // Log of user interactions (for analytics)
 * }
 *
 * JSON POINTER-STYLE BINDING:
 * Components use "/" separated paths as binding keys:
 *   - "selectedPlan"          → state.selectedPlan
 *   - "toggles/streammax"     → state.toggles.streammax
 *   - "toggles/musicflow"     → state.toggles.musicflow
 * ============================================================================
 */

import { createContext, useContext, useReducer, useCallback } from 'react';

// ─── Initial State ──────────────────────────────────────────────────────────

const initialState = {
  selectedPlan: null,
  toggles: {},
  cart: {
    planId: null,
    perks: [],
  },
  interactions: [],
};

// ─── Action Types ───────────────────────────────────────────────────────────

const ActionTypes = {
  SET_VALUE: 'SET_VALUE',         // Generic setter for any binding key
  SELECT_PLAN: 'SELECT_PLAN',     // Specific action for plan selection
  TOGGLE_PERK: 'TOGGLE_PERK',     // Specific action for perk toggle
  CONFIRM: 'CONFIRM',             // User confirmed their selections
  RESET: 'RESET',                 // Reset all state
  SEND_MESSAGE: 'SEND_MESSAGE',   // Trigger sending a message to the AI
};

// ─── Reducer ────────────────────────────────────────────────────────────────

function a2uiReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_VALUE: {
      // Parse the binding key path (e.g., "toggles/streammax" → ["toggles", "streammax"])
      const path = action.key.split('/');
      const newState = { ...state };

      // Navigate to the parent and set the value
      let current = newState;
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = { ...current[path[i]] };
        current = current[path[i]];
      }
      current[path[path.length - 1]] = action.value;

      // Log the interaction
      newState.interactions = [
        ...state.interactions,
        { type: 'SET_VALUE', key: action.key, value: action.value, timestamp: Date.now() },
      ];

      return newState;
    }

    case ActionTypes.SELECT_PLAN: {
      return {
        ...state,
        selectedPlan: action.planId,
        cart: { ...state.cart, planId: action.planId },
        interactions: [
          ...state.interactions,
          { type: 'SELECT_PLAN', planId: action.planId, timestamp: Date.now() },
        ],
      };
    }

    case ActionTypes.TOGGLE_PERK: {
      const perkId = action.perkId;
      const newValue = !state.toggles[perkId];
      const newPerks = newValue
        ? [...state.cart.perks.filter(p => p !== perkId), perkId]
        : state.cart.perks.filter(p => p !== perkId);

      return {
        ...state,
        toggles: { ...state.toggles, [perkId]: newValue },
        cart: { ...state.cart, perks: newPerks },
        interactions: [
          ...state.interactions,
          { type: 'TOGGLE_PERK', perkId, value: newValue, timestamp: Date.now() },
        ],
      };
    }

    case ActionTypes.CONFIRM: {
      return {
        ...state,
        interactions: [
          ...state.interactions,
          { type: 'CONFIRM', cart: { ...state.cart }, timestamp: Date.now() },
        ],
      };
    }

    case ActionTypes.RESET:
      return { ...initialState };

    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────

const A2UIStateContext = createContext(null);
const A2UIDispatchContext = createContext(null);

/**
 * Provider component that wraps the app and provides A2UI state to all
 * rendered components. Every A2UI component (Toggle, SelectionCard, Button)
 * can access and modify this shared state.
 */
export function A2UIStateProvider({ children }) {
  const [state, dispatch] = useReducer(a2uiReducer, initialState);

  return (
    <A2UIStateContext.Provider value={state}>
      <A2UIDispatchContext.Provider value={dispatch}>
        {children}
      </A2UIDispatchContext.Provider>
    </A2UIStateContext.Provider>
  );
}

/**
 * Hook to read the current A2UI state.
 * Used by bound components to check their current value.
 */
export function useA2UIState() {
  const context = useContext(A2UIStateContext);
  if (!context && context !== initialState) {
    throw new Error('useA2UIState must be used within A2UIStateProvider');
  }
  return context;
}

/**
 * Hook to dispatch actions to the A2UI state.
 * Used by interactive components (Toggle, Button, SelectionCard) to update state.
 */
export function useA2UIDispatch() {
  const context = useContext(A2UIDispatchContext);
  if (!context) {
    throw new Error('useA2UIDispatch must be used within A2UIStateProvider');
  }
  return context;
}

/**
 * Hook that provides a convenient API for reading values from binding keys
 * and dispatching actions. This is the primary hook used by A2UI components.
 */
export function useA2UIBinding() {
  const state = useA2UIState();
  const dispatch = useA2UIDispatch();

  // Read a value from a binding key path (e.g., "toggles/streammax")
  const getValue = useCallback((bindingKey) => {
    if (!bindingKey) return undefined;
    const path = bindingKey.split('/');
    let current = state;
    for (const segment of path) {
      if (current == null) return undefined;
      current = current[segment];
    }
    return current;
  }, [state]);

  // Set a value at a binding key path
  const setValue = useCallback((bindingKey, value) => {
    dispatch({ type: ActionTypes.SET_VALUE, key: bindingKey, value });
  }, [dispatch]);

  // Dispatch a typed action (select_plan, toggle_perk, confirm, etc.)
  const dispatchAction = useCallback((action) => {
    if (!action) return;
    switch (action.type) {
      case 'select_plan':
        dispatch({ type: ActionTypes.SELECT_PLAN, planId: action.payload?.planId });
        break;
      case 'toggle_perk':
        dispatch({ type: ActionTypes.TOGGLE_PERK, perkId: action.payload?.perkId });
        break;
      case 'confirm':
        dispatch({ type: ActionTypes.CONFIRM });
        break;
      case 'send_message':
        // This will be handled by the parent chat component
        if (action.payload?.onSendMessage) {
          action.payload.onSendMessage(action.payload.message);
        }
        break;
      default:
        console.warn(`Unknown A2UI action type: ${action.type}`);
    }
  }, [dispatch]);

  return { state, getValue, setValue, dispatchAction };
}

export { ActionTypes };
