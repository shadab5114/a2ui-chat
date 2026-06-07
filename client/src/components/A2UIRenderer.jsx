/**
 * ============================================================================
 * A2UI RENDERER — THE HEART OF THE GENERATIVE UI SYSTEM
 * ============================================================================
 *
 * This module is the client-side rendering engine that transforms A2UI JSON
 * payloads from the AI into live, interactive React components.
 *
 * HOW IT WORKS:
 * 1. Receives a JSON tree where each node has a `component` field
 * 2. Looks up that component name in COMPONENT_MAP (the client-side allowlist)
 * 3. If found, renders the corresponding React component with the node's props
 * 4. If not found, logs a warning and skips the node (SECURITY: no unknown rendering)
 * 5. For nodes with `children` arrays, recursively renders each child
 *
 * THIS IS THE CORE A2UI PRINCIPLE:
 * ─────────────────────────────────
 * The AI generates DECLARATIVE JSON describing what UI should appear.
 * The client maps that JSON to NATIVE components it already has.
 * The client never executes code from the AI — only data.
 *
 * SECURITY MODEL:
 * ─────────────────
 * - COMPONENT_MAP is a static allowlist. If the AI invents a component
 *   name (e.g., "ScriptInjector"), it gets rejected here.
 * - Props are passed to React components that only use what they expect.
 * - No eval(), no innerHTML, no code execution from AI output.
 * - Combined with the server-side catalog, this creates defense-in-depth.
 *
 * DATA FLOW:
 * ─────────────────
 *   Gemini JSON → A2UIRenderer.renderSurface(payload)
 *                  → For each component in surfaces[0].components:
 *                      → Look up COMPONENT_MAP[node.component]
 *                      → Render <Component {...props} />
 *                      → If children exist, recurse
 * ============================================================================
 */

// Import all A2UI component implementations
import { ContainerComponent } from './ui/ContainerComponent';
import { TextComponent } from './ui/TextComponent';
import { ButtonComponent } from './ui/ButtonComponent';
import { SelectionCardComponent } from './ui/SelectionCardComponent';
import { BadgeComponent } from './ui/BadgeComponent';
import { ToggleComponent } from './ui/ToggleComponent';
import { DividerComponent } from './ui/DividerComponent';
import { IconComponent } from './ui/IconComponent';
import { PerkCardComponent } from './ui/PerkCardComponent';

// Import raw MUI components for the hybrid catalog extension
import * as Mui from '@mui/material';
import { IconRenderer as MuiIcon } from './ui/IconRenderer';

import { useA2UIState } from '../context/A2UIStateContext';

const MuiButtonAdapter = (props) => {
  const { label, action, ...rest } = props;
  const a2uiState = useA2UIState();
  const onClick = () => {
    if (action && action.type === 'select_plan') {
      a2uiState.dispatch({ type: 'SELECT_PLAN', payload: action.payload.planId });
    }
  };
  return <Mui.Button {...rest} onClick={onClick}>{label}</Mui.Button>;
};

const MuiSwitchAdapter = (props) => {
  const { bindingKey, ...rest } = props;
  const a2uiState = useA2UIState();
  const checked = bindingKey ? !!a2uiState.toggles[bindingKey] : false;
  const onChange = (e) => {
    if (bindingKey) {
      a2uiState.dispatch({
        type: 'TOGGLE_PERK',
        payload: { key: bindingKey, value: e.target.checked }
      });
    }
  };
  return <Mui.Switch {...rest} checked={checked} onChange={onChange} />;
};

/**
 * COMPONENT_MAP — The Client-Side Allowlist
 *
 * This is the single source of truth for what components can be rendered.
 * Each key matches a `component` value from the catalog, and maps to
 * the React component that handles rendering.
 *
 * To add a new A2UI component:
 *   1. Add it to catalog.json (server-side allowlist)
 *   2. Create the React component in ./ui/
 *   3. Add the mapping here
 *
 * Any component NOT in this map is silently rejected.
 */
const COMPONENT_MAP = {
  Container:     ContainerComponent,
  Text:          TextComponent,
  Button:        ButtonComponent,
  SelectionCard: SelectionCardComponent,
  Badge:         BadgeComponent,
  Toggle:        ToggleComponent,
  Divider:       DividerComponent,
  Icon:          IconComponent,
  PerkCard:      PerkCardComponent,
  
  // Custom MUI Adapters and Extensions
  MuiIcon,
  MuiButton: MuiButtonAdapter,
  MuiSwitch: MuiSwitchAdapter
};

// Dynamically inject all MUI components into COMPONENT_MAP
Object.keys(Mui).forEach(key => {
  if (/^[A-Z]/.test(key) && typeof Mui[key] !== 'string' && !key.endsWith('Context') && key !== 'GlobalStyles' && key !== 'StyledEngineProvider') {
    const prefixedKey = `Mui${key}`;
    // Don't overwrite our custom adapters (like MuiButton, MuiSwitch, MuiIcon)
    if (!COMPONENT_MAP[prefixedKey]) {
      COMPONENT_MAP[prefixedKey] = Mui[key];
    }
  }
});

