import React from 'react';

/**
 * Parses text containing [u]...[/u] tags and renders it with an underline.
 * @param text The text to parse.
 * @returns ReactNode array with underlined segments.
 */
export function parseFormattedText(text: string): React.ReactNode {
  if (!text) return null;

  const parts = text.split(/(\[u\].*?\[\/u\])/g);

  return parts.map((part, index) => {
    if (part.startsWith('[u]') && part.endsWith('[/u]')) {
      const content = part.slice(3, -4);
      return (
        <span key={index} className="underline decoration-2 underline-offset-4 decoration-primary">
          {content}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}
