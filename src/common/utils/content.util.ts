/**
 * Converts a ProseMirror/TipTap JSON doc node to HTML string.
 */
export function renderHtml(node: any): string {
  if (!node) return '';

  if (node.type === 'doc') {
    return (node.content ?? []).map(renderHtml).join('');
  }

  if (node.type === 'text') {
    let text = escapeHtml(node.text ?? '');
    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.type === 'bold') text = `<strong>${text}</strong>`;
        else if (mark.type === 'italic') text = `<em>${text}</em>`;
        else if (mark.type === 'underline') text = `<u>${text}</u>`;
        else if (mark.type === 'strike') text = `<s>${text}</s>`;
        else if (mark.type === 'code') text = `<code>${text}</code>`;
        else if (mark.type === 'link') text = `<a href="${mark.attrs?.href ?? ''}">${text}</a>`;
      }
    }
    return text;
  }

  const inner = (node.content ?? []).map(renderHtml).join('');

  switch (node.type) {
    case 'paragraph':       return `<p>${inner}</p>`;
    case 'heading':         return `<h${node.attrs?.level ?? 1}>${inner}</h${node.attrs?.level ?? 1}>`;
    case 'bulletList':      return `<ul>${inner}</ul>`;
    case 'orderedList':     return `<ol>${inner}</ol>`;
    case 'listItem':        return `<li>${inner}</li>`;
    case 'blockquote':      return `<blockquote>${inner}</blockquote>`;
    case 'codeBlock':       return `<pre><code>${inner}</code></pre>`;
    case 'horizontalRule':  return `<hr/>`;
    case 'hardBreak':       return `<br/>`;
    default:                return inner;
  }
}

/**
 * Extracts plain text preview (first ~200 chars) from a ProseMirror/TipTap JSON doc.
 */
export function extractPreview(node: any, max = 200): string {
  const text = extractText(node).replace(/\s+/g, ' ').trim();
  return text.length > max ? text.slice(0, max) + '...' : text;
}

function extractText(node: any): string {
  if (!node) return '';
  if (node.type === 'text') return node.text ?? '';
  return (node.content ?? []).map(extractText).join(' ');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
