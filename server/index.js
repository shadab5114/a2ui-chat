/**
 * ============================================================================
 * A2UI TELCOCONNECT — EXPRESS SERVER
 * ============================================================================
 *
 * This is the "Agent" in the A2UI protocol. It sits between the user and
 * Google's Gemini model, orchestrating the flow:
 *
 *   User prompt  →  Express Server  →  Gemini (with catalog + KB in system prompt)
 *                                   ←  A2UI JSON payload
 *                ←  JSON response
 *
 * The server's responsibilities:
 *   1. Load the trusted catalog at startup (the security allowlist)
 *   2. Build the system prompt with catalog + knowledge base
 *   3. Forward user messages to Gemini via the @google/generative-ai SDK
 *   4. Parse and validate the JSON response
 *   5. Return clean A2UI JSON to the React client
 *
 * SECURITY NOTE:
 * The catalog is loaded once at startup and never modified at runtime.
 * The client receives the catalog separately (embedded in the frontend build)
 * and uses it to validate incoming A2UI payloads — defense in depth.
 * ============================================================================
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildSystemPrompt } from './systemPrompt.js';

// ─── Configuration ──────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ Missing GEMINI_API_KEY in .env file.');
  console.error('   Copy .env.example to .env and add your key.');
  console.error('   Get a key at: https://aistudio.google.com/apikey');
  process.exit(1);
}

// ─── Load the Trusted Catalog ───────────────────────────────────────────────
// The catalog is loaded ONCE at startup. It defines which components the AI
// is allowed to generate and the client is allowed to render.

let catalog;
try {
  const catalogRaw = readFileSync(new URL('./catalog.json', import.meta.url), 'utf-8');
  // catalog.json is pure JSON — parse it directly (no comment stripping needed)
  catalog = JSON.parse(catalogRaw);
  console.log(
    `✅ Catalog loaded: ${Object.keys(catalog.components).length} components registered`
  );
  console.log(`   Components: ${Object.keys(catalog.components).join(', ')}`);
} catch (err) {
  console.error('❌ Failed to load catalog.json:', err.message);
  process.exit(1);
}

// ─── Initialize Gemini ──────────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Build the system prompt BEFORE creating the model so it can be
// passed to getGenerativeModel() — the correct location per the SDK.
// Passing systemInstruction to startChat() instead causes a 400 error
// because the SDK serializes it incorrectly at the proto level.
const systemPrompt = buildSystemPrompt(catalog);

const model = genAI.getGenerativeModel({
  model: 'gemini-3.1-flash-lite',
  // systemInstruction goes HERE (on the model), not in startChat()
  systemInstruction: systemPrompt,
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    maxOutputTokens: 8192,
    // Force JSON output — Gemini will always return a parseable JSON string
    responseMimeType: 'application/json',
  },
});

// ─── Express App Setup ──────────────────────────────────────────────────────

const app = express();

// Enable CORS for the React dev server (Vite runs on 5173 by default)
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
}));

app.use(express.json());

// ─── Health Check Endpoint ──────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    catalog: {
      components: Object.keys(catalog.components),
      count: Object.keys(catalog.components).length,
    },
  });
});

// ─── Catalog Endpoint ───────────────────────────────────────────────────────
// The client can fetch the catalog to validate incoming A2UI payloads
// (defense-in-depth: both server and client validate against the catalog)

app.get('/catalog', (req, res) => {
  res.json(catalog);
});

// ─── Chat Endpoint — The Core A2UI Pipeline ─────────────────────────────────
/**
 * POST /chat
 * Body: { message: string, history?: Array<{role: string, parts: [{text: string}]}> }
 *
 * Flow:
 *   1. Receive user's text message
 *   2. Start a Gemini chat with our system prompt (catalog + KB baked in)
 *   3. Send the user's message to Gemini
 *   4. Parse Gemini's JSON response
 *   5. Return the A2UI payload to the client
 */
app.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid "message" field. Expected a string.',
      });
    }

    console.log(`\n💬 User: "${message}"`);

    // Start a chat session with the system prompt and any prior history.
    // The system prompt contains the full catalog + knowledge base,
    // so Gemini knows exactly what components it can use and what
    // telecom data to reference.
    // systemInstruction is already baked into the model above.
    // startChat() only needs the conversation history here.
    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role,
        parts: msg.parts,
      })),
    });

    // Send the user's message and await the AI's A2UI JSON response
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    console.log(`🤖 Gemini responded (${responseText.length} chars)`);

    // ─── Parse and Validate the Response ──────────────────────────────
    // The AI should return pure JSON. We parse it and do basic validation.
    let a2uiPayload;
    try {
      a2uiPayload = JSON.parse(responseText);
    } catch (parseErr) {
      // If Gemini returned non-JSON (shouldn't happen with responseMimeType),
      // wrap the text in a simple Text component as a fallback
      console.warn('⚠️  Gemini returned non-JSON, wrapping in Text component');
      a2uiPayload = {
        surfaces: [{
          surfaceId: 'main',
          components: [{
            component: 'Text',
            id: 'fallback-text',
            text: responseText,
            variant: 'body',
          }],
        }],
      };
    }

    // Basic structural validation — ensure it has the expected shape
    if (!a2uiPayload.surfaces || !Array.isArray(a2uiPayload.surfaces)) {
      // If the AI returned a components array directly, wrap it
      if (Array.isArray(a2uiPayload.components)) {
        a2uiPayload = {
          surfaces: [{
            surfaceId: 'main',
            components: a2uiPayload.components,
          }],
        };
      } else if (Array.isArray(a2uiPayload)) {
        // If it returned a bare array
        a2uiPayload = {
          surfaces: [{
            surfaceId: 'main',
            components: a2uiPayload,
          }],
        };
      }
    }

    // Return the validated A2UI payload
    res.json(a2uiPayload);

  } catch (error) {
    // Log the full error so it's visible in the server terminal
    console.error('❌ Chat error:', error.message);
    console.error('   Stack:', error.stack);
    if (error.errorDetails) console.error('   Gemini details:', JSON.stringify(error.errorDetails));

    // Return 200 (not 500) with an A2UI error component so the frontend
    // can render a friendly message instead of throwing on !response.ok.
    res.status(200).json({
      surfaces: [{
        surfaceId: 'main',
        components: [{
          component: 'Container',
          id: 'error-container',
          variant: 'outlined',
          padding: 'md',
          gap: 'sm',
          children: [
            {
              component: 'Text',
              id: 'error-title',
              text: '⚠️ Something went wrong',
              variant: 'h3',
              color: 'error',
            },
            {
              component: 'Text',
              id: 'error-message',
              text: `I had trouble processing your request. Server error: ${error.message}`,
              variant: 'body',
              color: 'muted',
            },
          ],
        }],
      }],
    });
  }
});

// ─── Start Server ───────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║   🚀 TelcoConnect A2UI Server                               ║
║   Running on: http://localhost:${PORT}                        ║
║   Catalog:    ${Object.keys(catalog.components).length} components loaded                     ║
║   Model:      gemini-3.1-flash-lite                         ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
