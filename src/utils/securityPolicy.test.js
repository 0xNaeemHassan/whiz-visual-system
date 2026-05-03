import { describe, expect, it } from 'vitest';
import { sanitizeExportHtmlFragment, sanitizeUserUrl } from './securityPolicy';

describe('securityPolicy', () => {
  it('allows safe URL protocols and blocks javascript protocol', () => {
    expect(sanitizeUserUrl('https://example.com/a.png')).toBe('https://example.com/a.png');
    expect(sanitizeUserUrl('javascript:alert(1)')).toBe('');
  });

  it('removes scripts and event handlers from export html fragments', () => {
    const root = document.createElement('div');
    root.innerHTML = '<img src="javascript:alert(1)" onerror="alert(1)"><script>alert(1)</script><a href="https://example.com">ok</a>';
    const safe = sanitizeExportHtmlFragment(root);
    expect(safe).not.toContain('<script');
    expect(safe).not.toContain('onerror');
    expect(safe).not.toContain('javascript:');
    expect(safe).toContain('https://example.com');
  });
});
