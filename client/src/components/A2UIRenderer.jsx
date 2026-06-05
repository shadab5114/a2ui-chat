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
};

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
  // We spread the node properties directly to the React component.
  // Each component only destructures the props it knows about,
  // so unknown props are harmlessly ignored.
  const { component, ...props } = node;

  return <Component {...props} />;
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
