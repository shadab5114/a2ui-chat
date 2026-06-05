/**
 * ============================================================================
 * APP.JSX — TELCOCONNECT CHAT INTERFACE
 * ============================================================================
 *
 * The main application component. Implements a premium chat interface where:
 *   - The user types text messages
 *   - The backend forwards them to Gemini with the A2UI catalog
 *   - Gemini responds with A2UI JSON
 *   - The A2UIRenderer maps that JSON to live React components
 *
 * The user sees interactive UI (plan cards, toggles, buttons) — not raw JSON.
 * This is the A2UI experience: AI-generated, client-rendered dynamic interfaces.
 * ============================================================================
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { A2UIStateProvider, useA2UIState } from './context/A2UIStateContext';
import { renderSurface } from './components/A2UIRenderer';
import './App.css';

const API_URL = 'http://localhost:3001';

// ─── Suggested Prompts (Welcome Screen) ─────────────────────────────────────

const SUGGESTED_PROMPTS = [
  {
    text: "Show me your available plans",
    icon: "📱",
    description: "Browse all cellular plans"
  },
  {
    text: "Compare Unlimited Plus vs Premium",
    icon: "⚖️",
    description: "Side-by-side plan comparison"
  },
  {
    text: "What streaming perks can I add?",
    icon: "🎬",
    description: "Explore entertainment add-ons"
  },
  {
    text: "I want the Premium plan with all perks",
    icon: "🛒",
    description: "Configure and checkout"
  },
];

// ─── Message Types ──────────────────────────────────────────────────────────

/**
 * Each message in the chat history has:
 *   - role: 'user' | 'assistant'
 *   - content: string (for user) or A2UI payload object (for assistant)
 *   - timestamp: when the message was sent
 */

