import type { ExportContract } from '../../types/canonical';
import { resolveChannelProfile, type ExportChannel } from './channelProfiles.ts';

export const EXPORT_CONTRACT_VERSION = '1.0.0';
export const BACKUP_SCHEMA_VERSION = '1.0.0';
export const BACKUP_SCHEMA_MIN_SUPPORTED = '1.0.0';
export const BACKUP_SCHEMA_MAX_SUPPORTED = '1.1.99';

export const BACKUP_FEATURE_FLAGS = Object.freeze({
  integrityV1: true,
  provenanceV1: true,
  phaseChecklistV1: true,
} as const);

export const BACKUP_MIGRATION_PATHS = Object.freeze({
  '1.0.0->1.0.0': true,
  '1.1.0->1.0.0': true,
} as const);

export type BackupEnvelope = {
  schemaVersion: string;
  appVersion: string;
  featureFlags: Record<string, boolean>;
  payload: Record<string, unknown>;
  integrity?: { algorithm?: string; checksum?: string; signature?: string };
};

export const EXPORT_PRESETS = Object.freeze({
  draft: { id: 'draft', label: 'Draft', quality: 0.82, dimensionScale: 0.75, citationMode: 'off', effectsPolicy: 'balanced' },
  standard: { id: 'standard', label: 'Standard', quality: 0.92, dimensionScale: 1, citationMode: 'compact', effectsPolicy: 'balanced' },
  high: { id: 'high', label: 'High', quality: 0.98, dimensionScale: 1.25, citationMode: 'full', effectsPolicy: 'full' },
  archive: { id: 'archive', label: 'Archive', quality: 1, dimensionScale: 1.5, citationMode: 'full', effectsPolicy: 'strict' },
} as const);

export type ExportPresetId = keyof typeof EXPORT_PRESETS;

const clampDimension = (value: number) => Math.max(320, Math.round(value));

export function resolveExportContractPreset({
  presetId = 'standard',
  baseDimensions,
}: {
  presetId?: ExportPresetId;
  baseDimensions: { width: number; height: number };
}) {
  const preset = EXPORT_PRESETS[presetId] || EXPORT_PRESETS.standard;
  return {
    presetId: preset.id,
    quality: preset.quality,
    citationMode: preset.citationMode,
    effectsPolicy: preset.effectsPolicy,
    dimensions: {
      width: clampDimension(baseDimensions.width * preset.dimensionScale),
      height: clampDimension(baseDimensions.height * preset.dimensionScale),
    },
  };
}

export function createExportContract({
  channel,
  format,
  dimensions,
  quality = 0.92,
  background = null,
  citationMode = 'off',
  version = EXPORT_CONTRACT_VERSION,
  locale = 'en-US',
  presetId = 'standard',
  effectsPolicy = 'balanced',
}: Omit<ExportContract, 'version'> & { version?: string }): ExportContract {
  return { format, dimensions, quality, background, citationMode, version, locale, presetId, effectsPolicy };
}
