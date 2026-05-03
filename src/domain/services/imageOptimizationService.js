const DEFAULT_IMPORT_MAX_DIMENSION = 1200;
const DEFAULT_QUALITY_TARGETS = Object.freeze([0.92, 0.85, 0.78, 0.7]);

function clampInt(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function pickTargetDimensions({ width, height, bounds = {} }) {
  const maxWidth = clampInt(bounds.maxWidth ?? DEFAULT_IMPORT_MAX_DIMENSION, 64, 8192);
  const maxHeight = clampInt(bounds.maxHeight ?? DEFAULT_IMPORT_MAX_DIMENSION, 64, 8192);
  const scale = Math.min(1, maxWidth / Math.max(width, 1), maxHeight / Math.max(height, 1));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)), scale };
}

async function decodeImageSafely(file) {
  if (!file || !file.type?.startsWith('image/')) throw new Error('Only image files are supported.');
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file, { imageOrientation: 'from-image' });
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to decode image.')); };
    img.src = url;
  });
}

function reencodeCanvas(canvas, { preferredType = 'image/webp', qualityTargets = DEFAULT_QUALITY_TARGETS, fallbackType = 'image/jpeg' } = {}) {
  const supportedPreferred = canvas.toDataURL(preferredType).startsWith(`data:${preferredType}`);
  const format = supportedPreferred ? preferredType : fallbackType;
  const qualityTrail = [];
  const dataUrlByQuality = qualityTargets.map((quality) => {
    const dataUrl = canvas.toDataURL(format, quality);
    const bytesEstimate = Math.round((dataUrl.length * 3) / 4);
    qualityTrail.push({ quality, bytesEstimate });
    return { quality, dataUrl, bytesEstimate };
  });
  const selected = dataUrlByQuality[0];
  return { format, dataUrl: selected.dataUrl, selectedQuality: selected.quality, qualityTrail };
}

export async function optimizeImageForImport(file, options = {}) {
  const decoded = await decodeImageSafely(file);
  const srcWidth = decoded.naturalWidth || decoded.videoWidth || decoded.width;
  const srcHeight = decoded.naturalHeight || decoded.videoHeight || decoded.height;
  const target = pickTargetDimensions({ width: srcWidth, height: srcHeight, bounds: options.bounds });
  const canvas = document.createElement('canvas');
  canvas.width = target.width;
  canvas.height = target.height;
  const ctx = canvas.getContext('2d', { alpha: true });
  ctx.drawImage(decoded, 0, 0, target.width, target.height);
  if (typeof decoded.close === 'function') decoded.close();

  const encoded = reencodeCanvas(canvas, options.reencode);
  return {
    dataUrl: encoded.dataUrl,
    metadata: {
      optimized: true,
      sourceType: file.type,
      sourceSizeBytes: file.size,
      sourceWidth: srcWidth,
      sourceHeight: srcHeight,
      normalizedOrientation: true,
      targetWidth: target.width,
      targetHeight: target.height,
      scale: target.scale,
      exportReadyFormat: encoded.format,
      selectedQuality: encoded.selectedQuality,
      qualityTrail: encoded.qualityTrail,
      optimizedAt: new Date().toISOString(),
    },
  };
}

export function optimizeCanvasForExport(canvas, options = {}) {
  return reencodeCanvas(canvas, {
    preferredType: options.preferredType,
    fallbackType: options.fallbackType,
    qualityTargets: options.qualityTargets || DEFAULT_QUALITY_TARGETS,
  });
}