// ─── Chat Component (Inner, needs state context) ────────────────────────────

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const a2uiState = useA2UIState();

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /**
   * Send a message to the A2UI backend.
   * The backend forwards it to Gemini and returns A2UI JSON.
   */
  const sendMessage = async (messageText) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: messageText.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Build conversation history for context.
      // IMPORTANT: We only send text summaries for AI messages (not full A2UI JSON),
      // because the full A2UI payloads can be 10-50KB each and would overflow
      // Gemini's context window. We also cap at the last 6 messages.
      const recentMessages = messages.slice(-6);
      const history = recentMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{
          text: msg.role === 'user'
            ? msg.content
            // For AI turns: just a placeholder — the system prompt has all the context
            : '[Rendered interactive UI with telecom plan/perk information]'
        }],
      }));

      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText.trim(),
          history,
        }),
      });

      // Always parse the JSON body — server returns A2UI JSON even for errors
      // (it returns HTTP 200 with an A2UI error component instead of throwing).
      const a2uiPayload = await response.json();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: a2uiPayload,
        timestamp: Date.now(),
      }]);

    } catch (err) {
      // Only reaches here for true network failures (server unreachable, CORS, etc.)
      console.error('Network error:', err);
      setError(err.message);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: {
          surfaces: [{
            surfaceId: 'main',
            components: [{
              component: 'Container',
              id: `err-${Date.now()}`,
              variant: 'outlined',
              padding: 'md',
              gap: 'sm',
              children: [
                {
                  component: 'Text',
                  id: `err-title-${Date.now()}`,
                  text: '⚠️ Connection Error',
                  variant: 'h3',
                  color: 'error',
                },
                {
                  component: 'Text',
                  id: `err-body-${Date.now()}`,
                  text: `Could not reach the server at ${API_URL}. Make sure the backend is running with: cd server && bun run dev`,
                  variant: 'body',
                  color: 'muted',
                },
              ],
            }],
          }],
        },
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestedPrompt = (prompt) => {
    sendMessage(prompt);
  };

  const isWelcomeScreen = messages.length === 0;

  return (
    <div className="chat-app">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="chat-header">
        <div className="chat-header__brand">
          <div className="chat-header__logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
          </div>
          <div>
            <h1 className="chat-header__title">TelcoConnect</h1>
            <span className="chat-header__subtitle">AI Assistant</span>
          </div>
        </div>
        <div className="chat-header__status">
          <span className="chat-header__status-dot"></span>
          <span>Online</span>
        </div>
      </header>

      {/* ── Messages Area ───────────────────────────────────────────────── */}
      <main className="chat-messages">
        {isWelcomeScreen ? (
          /* ── Welcome Screen ─────────────────────────────────────────── */
          <div className="welcome-screen">
            <div className="welcome-screen__hero">
              <div className="welcome-screen__icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.5 2l1.19 3.81L19.5 7l-3.81 1.19L14.5 12l-1.19-3.81L9.5 7l3.81-1.19L14.5 2zM7 7l.75 2.25L10 10l-2.25.75L7 13l-.75-2.25L4 10l2.25-.75L7 7zm7 7l.94 3.06L18 18l-3.06.94L14 22l-.94-3.06L10 18l3.06-.94L14 14z" />
                </svg>
              </div>
              <h2 className="welcome-screen__title">
                Welcome to TelcoConnect AI
              </h2>
              <p className="welcome-screen__description">
                I can help you explore plans, compare options, and manage your wireless perks.
                Try asking me anything about our cellular plans and entertainment add-ons.
              </p>
            </div>

            <div className="welcome-screen__prompts">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  className="suggested-prompt"
                  onClick={() => handleSuggestedPrompt(prompt.text)}
                >
                  <span className="suggested-prompt__icon">{prompt.icon}</span>
                  <div className="suggested-prompt__content">
                    <span className="suggested-prompt__text">{prompt.text}</span>
                    <span className="suggested-prompt__description">{prompt.description}</span>
                  </div>
                  <svg className="suggested-prompt__arrow" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                  </svg>
                </button>
              ))}
            </div>

            <div className="welcome-screen__footer">
              <span className="welcome-screen__badge">Powered by A2UI Protocol</span>
              <span className="welcome-screen__badge">Gemini AI</span>
            </div>
          </div>
        ) : (
          /* ── Chat Messages ──────────────────────────────────────────── */
          <div className="messages-list">
            {messages.map((message, index) => (
              <div
                key={`msg-${index}`}
                className={`message message--${message.role}`}
              >
                {message.role === 'assistant' && (
                  <div className="message__avatar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14.5 2l1.19 3.81L19.5 7l-3.81 1.19L14.5 12l-1.19-3.81L9.5 7l3.81-1.19L14.5 2zM7 7l.75 2.25L10 10l-2.25.75L7 13l-.75-2.25L4 10l2.25-.75L7 7zm7 7l.94 3.06L18 18l-3.06.94L14 22l-.94-3.06L10 18l3.06-.94L14 14z" />
                    </svg>
                  </div>
                )}
                <div className="message__content">
                  {message.role === 'user' ? (
                    <div className="message__text">{message.content}</div>
                  ) : (
                    /* ── THIS IS WHERE A2UI MAGIC HAPPENS ──────────── */
                    /* The AI's JSON payload is rendered into live React */
                    /* components by the A2UIRenderer engine.           */
                    <div className="message__a2ui">
                      {renderSurface(message.content)}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="message message--assistant">
                <div className="message__avatar">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.5 2l1.19 3.81L19.5 7l-3.81 1.19L14.5 12l-1.19-3.81L9.5 7l3.81-1.19L14.5 2z" />
                  </svg>
                </div>
                <div className="message__content">
                  <div className="typing-indicator">
                    <span className="typing-indicator__dot"></span>
                    <span className="typing-indicator__dot"></span>
                    <span className="typing-indicator__dot"></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* ── State Debug Panel (dev only) ────────────────────────────────── */}
      {messages.length > 0 && (a2uiState.selectedPlan || Object.keys(a2uiState.toggles).length > 0) && (
        <div className="state-panel">
          <div className="state-panel__header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            <span>Your Selections</span>
          </div>
          <div className="state-panel__content">
            {a2uiState.selectedPlan && (
              <div className="state-panel__item">
                <span className="state-panel__label">Plan</span>
                <span className="state-panel__value">{a2uiState.selectedPlan}</span>
              </div>
            )}
            {Object.entries(a2uiState.toggles).map(([key, value]) => (
              value && (
                <div key={key} className="state-panel__item">
                  <span className="state-panel__label">{key}</span>
                  <span className="state-panel__value state-panel__value--active">Active</span>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* ── Input Bar ───────────────────────────────────────────────────── */}
      <footer className="chat-input-bar">
        <form onSubmit={handleSubmit} className="chat-input-bar__form">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about plans, perks, or pricing..."
            className="chat-input-bar__input"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="chat-input-bar__send"
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
}

// ─── App Root ───────────────────────────────────────────────────────────────
// Wraps everything in the A2UIStateProvider so all rendered components
// can access the centralized interaction state.

function App() {
  return (
    <A2UIStateProvider>
      <ChatInterface />
    </A2UIStateProvider>
  );
}

export default App;
