const FONT_TIMEOUT_PROFILES = Object.freeze({
  firstPaint: 1200,
  export: 2200,
});

const FONT_TARGETS = Object.freeze([
  "400 1em 'Inter'",
  "400 italic 1em 'Inter'",
  "700 1em 'Space Grotesk'",
  "600 1em 'JetBrains Mono'",
]);

function waitForTimeout(ms) {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ timedOut: true }), ms);
  });
}

async function waitForFontTargets(targets = FONT_TARGETS) {
  if (typeof document === 'undefined' || !document.fonts?.load) {
    return { ready: false, reason: 'font-loading-api-unavailable' };
  }

  await Promise.all(targets.map((font) => document.fonts.load(font)));
  return { ready: true, reason: 'fonts-ready' };
}

export async function waitForCriticalFonts({ profile = 'firstPaint', timeoutMs } = {}) {
  const resolvedTimeout = timeoutMs ?? FONT_TIMEOUT_PROFILES[profile] ?? FONT_TIMEOUT_PROFILES.firstPaint;
  const raceResult = await Promise.race([
    waitForFontTargets(),
    waitForTimeout(resolvedTimeout),
  ]);

  if (raceResult?.timedOut) {
    return { ready: false, timedOut: true, profile, timeoutMs: resolvedTimeout };
  }

  return { ready: !!raceResult?.ready, timedOut: false, profile, timeoutMs: resolvedTimeout };
}

export { FONT_TARGETS, FONT_TIMEOUT_PROFILES };
