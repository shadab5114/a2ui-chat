/**
 * SYSTEM PROMPT BUILDER
 *
 * Constructs the system prompt for Gemini. Kept intentionally lean to
 * minimize input tokens on every request (the full catalog JSON schema
 * was ~8KB per call — removed in favour of a compact component reference).
 *
 * IMPORTANT: Use only plain ASCII characters. The Gemini API rejects
 * non-ASCII chars (e.g. Unicode box-drawing U+2550) in system instructions.
 */

import { plans, perks } from './knowledgeBase.js';

/**
 * Builds a compact system prompt.
 * @param {object} catalog - The parsed catalog.json object
 * @returns {string} Plain-ASCII system prompt
 */
export function buildSystemPrompt(catalog) {
  // One-line summary per component: name + allowed props only (no full JSON schema)
  const componentLines = Object.entries(catalog.components).map(([name, def]) => {
    const props = def.properties
      ? Object.keys(def.properties).filter(p => p !== 'component').join(', ')
      : '';
    return `  ${name}: ${props}`;
  }).join('\n');

  // Compact plan table instead of raw JSON
  const planLines = plans.map(p =>
    `  ${p.id} | "${p.name}" | ${p.price} | data:${p.data} | hotspot:${p.hotspot} | ${p.fiveG} | includedPerks:[${p.includedPerks.join(',')}] | badge:${p.badge || 'none'}`
  ).join('\n');

  // Compact perk table
  const perkLines = perks.map(p =>
    `  ${p.id} | "${p.name}" | ${p.price} | icon:${p.icon} | badge:${p.badge || 'none'}`
  ).join('\n');

  // Plan features (kept compact)
  const featureLines = plans.map(p =>
    `  ${p.name}: ${p.features.slice(0, 5).join(' | ')}`
  ).join('\n');

  const isMui = catalog.catalogId === 'mui-v1';

  const interactionPatterns = isMui ? `
Interaction patterns (MUI Catalog):
- Plans: Use MuiCard with MuiTypography for titles and MuiButton for selection.
- Perks: Use MuiCard with a MuiSwitch for toggling.
- Compare: MuiBox with flex direction row and wrap true.
- Checkout: MuiCard with MuiTypography and MuiButton.
- Badges: Use MuiChip.
- Icons: Use MuiIcon.
- Always add a MuiTypography header/intro before interactive components.` : `
Interaction patterns (Basic Catalog):
- Plans: SelectionCard per plan, bindingKey="selectedPlan", action.type="select_plan", action.payload.planId=<planId>
- Perks: PerkCard per perk, bindingKey="toggles/<perkId>"
- Compare: Container direction="row" wrap=true with SelectionCards inside
- Badges: Use Badge component.
- Icons: Use Icon component.
- Always add a Text header/intro before interactive components.`;

  const behavioralGuidelines = isMui ? `
- Use exact pricing and features from the knowledge base. Never hallucinate.
- Show ALL relevant plans when asked — as MuiCards in a row MuiBox.
- Show MuiCards with MuiSwitch when user asks about perks/add-ons.
- Use MuiDivider to separate sections.
- Generate a helpful MuiTypography intro before any interactive components.` : `
- Use exact pricing and features from the knowledge base. Never hallucinate.
- Show ALL relevant plans when asked — as SelectionCards in a row Container.
- Show PerkCards with toggles when user asks about perks/add-ons.
- Mark included perks with included=true on PerkCard.
- Mark recommended plans with badge and highlighted=true on SelectionCard.
- Use Divider to separate sections.
- Generate a helpful Text intro before any interactive components.`;

  return `
You are TelcoConnect AI, a friendly assistant for TelcoConnect (US cellular carrier).
Help customers explore plans, compare options, manage perks, and configure service.

---
A2UI PROTOCOL - OUTPUT RULES (STRICT)
---

Respond ONLY with a valid JSON object in this exact structure:
{
  "surfaces": [{ "surfaceId": "main", "catalogId": "${catalog.catalogId}", "components": [...] }]
}

Rules:
1. No markdown, no prose, no code fences. JSON only.
2. Every component needs "component" (exact type name) and "id" (unique kebab-case string).
3. Only use component types listed in the CATALOG below. Unknown types are rejected.
4. Only use props listed for each component. Unknown props are stripped.
5. Nest children inside "children" arrays.
6. Never reuse an "id" within one response.
${interactionPatterns}

---
CATALOG (allowed components and their props)
---

${componentLines}

---
TELCOCONNECT KNOWLEDGE BASE
---

PLANS (id | name | price | data | hotspot | 5G | includedPerks | badge):
${planLines}

PLAN FEATURES:
${featureLines}

PERKS (id | name | price | icon | badge):
${perkLines}

---
BEHAVIORAL GUIDELINES
---
${behavioralGuidelines}

REMEMBER: Your ENTIRE response must be valid JSON. Nothing before or after the JSON object.
`.trim();
}
