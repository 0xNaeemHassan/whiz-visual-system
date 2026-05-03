const ALLOWED_URL_PROTOCOLS = new Set(['http:', 'https:', 'data:', 'blob:']);

export function sanitizeUserUrl(value, { allowedProtocols = ALLOWED_URL_PROTOCOLS } = {}) {
  const input = String(value || '').trim();
  if (!input) return '';
  try {
    const parsed = new URL(input, 'https://whiz.local');
    if (!allowedProtocols.has(parsed.protocol)) return '';
    return parsed.href;
  } catch {
    return '';
  }
}

export function sanitizeExportHtmlFragment(rootElement) {
  if (!rootElement?.cloneNode) throw new Error('sanitizeExportHtmlFragment requires a DOM element root.');
  const clone = rootElement.cloneNode(true);
  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT);

  const scrubNode = (node) => {
    const attrs = Array.from(node.attributes || []);
    for (const attr of attrs) {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on')) {
        node.removeAttribute(attr.name);
        continue;
      }
      if (name === 'src' || name === 'href') {
        const sanitized = sanitizeUserUrl(attr.value);
        if (!sanitized) {
          node.removeAttribute(attr.name);
        } else {
          node.setAttribute(attr.name, sanitized);
        }
      }
    }
    if (node.tagName?.toLowerCase() === 'script') {
      node.remove();
    }
  };

  scrubNode(clone);
  while (walker.nextNode()) scrubNode(walker.currentNode);
  return clone.outerHTML;
}

export { ALLOWED_URL_PROTOCOLS };
