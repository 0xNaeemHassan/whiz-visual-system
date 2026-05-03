import type { ExportContract } from '../../types/canonical';

export type ExportChannel = 'web' | 'social' | 'internal' | 'print';

type ChannelProfile = {
  format: ExportContract['format'];
  dimensions: ExportContract['dimensions'];
  quality: ExportContract['quality'];
  citationMode: NonNullable<ExportContract['citationMode']>;
};

const REQUIRED_CHANNELS: ExportChannel[] = ['web', 'social', 'internal', 'print'];

const REQUIRED_FIELDS: Array<keyof ChannelProfile> = ['format', 'dimensions', 'quality', 'citationMode'];

export const CHANNEL_PROFILE_REGISTRY: Record<ExportChannel, ChannelProfile> = {
  web: {
    format: 'webp',
    dimensions: { width: 1920, height: 1080 },
    quality: 0.9,
    citationMode: 'compact',
  },
  social: {
    format: 'jpeg',
    dimensions: { width: 1080, height: 1350 },
    quality: 0.92,
    citationMode: 'off',
  },
  internal: {
    format: 'png',
    dimensions: { width: 1600, height: 900 },
    quality: 0.98,
    citationMode: 'full',
  },
  print: {
    format: 'png',
    dimensions: { width: 2400, height: 3000 },
    quality: 1,
    citationMode: 'full',
  },
};

export function validateChannelProfileRegistry(): void {
  for (const channel of REQUIRED_CHANNELS) {
    const profile = CHANNEL_PROFILE_REGISTRY[channel];
    if (!profile) {
      throw new Error(`[export] Missing channel profile: ${channel}`);
    }
    for (const field of REQUIRED_FIELDS) {
      if (profile[field] === undefined || profile[field] === null) {
        throw new Error(`[export] Channel profile ${channel} is missing required field: ${field}`);
      }
    }
    if (!Number.isFinite(profile.dimensions.width) || !Number.isFinite(profile.dimensions.height)) {
      throw new Error(`[export] Channel profile ${channel} has invalid dimensions`);
    }
    if (profile.quality < 0 || profile.quality > 1) {
      throw new Error(`[export] Channel profile ${channel} has invalid quality`);
    }
  }
}

export function resolveChannelProfile(channel: ExportChannel): ChannelProfile {
  const profile = CHANNEL_PROFILE_REGISTRY[channel];
  if (!profile) {
    throw new Error(`[export] Unknown export channel: ${channel}`);
  }
  return {
    format: profile.format,
    dimensions: { ...profile.dimensions },
    quality: profile.quality,
    citationMode: profile.citationMode,
  };
}

