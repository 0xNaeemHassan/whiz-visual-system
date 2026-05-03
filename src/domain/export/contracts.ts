import type { ExportContract } from '../../types/canonical';

export const EXPORT_CONTRACT_VERSION = '1.0.0';

export function createExportContract({
  format,
  dimensions,
  quality = 0.92,
  background = null,
  citationMode = 'off',
  version = EXPORT_CONTRACT_VERSION,
  locale = 'en-US',
}: Omit<ExportContract, 'version'> & { version?: string }): ExportContract {
  return { format, dimensions, quality, background, citationMode, version, locale };
}
