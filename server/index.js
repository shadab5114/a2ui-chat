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
 *   1. Load the trusted catalogs at startup (the security allowlist)
 *   2. Build the system prompt with catalog + knowledge base for each catalog
 *   3. Negotiate the catalog based on client's supported catalogs
 *   4. Forward user messages to Gemini via the @google/generative-ai SDK
 *   5. Parse and validate the JSON response
 *   6. Return clean A2UI JSON to the React client
 *
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
  process.exit(1);
}

// ─── Load the Trusted Catalogs ──────────────────────────────────────────────

const catalogs = {};
try {
  const basicRaw = readFileSync(new URL('./catalogs/catalog-basic.json', import.meta.url), 'utf-8');
  catalogs['basic-v1'] = JSON.parse(basicRaw);
  
  const muiRaw = readFileSync(new URL('./catalogs/catalog-mui.json', import.meta.url), 'utf-8');
  catalogs['mui-v1'] = JSON.parse(muiRaw);

  console.log(`✅ Catalogs loaded: [${Object.keys(catalogs).join(', ')}]`);
} catch (err) {
  console.error('❌ Failed to load catalogs:', err.message);
  process.exit(1);
}

// ─── Initialize Gemini Models ───────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const models = {};

// Initialize a model for each catalog
for (const [catalogId, catalog] of Object.entries(catalogs)) {
  const systemPrompt = buildSystemPrompt(catalog);
  models[catalogId] = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite',
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  });
}

// ─── Express App Setup ──────────────────────────────────────────────────────

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
}));

app.use(express.json());

// ─── Health Check Endpoint ──────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    catalogs: Object.keys(catalogs)
  });
});

// ─── Catalog Endpoint ───────────────────────────────────────────────────────

app.get('/catalog', (req, res) => {
  // Default to basic if no specific catalog is requested
  const id = req.query.id || 'basic-v1';
  if (catalogs[id]) {
    res.json(catalogs[id]);
  } else {
    res.status(404).json({ error: 'Catalog not found' });
  }
});

// ─── Chat Endpoint — The Core A2UI Pipeline ─────────────────────────────────

app.post('/chat', async (req, res) => {
  try {
    const { message, history = [], metadata = {} } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid "message" field. Expected a string.',
      });
    }

    // ─── Catalog Negotiation ─────────────────────────────────────────────
    let selectedCatalogId = 'basic-v1'; // fallback default
    
    if (metadata.a2uiClientCapabilities && metadata.a2uiClientCapabilities.supportedCatalogIds) {
      const clientSupported = metadata.a2uiClientCapabilities.supportedCatalogIds;
      // Find the highest preference catalog that the server supports
      for (const id of clientSupported) {
        if (catalogs[id]) {
          selectedCatalogId = id;
          break;
        }
      }
    }

    console.log(`\n💬 User: "${message}"`);
    console.log(`⚙️  Negotiated Catalog: ${selectedCatalogId}`);

    const model = models[selectedCatalogId];
    if (!model) {
      throw new Error(`Model not initialized for catalog: ${selectedCatalogId}`);
    }

    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role,
        parts: msg.parts,
      })),
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    console.log(`🤖 Gemini responded (${responseText.length} chars) using ${selectedCatalogId}`);

    // ─── Parse and Validate the Response ──────────────────────────────
    let a2uiPayload;
    try {
      a2uiPayload = JSON.parse(responseText);
    } catch (parseErr) {
      console.warn('⚠️  Gemini returned non-JSON, wrapping in Text component');
      a2uiPayload = {
        surfaces: [{
          surfaceId: 'main',
          catalogId: selectedCatalogId,
          components: [{
            component: 'Text',
            id: 'fallback-text',
            text: responseText,
            variant: 'body',
          }],
        }],
      };
    }

    if (!a2uiPayload.surfaces || !Array.isArray(a2uiPayload.surfaces)) {
      if (Array.isArray(a2uiPayload.components)) {
        a2uiPayload = {
          surfaces: [{
            surfaceId: 'main',
            catalogId: selectedCatalogId,
            components: a2uiPayload.components,
          }],
        };
      } else if (Array.isArray(a2uiPayload)) {
        a2uiPayload = {
          surfaces: [{
            surfaceId: 'main',
            catalogId: selectedCatalogId,
            components: a2uiPayload,
          }],
        };
      }
    }

    // Ensure catalogId is present in surface
    if (a2uiPayload.surfaces && a2uiPayload.surfaces.length > 0) {
      a2uiPayload.surfaces.forEach(surface => {
        if (!surface.catalogId) {
          surface.catalogId = selectedCatalogId;
        }
      });
    }

    res.json(a2uiPayload);

  } catch (error) {
    console.error('❌ Chat error:', error.message);
    if (error.errorDetails) console.error('   Gemini details:', JSON.stringify(error.errorDetails));

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
║   Catalogs Loaded: ${Object.keys(catalogs).join(', ')}       ║
║   Model:      gemini-3.1-flash-lite                         ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
