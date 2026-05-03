const MAX_IMAGE_BYTES_BEFORE_DECODE = 20 * 1024 * 1024;
const MAX_DECODED_PIXELS = 12_000_000;

export const IMAGE_PAYLOAD_LIMITS = Object.freeze({
  maxFileBytesBeforeDecode: MAX_IMAGE_BYTES_BEFORE_DECODE,
  maxDecodedPixels: MAX_DECODED_PIXELS,
});

export const validateImageFileBeforeDecode = (file) => {
  if (!file) return { valid: false, reason: 'No file provided.' };
  if (!file.type.startsWith('image/')) return { valid: false, reason: 'Only image files are supported.' };
  if (file.size > MAX_IMAGE_BYTES_BEFORE_DECODE) return { valid: false, reason: 'File too large. Max 20MB.' };
  return { valid: true };
};

export const shouldDownscaleBeforeDecode = ({ width, height }) => (width * height) > MAX_DECODED_PIXELS;

export const computeDecodeSafeDimensions = ({ width, height }) => {
  const pixels = width * height;
  if (pixels <= MAX_DECODED_PIXELS) return { width, height, scaled: false };
  const scale = Math.sqrt(MAX_DECODED_PIXELS / pixels);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    scaled: true,
  };
};
