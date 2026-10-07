import React from 'react';

/**
 * Parses text containing [u]...[/u] or <u>...</u> tags and <br> tags.
 * Renders them with appropriate styles.
 * @param text The text to parse.
 * @returns ReactNode array with formatted segments.
 */

const BLANK_SLOT = '<span class="inline-block w-11 h-7 mx-0.5 rounded border border-dashed border-text-muted/60 align-middle"></span>';
const STAR_SLOT = '<span class="inline-flex items-center justify-center w-11 h-7 mx-0.5 rounded border-2 border-blue-500 dark:border-blue-400 bg-blue-500/10 text-sm text-blue-600 dark:text-blue-400 align-middle">★</span>';
const UNDERLINE_BLANK = '<span class="inline-block w-10 mx-0.5 border-b-2 border-current align-baseline">&nbsp;</span>';

/**
 * Renders sentence-ordering blanks ("___ ___ _★_ ___") as a row of slots with
 * the starred one highlighted. A lone "___" (as in "___の言葉") stays a plain rule.
 */
function renderBlanks(text: string): string {
  return text.replace(/(?:(?:_+\s*★\s*_+|_{2,})[ 　]*)+/g, (run) => {
    const tokens = run.match(/_+\s*★\s*_+|_{2,}/g) ?? [];
    if (tokens.length === 1 && !tokens[0].includes('★')) return UNDERLINE_BLANK;
    const slots = tokens.map((t) => (t.includes('★') ? STAR_SLOT : BLANK_SLOT)).join('');
    return `<span class="whitespace-nowrap mx-1">${slots}</span>`;
  });
}

export function parseFormattedText(text: string): React.ReactNode {
  if (!text) return null;

  // Blanks are converted in text only, never inside tag attributes.
  const withBlanks = text
    .split(/(<[^>]+>)/)
    .map((part) => (part.startsWith('<') ? part : renderBlanks(part)))
    .join('');

  // Convert [u]...[/u] to HTML spans with Tailwind classes
  // Convert [u]...[/u] and <u>...</u> to HTML spans with Tailwind classes
  const htmlContent = withBlanks
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
