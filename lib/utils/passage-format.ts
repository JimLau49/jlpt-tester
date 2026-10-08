/**
 * Turns the loosely structured passage HTML stored with each exam into markup
 * that globals.css (.passage …) can style consistently: passage labels, note
 * references and definitions, cloze blanks, citations and paragraph gaps.
 */

const NOTE_MARK = '[(（]\\s*注\\s*[0-9０-９]*\\s*[)）]';
// A definition is a marker followed shortly by "term:"; anything else is an in-text reference.
const NOTE_DEF = `${NOTE_MARK}\\s*[^:：。<>]{1,30}[:：]`;
const NOTE_DEF_RE = new RegExp(NOTE_DEF);
const NOTE_DEF_SPLIT_RE = new RegExp(`(?=${NOTE_DEF})`);
const NOTE_MARK_RE = new RegExp(NOTE_MARK, 'g');
const SOURCE_RE = /[(（][^()（）<>]{2,80}による[)）]/g;
const LABEL_RE = /^\s*[(（]\s*([0-9０-９])\s*[)）][.．]?\s*/;
const BR = '<br\\s*\\/?>';
// Stray spaces next to Japanese punctuation or brackets show up as gaps on the full-width grid.
const SPACE_AFTER_PUNCT_RE = /([。、！？」』）])[ \t]+(?=[^\s<])/g;
const SPACE_BEFORE_BRACKET_RE = /([^\s>])[ \t]+(?=[「『（])/g;
// Notices are often stored on one line: "【見出し】・項目。・項目。"
const INLINE_BULLET_RE = /([】。）)])\s*(?=[・●])/g;
const HEADING_RE = /【[^】\d<>]{2,16}】/g;

function formatText(text: string): string {
  const defStart = text.search(NOTE_DEF_RE);
  const body = defStart === -1 ? text : text.slice(0, defStart);
  const notes = defStart === -1 ? '' : text.slice(defStart);

  let html = body
    .replace(SPACE_AFTER_PUNCT_RE, '$1')
    .replace(SPACE_BEFORE_BRACKET_RE, '$1')
    .replace(INLINE_BULLET_RE, '$1<br>')
    .replace(HEADING_RE, '<strong class="passage-heading">$&</strong>')
    .replace(SOURCE_RE, '<span class="passage-source">$&</span>')
    .replace(NOTE_MARK_RE, (m) => `<span class="passage-note-ref">${m.replace(/\s+/g, '')}</span>`)
    .replace(/【(\d{1,2})】/g, '<span class="passage-blank">$1</span>');

  if (notes) {
    html += notes
      .split(NOTE_DEF_SPLIT_RE)
      .filter((n) => n.trim())
      .map((n) => `<small class="passage-note">${n.trim()}</small>`)
      .join('');
  }
  return html;
}

export function formatPassageHtml(raw: string): string {
  const source = (raw.includes('<') ? raw : raw.replace(/\n/g, '<br>'))
    .replace(/\[u\]/g, '<u>')
    .replace(/\[\/u\]/g, '</u>')
    // The section header already names the problem.
    .replace(/<p[^>]*>\s*Problem\s*\d+\s*<\/p>/g, '')
    .replace(/<p[^>]*>\s*(問題\s*[0-9０-９]+[^<]*)<\/p>/g, '<p class="passage-instruction">$1</p>');

  let tableDepth = 0;
  let atStart = true; // next text may open with a "(1)" passage label
  let inInstruction = false;

  const html = source
    .split(/(<[^>]+>)/)
    .map((part) => {
      if (part.startsWith('<')) {
        if (/^<table\b/i.test(part)) tableDepth++;
        else if (/^<\/table/i.test(part)) tableDepth = Math.max(0, tableDepth - 1);
        else if (/^<hr\b/i.test(part)) atStart = true;
        else if (part.includes('passage-instruction')) inInstruction = true;
        else if (inInstruction && /^<\/p/i.test(part)) inInstruction = false;
        return part;
      }
      if (!part.trim() || inInstruction) return part;

      let text = part;
      let label = '';
      if (tableDepth === 0) {
        const ab = text.trim().match(/^[ABＡＢ]$/);
        const numbered = atStart ? text.match(LABEL_RE) : null;
        if (ab) {
          label = `<span class="passage-label">${ab[0]}</span>`;
          text = '';
        } else if (numbered) {
          label = `<span class="passage-label">(${numbered[1]})</span>`;
          text = text.slice(numbered[0].length);
        }
      }
      atStart = false;
      return label + formatText(text);
    })
    .join('');

  return html
    // Labels and notes are blocks; drop the line breaks that used to separate them.
    .replace(new RegExp(`(<span class="passage-label">[^<]*<\\/span>(?:<\\/b>)?)\\s*(?:${BR}\\s*)+`, 'g'), '$1')
    .replace(new RegExp(`(?:${BR}\\s*)+(?=<small class="passage-note">)`, 'g'), '')
    .replace(new RegExp(`(<\\/small>)\\s*(?:${BR}\\s*)+`, 'g'), '$1')
    .replace(new RegExp(`(?:${BR}\\s*){2,}`, 'g'), '<span class="passage-gap"></span>');
}
