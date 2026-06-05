# 🚀 A2UI TelcoConnect — Generative UI Chat Experience

A complete end-to-end implementation of the **A2UI (Agent-to-User Interface) protocol** — a next-generation chat experience for TelcoConnect, a US telecom company.

The AI assistant doesn't just text-reply to user queries — it dynamically generates **custom interactive interfaces** (plan comparison cards, perk toggles, configuration forms) using declarative JSON that the client natively renders.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     BROWSER (React)                          │
│                                                              │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────┐  │
│  │  Chat UI     │──▶│ A2UIRenderer │──▶│ React Components│  │
│  │  (App.jsx)   │    │ (allowlist)  │    │ (native render)│  │
│  └─────────────┘    └──────────────┘    └────────────────┘  │
│        │                    ▲                                │
│        │ user text          │ A2UI JSON                      │
│        ▼                    │                                │
├────────────────────────────────────────────────────────────── │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                EXPRESS SERVER                           │ │
│  │                                                         │ │
│  │  catalog.json ──▶ System Prompt ──▶ Gemini API          │ │
│  │  (allowlist)      (+ Knowledge Base)     │              │ │
│  │                                          ▼              │ │
│  │                              A2UI JSON Response         │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Core A2UI Principle

1. **The AI decides WHAT** — Gemini generates declarative JSON describing which UI components to show
2. **The client decides HOW** — React maps that JSON to native components via the `A2UIRenderer`
3. **The catalog is the security boundary** — Only allowlisted components are rendered; everything else is rejected

---

## 📁 Project Structure

```
A2UI/
├── server/                     # Backend (Express + Gemini)
│   ├── index.js                # Express server, /chat endpoint
│   ├── catalog.json            # A2UI component catalog (security allowlist)
│   ├── knowledgeBase.js        # Hardcoded telecom plans & perks data
│   ├── systemPrompt.js         # Gemini system prompt builder
│   ├── .env.example            # Environment variable template
│   └── package.json
│
├── client/                     # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── A2UIRenderer.jsx        # ⭐ The recursive rendering engine
│   │   │   └── ui/
│   │   │       ├── ContainerComponent.jsx
│   │   │       ├── TextComponent.jsx
│   │   │       ├── ButtonComponent.jsx
│   │   │       ├── SelectionCardComponent.jsx
│   │   │       ├── BadgeComponent.jsx
│   │   │       ├── ToggleComponent.jsx
│   │   │       ├── DividerComponent.jsx
│   │   │       ├── IconComponent.jsx
│   │   │       └── PerkCardComponent.jsx
│   │   ├── context/
│   │   │   └── A2UIStateContext.jsx     # ⭐ Centralized data binding state
│   │   ├── App.jsx                      # Chat interface
│   │   ├── App.css                      # Chat shell styles
│   │   ├── index.css                    # Global design system
│   │   └── main.jsx                     # Entry point
│   ├── index.html
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) installed
- A [Gemini API key](https://aistudio.google.com/apikey)

### 1. Set up the backend

```bash
cd server

# Create your .env file with your Gemini API key
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Install dependencies
bun install

# Start the server
bun run dev
```

The server will start on **http://localhost:3001**.

### 2. Start the frontend

```bash
# In a new terminal
cd client

# Install dependencies
bun install

# Start the dev server
bun run dev
```

The app will open on **http://localhost:5173**.

### 3. Try these prompts

| Prompt | What it generates |
|--------|-------------------|
| "Show me your available plans" | SelectionCard components for all 3 plans |
| "Compare Unlimited Plus vs Premium" | Side-by-side plan comparison cards |
| "What streaming perks can I add?" | PerkCard components with toggles |
| "I want Premium with StreamMax" | Confirmation checkout UI |

---

## 🔐 Security Model

The A2UI catalog (`catalog.json`) acts as the XSS prevention layer:

1. **Server-side**: The catalog is injected into the Gemini system prompt, constraining what the AI can generate
2. **Client-side**: The `A2UIRenderer` rejects any component not in its `COMPONENT_MAP` allowlist
3. **No raw HTML**: All text is rendered through React's JSX escaping — no `dangerouslySetInnerHTML`
4. **No code execution**: The AI output is pure data (JSON) — never executable code
5. **Icons are allowlisted**: Only predefined SVG paths are rendered — no arbitrary SVG injection

---

## 📐 A2UI Data Binding

Components use JSON pointer-style `bindingKey` paths for two-way data binding:

```
bindingKey: "selectedPlan"      → state.selectedPlan
bindingKey: "toggles/streammax" → state.toggles.streammax
bindingKey: "toggles/musicflow" → state.toggles.musicflow
```

The centralized state (`A2UIStateContext.jsx`) tracks all user interactions:

```javascript
{
  selectedPlan: "unlimited-plus",     // Currently selected plan
  toggles: {                          // Perk toggle states
    streammax: true,
    musicflow: false,
    gamezone: true
  },
  cart: {                             // Accumulated selections
    planId: "unlimited-plus",
    perks: ["streammax", "gamezone"]
  }
}
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| AI Model | Google Gemini 2.0 Flash |
| Backend | Node.js, Express |
| Frontend | React 19, Vite |
| Runtime | Bun |
| Protocol | A2UI v0.9 |
| Styling | Vanilla CSS (custom design system) |

---

## 📚 Learn More

- [A2UI Protocol Specification](https://a2ui.org/specification/v0_9/)
- [A2UI Basic Catalog](https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json)
- [Google Gemini API](https://ai.google.dev/)
