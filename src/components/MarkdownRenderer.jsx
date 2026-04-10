import React from 'react';

/* ══════════════════════════════════════════════════════════════════════════
   MarkdownRenderer — lightweight inline Markdown → React (zero dependencies)
   Supports: headings, bold, italic, strikethrough, inline code, code blocks,
             unordered lists, ordered lists, blockquotes, horizontal rules,
             mixed RTL/LTR, and nested inline formatting.
   ══════════════════════════════════════════════════════════════════════════ */

let _keyCounter = 0;
const nextKey = () => `md-${++_keyCounter}`;

/* ── Inline formatting: bold, italic, strikethrough, code ── */
function parseInline(text) {
  if (!text) return null;

  const tokens = [];
  let remaining = text;
  let i = 0;

  const patterns = [
    // inline code
    { re: /`([^`]+)`/,       render: (m) => <code key={nextKey()} className="md-code-inline">{m[1]}</code> },
    // bold + italic
    { re: /\*\*\*(.+?)\*\*\*/, render: (m) => <strong key={nextKey()}><em>{parseInlineStr(m[1])}</em></strong> },
    // bold
    { re: /\*\*(.+?)\*\*/,   render: (m) => <strong key={nextKey()}>{parseInlineStr(m[1])}</strong> },
    { re: /__(.+?)__/,       render: (m) => <strong key={nextKey()}>{parseInlineStr(m[1])}</strong> },
    // italic
    { re: /\*([^*\n]+)\*/,   render: (m) => <em key={nextKey()}>{parseInlineStr(m[1])}</em> },
    { re: /_([^_\n]+)_/,     render: (m) => <em key={nextKey()}>{parseInlineStr(m[1])}</em> },
    // strikethrough
    { re: /~~(.+?)~~/,       render: (m) => <s key={nextKey()}>{parseInlineStr(m[1])}</s> },
  ];

  while (remaining.length > 0) {
    let earliest = null;
    let earliestIdx = Infinity;
    let matchResult = null;

    for (const pat of patterns) {
      const m = pat.re.exec(remaining);
      if (m && m.index < earliestIdx) {
        earliest = pat;
        earliestIdx = m.index;
        matchResult = m;
      }
    }

    if (!earliest) {
      tokens.push(remaining);
      break;
    }

    if (earliestIdx > 0) {
      tokens.push(remaining.slice(0, earliestIdx));
    }

    tokens.push(earliest.render(matchResult));
    remaining = remaining.slice(earliestIdx + matchResult[0].length);
    i++;
  }

  return tokens.length === 1 && typeof tokens[0] === 'string' ? tokens[0] : tokens;
}

function parseInlineStr(str) {
  const result = parseInline(str);
  return Array.isArray(result) ? result : [result];
}

/* ── Block-level parser ── */
export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    /* ── Fenced code block ``` ── */
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <div key={nextKey()} className="md-code-block-wrap">
          {lang && <span className="md-code-lang">{lang}</span>}
          <pre className="md-code-block"><code>{codeLines.join('\n')}</code></pre>
        </div>
      );
      continue;
    }

    /* ── Horizontal rule ── */
    if (/^[-*_]{3,}$/.test(line.trim())) {
      elements.push(<hr key={nextKey()} className="md-hr" />);
      i++;
      continue;
    }

    /* ── Heading ── */
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const Tag = `h${Math.min(level, 6)}`;
      elements.push(
        <Tag key={nextKey()} className={`md-h md-h${level}`}>
          {parseInline(headingMatch[2])}
        </Tag>
      );
      i++;
      continue;
    }

    /* ── Blockquote ── */
    if (/^>\s?/.test(line)) {
      const quoteLines = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      elements.push(
        <blockquote key={nextKey()} className="md-blockquote">
          <MarkdownRenderer content={quoteLines.join('\n')} />
        </blockquote>
      );
      continue;
    }

    /* ── Unordered list ── */
    if (/^[-*+]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={nextKey()} className="md-ul">
          {items.map(item => (
            <li key={nextKey()} className="md-li">{parseInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    /* ── Ordered list ── */
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      elements.push(
        <ol key={nextKey()} className="md-ol">
          {items.map(item => (
            <li key={nextKey()} className="md-li">{parseInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    /* ── Empty line = paragraph separator ── */
    if (line.trim() === '') {
      i++;
      continue;
    }

    /* ── Paragraph: collect consecutive non-empty, non-block lines ── */
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !/^[-*+]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^[-*_]{3,}$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    if (paraLines.length > 0) {
      const paraContent = paraLines.join(' ');
      elements.push(
        <p key={nextKey()} className="md-p">{parseInline(paraContent)}</p>
      );
    }
  }

  return (
    <div className={`md-body ${className}`}>
      {elements}
    </div>
  );
}
