import { createAdapterCredentials } from './integrationAdapterContract.js';

function readEnvToken(key) {
  if (typeof process !== 'undefined' && process?.env?.[key]) return process.env[key];
  if (typeof globalThis !== 'undefined' && globalThis?.__WHIZ_LOCAL_CONFIG__?.[key]) {
    return globalThis.__WHIZ_LOCAL_CONFIG__[key];
  }
  return '';
}

export function getLocalAdapterConfig() {
  return {
    notion: createAdapterCredentials({ tokenEnvKey: 'WHIZ_NOTION_TOKEN', tokenValue: readEnvToken('WHIZ_NOTION_TOKEN') }),
    substack: createAdapterCredentials({ tokenEnvKey: 'WHIZ_SUBSTACK_TOKEN', tokenValue: readEnvToken('WHIZ_SUBSTACK_TOKEN') }),
  };
}
