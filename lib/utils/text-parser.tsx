import React from 'react';

/**
 * Parses text containing [u]...[/u] or <u>...</u> tags and <br> tags.
 * Renders them with appropriate styles.
 * @param text The text to parse.
 * @returns ReactNode array with formatted segments.
 */

export function parseFormattedText(text: string): React.ReactNode {
  if (!text) return null;

  // Convert [u]...[/u] to HTML spans with Tailwind classes
  // Convert [u]...[/u] and <u>...</u> to HTML spans with Tailwind classes
  let htmlContent = text
    .replace(/\[u\]/g, '<span class="underline decoration-2 underline-offset-4 decoration-blue-500 dark:decoration-blue-400">')
    .replace(/\[\/u\]/g, '</span>')
    .replace(/<u>/g, '<span class="underline decoration-2 underline-offset-4 decoration-blue-500 dark:decoration-blue-400">')
    .replace(/<\/u>/g, '</span>')
    // Style empty parentheses ( ) derived from ASCII or Full-width
    // Matches: ( ), (  ), （）, （　）
    .replace(/(\(|\uff08)\s*(\)|\uff09)/g, '<span class="text-blue-500 dark:text-blue-400 font-bold">$&</span>')
    .replace(/<b>/g, '<span class="font-bold">')
    .replace(/<\/b>/g, '</span>');

  // Render as HTML
  // We wrap in a span to be inline-friendly, but for tables it might need to be a div?
  // If the content has block elements like <table>, a span wrapper is technically invalid HTML5 (block inside inline), 
  // but browsers handle it. However, if we want to be safe, we can check.
  // Given QuestionCard wraps it in an <h2>, which is block-level but expects inline content usually...
  // Actually <h2> cannot contain <div> or <table> validly in standard HTML4, but HTML5 flow content...
  // <h2> is Phrasing content? No, Heading content.
  // <h2>Permitted content: Phrasing content.
  // So <table> inside <h2> is invalid.
  
  // We should check QuestionCard.tsx usage.
  // QuestionCard.tsx: <h2 ...>{parseFormattedText(text)}</h2>
  // If I put a table in there, it will be invalid HTML and might render weirdly.
  // I should probably change QuestionCard to use <div> instead of <h2> if the content is complex.
  
  return <span dangerouslySetInnerHTML={{ __html: htmlContent }} />;
}
