export const EXPORT_CONTRACT_VERSION = '1.0.0';

export function createExportContract({ format, dimensions, quality = 0.92, background = null, version = EXPORT_CONTRACT_VERSION }) {
  return { format, dimensions, quality, background, version };
}
