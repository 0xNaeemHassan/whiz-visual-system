import { REQUIRED_METADATA_FIELDS, TELEMETRY_VERSION } from './schema';

function getTimestamp() {
  return new Date().toISOString();
}

export function createTelemetry({ frameId, layout, sink } = {}) {
  const emit = sink || ((event) => console.debug('[telemetry]', event));

  return function track(eventName, payload = {}, overrideMetadata = {}) {
    const metadata = {
      frameId,
      layout,
      version: TELEMETRY_VERSION,
      timestamp: getTimestamp(),
      ...overrideMetadata,
    };

    const missing = REQUIRED_METADATA_FIELDS.filter((field) => metadata[field] == null || metadata[field] === '');
    if (missing.length) {
      console.warn('[telemetry] missing required metadata', missing, { eventName, payload, metadata });
    }

    emit({
      eventName,
      payload,
      metadata,
    });
  };
}
