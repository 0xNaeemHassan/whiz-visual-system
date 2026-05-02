import { FRAMES } from './frames';

const frameIds = new Set(FRAMES.map((frame) => frame.id));

function ensureFrames(ids) {
  return ids.filter((id) => frameIds.has(id));
}

const PACKS = {
  mwf: {
    id: 'mwf',
    name: 'M/W/F Balanced Pack',
    cadenceLabel: 'Monday / Wednesday / Friday',
    dayPlan: [
      { day: 'Monday', frameId: 3, focus: 'Weekly setup + calendar context' },
      { day: 'Wednesday', frameId: 18, focus: 'Mid-week comparison and matrix view' },
      { day: 'Friday', frameId: 36, focus: 'Weekly close with fresh data snapshot' },
    ],
  },
  tts: {
    id: 'tts',
    name: 'T/Th/Sat Momentum Pack',
    cadenceLabel: 'Tuesday / Thursday / Saturday',
    dayPlan: [
      { day: 'Tuesday', frameId: 9, focus: 'Project anatomy deep-dive' },
      { day: 'Thursday', frameId: 29, focus: 'Risk heatmap checkpoint' },
      { day: 'Saturday', frameId: 43, focus: 'Macro thesis synthesis' },
    ],
  },
};

Object.values(PACKS).forEach((pack) => {
  pack.dayPlan = ensureFrames(pack.dayPlan.map((item) => item.frameId)).map((id, index) => {
    const source = pack.dayPlan[index];
    return { ...source, frameId: id };
  });
  pack.frameIds = pack.dayPlan.map((item) => item.frameId);
});

export const CADENCE_PACKS = Object.freeze(PACKS);

export function getCadenceRotation(packId = 'mwf', date = new Date()) {
  const pack = CADENCE_PACKS[packId] || CADENCE_PACKS.mwf;
  const weekDay = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  const activeIndex = pack.dayPlan.findIndex((slot) => slot.day === weekDay);
  const ordered = activeIndex >= 0
    ? [...pack.dayPlan.slice(activeIndex), ...pack.dayPlan.slice(0, activeIndex)]
    : pack.dayPlan;

  return {
    pack,
    weekDay,
    ordered,
    currentFrameId: ordered[0]?.frameId ?? pack.frameIds[0],
  };
}
