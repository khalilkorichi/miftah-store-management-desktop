const RTL = 'ql-direction-rtl ql-align-right text-right';

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isSafeUrl(url) {
  try {
    const u = new URL(url, 'https://placeholder.com');
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(u.protocol);
  } catch { return false; }
}

function processInline(text) {
  if (!text) return '';
  text = escapeHtml(text);
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  text = text.replace(/_([^_\n]+)_/g, '<em>$1</em>');
  text = text.replace(/~~(.+?)~~/g, '<s>$1</s>');
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    if (!isSafeUrl(url)) return label;
    return `<a href="${url}" target="_blank" rel="noopener">${label}</a>`;
  });
  return text;
}

export default function mdToQuillHTML(md) {
  if (!md) return '';

  const lines = md.split('\n');
  let html = '';
  let inUl = false;
  let inOl = false;
  let inCodeBlock = false;

  const closeList = () => {
    if (inUl) { html += '</ul>'; inUl = false; }
    if (inOl) { html += '</ol>'; inOl = false; }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        html += '</pre>';
        inCodeBlock = false;
      } else {
        closeList();
        inCodeBlock = true;
        html += `<pre class="ql-code-block ${RTL}" dir="rtl">`;
      }
      continue;
    }

    if (inCodeBlock) {
      html += escapeHtml(raw) + '\n';
      continue;
    }

    if (!trimmed) {
      closeList();
      html += `<p class="${RTL}" dir="rtl"><br></p>`;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)/);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1].length;
      const content = processInline(headingMatch[2]);
      html += `<h${level} class="${RTL}" dir="rtl">${content}</h${level}>`;
      continue;
    }

    if (trimmed.match(/^[-*•]\s/)) {
      if (inOl) { html += '</ol>'; inOl = false; }
      if (!inUl) { html += '<ul>'; inUl = true; }
      const content = processInline(trimmed.replace(/^[-*•]\s+/, ''));
      html += `<li class="${RTL}" dir="rtl">${content}</li>`;
      continue;
    }

    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (olMatch) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (!inOl) { html += '<ol>'; inOl = true; }
      const content = processInline(olMatch[2]);
      html += `<li class="${RTL}" dir="rtl">${content}</li>`;
      continue;
    }

    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      closeList();
      html += '<hr>';
      continue;
    }

    closeList();
    const content = processInline(trimmed);
    html += `<p class="${RTL}" dir="rtl">${content}</p>`;
  }

  closeList();
  if (inCodeBlock) html += '</pre>';

  return html;
}
