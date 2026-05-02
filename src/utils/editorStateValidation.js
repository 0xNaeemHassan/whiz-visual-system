const CODES = {
  ROOT_INVALID: 'ROOT_INVALID',
  CONTENT_MISSING: 'CONTENT_MISSING',
  OVERRIDES_MISSING: 'OVERRIDES_MISSING',
  IMAGES_INVALID: 'IMAGES_INVALID',
  ISSUE_NUM_INVALID: 'ISSUE_NUM_INVALID',
  DATE_INVALID: 'DATE_INVALID',
  STATS_INVALID: 'STATS_INVALID',
  TABLE_ROWS_INVALID: 'TABLE_ROWS_INVALID',
  TABLE_HEADERS_INVALID: 'TABLE_HEADERS_INVALID',
  BULL_POINTS_INVALID: 'BULL_POINTS_INVALID',
  BEAR_POINTS_INVALID: 'BEAR_POINTS_INVALID',
  TITLE_FONT_SIZE_OOB: 'TITLE_FONT_SIZE_OOB',
  DECK_FONT_SIZE_OOB: 'DECK_FONT_SIZE_OOB',
  BODY_FONT_SIZE_OOB: 'BODY_FONT_SIZE_OOB',
  TICKER_SPEED_OOB: 'TICKER_SPEED_OOB',
  IMAGE_X_OOB: 'IMAGE_X_OOB',
  IMAGE_Y_OOB: 'IMAGE_Y_OOB',
  IMAGE_WIDTH_OOB: 'IMAGE_WIDTH_OOB',
  IMAGE_OPACITY_OOB: 'IMAGE_OPACITY_OOB',
  IMAGE_ROTATION_OOB: 'IMAGE_ROTATION_OOB',
};

const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const push = (errors, code, path, message, meta) => errors.push({ code, path, message, ...(meta ? { meta } : {}) });
const inRange = (v, min, max) => typeof v === 'number' && v >= min && v <= max;

export function validateEditorState(state) {
  const errors = [];
  if (!isObj(state)) {
    push(errors, CODES.ROOT_INVALID, 'state', 'State must be an object.');
    return { valid: false, errors, codes: errors.map((e) => e.code) };
  }

  const { content, overrides, uploadedImages } = state;
  if (!isObj(content)) push(errors, CODES.CONTENT_MISSING, 'content', 'Content is required.');
  if (!isObj(overrides)) push(errors, CODES.OVERRIDES_MISSING, 'overrides', 'Overrides must be an object.');

  if (content) {
    if ('stats' in content && !Array.isArray(content.stats)) push(errors, CODES.STATS_INVALID, 'content.stats', 'Stats must be an array when provided.');
    if ('tableRows' in content && !Array.isArray(content.tableRows)) push(errors, CODES.TABLE_ROWS_INVALID, 'content.tableRows', 'Table rows must be an array when provided.');
    if ('tableHeaders' in content && !Array.isArray(content.tableHeaders)) push(errors, CODES.TABLE_HEADERS_INVALID, 'content.tableHeaders', 'Table headers must be an array when provided.');
    if ('bullPoints' in content && !Array.isArray(content.bullPoints)) push(errors, CODES.BULL_POINTS_INVALID, 'content.bullPoints', 'Bull points must be an array when provided.');
    if ('bearPoints' in content && !Array.isArray(content.bearPoints)) push(errors, CODES.BEAR_POINTS_INVALID, 'content.bearPoints', 'Bear points must be an array when provided.');

    if (content.issueNum && !/^\d{3}$/.test(String(content.issueNum))) {
      push(errors, CODES.ISSUE_NUM_INVALID, 'content.issueNum', 'Issue number must be 3 digits.');
    }
    if (content.date && !/^\d{2}\.\d{2}\.\d{2}$/.test(String(content.date))) {
      push(errors, CODES.DATE_INVALID, 'content.date', 'Date must use MM.DD.YY format.');
    }

    if (content.tickerSpeed != null && !inRange(Number(content.tickerSpeed), 10, 60)) {
      push(errors, CODES.TICKER_SPEED_OOB, 'content.tickerSpeed', 'Ticker speed must be between 10 and 60 seconds.');
    }
  }

  if (overrides) {
    const titleSize = Number(overrides.title?.fontSize);
    const deckSize = Number(overrides.deck?.fontSize);
    const bodySize = Number(overrides.body?.fontSize);
    if (!Number.isNaN(titleSize) && !inRange(titleSize, 28, 80)) push(errors, CODES.TITLE_FONT_SIZE_OOB, 'overrides.title.fontSize', 'Title font size out of bounds.');
    if (!Number.isNaN(deckSize) && !inRange(deckSize, 12, 32)) push(errors, CODES.DECK_FONT_SIZE_OOB, 'overrides.deck.fontSize', 'Deck font size out of bounds.');
    if (!Number.isNaN(bodySize) && !inRange(bodySize, 11, 22)) push(errors, CODES.BODY_FONT_SIZE_OOB, 'overrides.body.fontSize', 'Body font size out of bounds.');
  }

  if (uploadedImages != null) {
    if (!isObj(uploadedImages)) {
      push(errors, CODES.IMAGES_INVALID, 'uploadedImages', 'Uploaded images must be an object.');
    } else {
      ['logo', 'hero', 'badge'].forEach((key) => {
        const img = uploadedImages[key];
        if (!img || !isObj(img)) return;
        if (img.x != null && !inRange(Number(img.x), 0, 100)) push(errors, CODES.IMAGE_X_OOB, `uploadedImages.${key}.x`, 'Image x must be 0-100.');
        if (img.y != null && !inRange(Number(img.y), 0, 100)) push(errors, CODES.IMAGE_Y_OOB, `uploadedImages.${key}.y`, 'Image y must be 0-100.');
        if (img.width != null && !inRange(Number(img.width), 10, 200)) push(errors, CODES.IMAGE_WIDTH_OOB, `uploadedImages.${key}.width`, 'Image width must be 10-200%.');
        if (img.opacity != null && !inRange(Number(img.opacity), 0, 1)) push(errors, CODES.IMAGE_OPACITY_OOB, `uploadedImages.${key}.opacity`, 'Image opacity must be 0-1.');
        if (img.rotation != null && !inRange(Number(img.rotation), -180, 180)) push(errors, CODES.IMAGE_ROTATION_OOB, `uploadedImages.${key}.rotation`, 'Image rotation must be -180 to 180.');
      });
    }
  }

  return { valid: errors.length === 0, errors, codes: [...new Set(errors.map((e) => e.code))] };
}

export { CODES as editorStateValidationCodes };
