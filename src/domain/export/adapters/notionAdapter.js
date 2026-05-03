import { createOfflineResult, ensureAdapterPayloadContext } from './integrationAdapterContract.js';
import { getLocalAdapterConfig } from './localAdapterConfig.js';

export const NOTION_ADAPTER_ID = 'notion-ready-payload';

export function exportNotionReadyPayload(input = {}) {
  const context = ensureAdapterPayloadContext(input.metadata);
  const config = getLocalAdapterConfig().notion;
  const payload = {
    parent: { type: 'database_id', database_id: input.databaseId || 'local-placeholder-db' },
    properties: {
      Name: { title: [{ text: { content: input.title || context.canonicalSlug || 'Untitled Issue' } }] },
      'Issue #': { number: context.issueNumber },
      Tags: { multi_select: context.tags.map((name) => ({ name })) },
      'Canonical Slug': { rich_text: [{ text: { content: context.canonicalSlug || '' } }] },
      Sources: { rich_text: [{ text: { content: context.sources.map((source) => source.url || source.label).join('\n') } }] },
      'Cover Asset': { url: context.coverAsset?.url || null },
    },
    children: [
      { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: input.body || '' } }] } },
    ],
  };

  if (!config.isConfigured) return createOfflineResult({ adapterId: NOTION_ADAPTER_ID, context, payload });
  return { adapterId: NOTION_ADAPTER_ID, status: 'ready', context, payload };
}
