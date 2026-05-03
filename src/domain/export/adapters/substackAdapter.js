import { createOfflineResult, ensureAdapterPayloadContext } from './integrationAdapterContract.js';
import { getLocalAdapterConfig } from './localAdapterConfig.js';

export const SUBSTACK_ADAPTER_ID = 'substack-ready-package';

export function exportSubstackReadyPackage(input = {}) {
  const context = ensureAdapterPayloadContext(input.metadata);
  const config = getLocalAdapterConfig().substack;

  const frontmatter = [
    '---',
    `title: "${escapeQuote(input.title || 'Untitled Issue')}"`,
    `slug: "${escapeQuote(context.canonicalSlug || 'untitled-issue')}"`,
    `issue_number: ${context.issueNumber ?? 'null'}`,
    `tags: [${context.tags.map((tag) => `"${escapeQuote(tag)}"`).join(', ')}]`,
    `cover_asset: "${escapeQuote(context.coverAsset?.url || '')}"`,
    '---',
  ].join('\n');

  const sourceLines = context.sources.length
    ? context.sources.map((source) => `- [${source.label}](${source.url || '#'})`).join('\n')
    : '- No sources provided';

  const markdown = `${frontmatter}\n\n${input.body || ''}\n\n## Sources\n${sourceLines}`;
  const packagePayload = {
    format: 'substack-markdown-bundle',
    files: [
      { path: `${context.canonicalSlug || 'untitled-issue'}.md`, content: markdown },
      { path: 'metadata.json', content: JSON.stringify({ ...context, title: input.title || '' }, null, 2) },
    ],
  };

  if (!config.isConfigured) return createOfflineResult({ adapterId: SUBSTACK_ADAPTER_ID, context, payload: packagePayload });
  return { adapterId: SUBSTACK_ADAPTER_ID, status: 'ready', context, payload: packagePayload };
}

function escapeQuote(value) {
  return String(value || '').replace(/"/g, '\\"');
}
