const DAY_MS = 24 * 60 * 60 * 1000;

export const CADENCE_SLOT_STATE = Object.freeze({
  ON_TRACK: 'on_track',
  AT_RISK: 'at_risk',
  MISSED: 'missed',
});

function startOfWeekInTimezone(date, weekStartsOn, timezone) {
  const local = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const weekday = local.getDay();
  const offset = (weekday - weekStartsOn + 7) % 7;
  local.setHours(0, 0, 0, 0);
  local.setDate(local.getDate() - offset);
  return local;
}

function coerceDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function computeCadencePolicy({ issues = [], cadenceConfig, now = new Date() }) {
  const config = {
    days: Array.isArray(cadenceConfig?.days) ? cadenceConfig.days : [1, 3, 5],
    timezone: cadenceConfig?.timezone || 'UTC',
    graceWindowHours: Number(cadenceConfig?.graceWindowHours ?? 12),
    weekStartsOn: Number(cadenceConfig?.weekStartsOn ?? 1),
  };

  const weekStart = startOfWeekInTimezone(now, config.weekStartsOn, config.timezone);
  const slotMap = new Map();

  config.days.forEach((dayIdx) => {
    const slotDate = new Date(weekStart);
    const delta = (dayIdx - config.weekStartsOn + 7) % 7;
    slotDate.setDate(weekStart.getDate() + delta);
    const slotKey = slotDate.toISOString().slice(0, 10);
    slotMap.set(slotKey, {
      slotKey,
      dayIndex: dayIdx,
      requiredAt: slotDate,
      planned: [],
      published: [],
      state: CADENCE_SLOT_STATE.ON_TRACK,
      debt: 0,
    });
  });

  issues.forEach((issue) => {
    const issueDate = coerceDate(issue.publishDate);
    if (!issueDate) return;
    const issueKey = issueDate.toISOString().slice(0, 10);
    const slot = slotMap.get(issueKey);
    if (!slot) return;
    if (issue.status === 'published') slot.published.push(issue);
    else if (issue.status === 'planned' || issue.status === 'wip' || issue.status === 'done') slot.planned.push(issue);
  });

  const graceMs = config.graceWindowHours * 60 * 60 * 1000;
  const reminders = [];
  const slots = [...slotMap.values()].sort((a, b) => a.requiredAt - b.requiredAt).map((slot) => {
    const deadline = slot.requiredAt.getTime() + graceMs;
    const hasPlanned = slot.planned.length > 0;
    const hasPublished = slot.published.length > 0;

    if (hasPublished) slot.state = CADENCE_SLOT_STATE.ON_TRACK;
    else if (hasPlanned) slot.state = CADENCE_SLOT_STATE.AT_RISK;
    else slot.state = now.getTime() > deadline ? CADENCE_SLOT_STATE.MISSED : CADENCE_SLOT_STATE.AT_RISK;

    if (slot.state === CADENCE_SLOT_STATE.MISSED) slot.debt = 1;

    if (slot.state === CADENCE_SLOT_STATE.AT_RISK) {
      reminders.push({ severity: 'nudge', slotKey: slot.slotKey, message: `Cadence slot ${slot.slotKey} needs publication coverage.` });
    }
    if (slot.state === CADENCE_SLOT_STATE.MISSED) {
      reminders.push({ severity: 'escalated', slotKey: slot.slotKey, message: `Cadence slot ${slot.slotKey} is missed.` });
    }
    return slot;
  });

  const debt = slots.reduce((sum, slot) => sum + slot.debt, 0);
  const score = slots.length ? Math.round((slots.filter((slot) => slot.state === CADENCE_SLOT_STATE.ON_TRACK).length / slots.length) * 100) : 100;

  return {
    config,
    weekStart: weekStart.toISOString().slice(0, 10),
    slots,
    debt,
    score,
    reminders,
    hardWarning: debt > 0,
  };
}
