import type { ExportContract } from '../../types/canonical';
import { resolveChannelProfile, type ExportChannel } from './channelProfiles';

export const EXPORT_CONTRACT_VERSION = '1.0.0';

export function createExportContract({
  channel,
  format,
  dimensions,
  quality = 0.92,
  background = null,
  citationMode = 'off',
  version = EXPORT_CONTRACT_VERSION,
  locale = 'en-US',
}: Omit<ExportContract, 'version'> & { version?: string; channel?: ExportChannel }): ExportContract {
  const channelProfile = channel ? resolveChannelProfile(channel) : null;

  return {
    format: channelProfile?.format || format,
    dimensions: channelProfile?.dimensions || dimensions,
    quality: channelProfile?.quality ?? quality,
    background,
    citationMode: channelProfile?.citationMode || citationMode,
    version,
    locale,
  };
}

export function createExportContractForChannel({
  channel,
  background = null,
  version = EXPORT_CONTRACT_VERSION,
  locale = 'en-US',
}: {
  channel: ExportChannel;
  background?: string | null;
  version?: string;
  locale?: string;
}): ExportContract {
  return createExportContract({
    channel,
    format: 'png',
    dimensions: { width: 1, height: 1 },
    quality: 0.92,
    background,
    citationMode: 'off',
    version,
    locale,
  });
}