/**
 * A2UIRenderer — Recursive Component Renderer
 *
 * Takes a single A2UI JSON node and renders it as a React component.
 * If the node has children, they are rendered recursively.
 *
 * @param {object} props
 * @param {object} props.node - A single A2UI component JSON object
 *
 * @example
 * // The AI sends this JSON node:
 * {
 *   "component": "Text",
 *   "id": "greeting",
 *   "text": "Welcome to TelcoConnect!",
 *   "variant": "h2"
 * }
 *
 * // A2UIRenderer maps it to:
 * <TextComponent id="greeting" text="Welcome to TelcoConnect!" variant="h2" />
 */
export function A2UIRenderer({ node }) {
  // ── Guard: null/undefined nodes ────────────────────────────────────────
  if (!node || !node.component) {
    return null;
  }

  // ── Security Check: Is this component in our allowlist? ────────────────
  const Component = COMPONENT_MAP[node.component];

  if (!Component) {
    // SECURITY: Unknown component type — reject silently.
    // This prevents the AI from rendering arbitrary or malicious components.
    console.warn(
      `⚠️ A2UI Security: Rejected unknown component "${node.component}" (id: ${node.id}). ` +
      `Only these components are allowed: ${Object.keys(COMPONENT_MAP).join(', ')}`
    );
    return null;
  }

  // ── Render the component with its props ────────────────────────────────
  // We extract 'component' and 'children' from the JSON node.
  const { component, children, ...props } = node;

  // ── Handle Nested Children ─────────────────────────────────────────────
  // Raw MUI components expect React Elements as children, not JSON objects.
  // We recursively map the JSON children array into A2UIRenderer instances.
  let renderedChildren = null;
  if (children) {
    if (Array.isArray(children)) {
      renderedChildren = children.map((childNode, i) => {
        if (typeof childNode === 'string' || typeof childNode === 'number') return childNode;
        return <A2UIRenderer key={childNode?.id || i} node={childNode} />;
      });
    } else if (typeof children === 'string' || typeof children === 'number') {
      renderedChildren = children;
    } else if (typeof children === 'object') {
      renderedChildren = <A2UIRenderer key={children.id || 'child'} node={children} />;
    }
  }

  // ── MUI Adaptations ────────────────────────────────────────────────────
  // Some raw MUI components expect text as children, but our JSON schema
  // provides them as props. We adapt them here before rendering.
  if (component === 'MuiTypography' && props.text) {
    renderedChildren = props.text;
    delete props.text;
  }
  if (component === 'MuiButton' && props.label) {
    renderedChildren = props.label;
    delete props.label;
  }

  return (
    <Component {...props}>
      {renderedChildren}
    </Component>
  );
}

/**
 * renderSurface — Renders an entire A2UI surface (array of components)
 *
 * The A2UI protocol organizes components into "surfaces" — logical
 * rendering areas. For our chat app, we use a single "main" surface.
 *
 * @param {object} payload - The full A2UI response payload
 * @param {string} surfaceId - Which surface to render (default: "main")
 * @returns {JSX.Element|null} The rendered surface
 *
 * @example
 * // Full A2UI payload from the server:
 * {
 *   "surfaces": [{
 *     "surfaceId": "main",
 *     "components": [
 *       { "component": "Text", "id": "t1", "text": "Hello!", "variant": "h2" },
 *       { "component": "Button", "id": "b1", "label": "Get Started" }
 *     ]
 *   }]
 * }
 *
 * // renderSurface extracts the "main" surface and renders each component:
 * <div class="a2ui-surface">
 *   <TextComponent id="t1" text="Hello!" variant="h2" />
 *   <ButtonComponent id="b1" label="Get Started" />
 * </div>
 */
export function renderSurface(payload, surfaceId = 'main') {
  if (!payload || !payload.surfaces) {
    console.warn('A2UI: Invalid payload — missing "surfaces" array');
    return null;
  }

  // Find the requested surface
  const surface = payload.surfaces.find(s => s.surfaceId === surfaceId);
  if (!surface || !surface.components) {
    console.warn(`A2UI: Surface "${surfaceId}" not found in payload`);
    return null;
  }

  return (
    <div className="a2ui-surface">
      {surface.components.map((node, index) => (
        <A2UIRenderer
          key={node.id || `surface-${surfaceId}-${index}`}
          node={node}
        />
      ))}
    </div>
  );
}

/**
 * Utility: Get list of registered component types (for debugging/introspection)
 */
export function getRegisteredComponents() {
  return Object.keys(COMPONENT_MAP);
}
