/**
 * ============================================================================
 * TEXT COMPONENT
 * ============================================================================
 * Renders text content with semantic variants (h1-h5, body, caption, overline).
 * Maps to the A2UI "Text" catalog entry, aligned to the official A2UI spec.
 *
 * Supports simple inline formatting:
 *   - **bold** text → <strong>
 *   - *italic* text → <em>
 *
 * SECURITY: Text is rendered via React's JSX, which automatically escapes
 * HTML entities. No dangerouslySetInnerHTML is used anywhere.
 * ============================================================================
 */

/**
 * Parses simple markdown-like formatting (bold and italic) into React elements.
 * This is intentionally limited — we only support inline formatting, not
 * full Markdown, to minimize attack surface.
 */
function parseSimpleMarkdown(text) {
  if (!text) return null;

  const parts = [];
  let remaining = text;
  let keyIndex = 0;

  // Match **bold** and *italic* patterns
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(remaining)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(remaining.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // **bold**
      parts.push(<strong key={`b-${keyIndex++}`}>{match[2]}</strong>);
    } else if (match[3]) {
      // *italic*
      parts.push(<em key={`i-${keyIndex++}`}>{match[3]}</em>);
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < remaining.length) {
    parts.push(remaining.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export function TextComponent({ id, text, variant = 'body', color = 'default', align = 'left', accessibility }) {

  const colorClass = color !== 'default' ? `a2ui-text--${color}` : '';
  const className = `a2ui-text a2ui-text--${variant} ${colorClass}`.trim();
  const style = { textAlign: align };
  const content = parseSimpleMarkdown(text);

  const props = {
    id,
    className,
    style,
    'aria-label': accessibility?.label,
  };

  // Map variant to the appropriate HTML element for semantic correctness
  switch (variant) {
    case 'h1': return <h1 {...props}>{content}</h1>;
    case 'h2': return <h2 {...props}>{content}</h2>;
    case 'h3': return <h3 {...props}>{content}</h3>;
    case 'h4': return <h4 {...props}>{content}</h4>;
    case 'h5': return <h5 {...props}>{content}</h5>;
    case 'caption': return <span {...props}>{content}</span>;
    case 'overline': return <span {...props}>{content}</span>;
    default: return <p {...props}>{content}</p>;
  }
}
