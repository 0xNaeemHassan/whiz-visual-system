const DEFAULT_CONFIG = Object.freeze({
  fiscalQuarterOffsetMonths: 0,
  timezone: 'UTC',
  triggerWindowHours: 24,
});

function toDateKey(value, timezone = 'UTC') {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(value);
}

function addMonths(date, months) {
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1, 0, 0, 0));
  return next;
}

function getQuarterBoundaries({ now = new Date(), fiscalQuarterOffsetMonths = 0 }) {
  const utcNow = new Date(now);
  const shifted = addMonths(utcNow, -fiscalQuarterOffsetMonths);
  const year = shifted.getUTCFullYear();
  const quarter = Math.floor(shifted.getUTCMonth() / 3);
  const quarterStartShifted = new Date(Date.UTC(year, quarter * 3, 1));
  const nextQuarterStartShifted = new Date(Date.UTC(year, quarter * 3 + 3, 1));

  return {
    quarterStart: addMonths(quarterStartShifted, fiscalQuarterOffsetMonths),
    nextQuarterStart: addMonths(nextQuarterStartShifted, fiscalQuarterOffsetMonths),
  };
}

export function createMilestoneReminderEvents({ now = new Date(), config = {}, objectives = [], coverStoryCheckpoint = null }) {
  const resolved = { ...DEFAULT_CONFIG, ...config };
  const { quarterStart, nextQuarterStart } = getQuarterBoundaries({ now, fiscalQuarterOffsetMonths: resolved.fiscalQuarterOffsetMonths });
  const quarterMid = new Date(quarterStart.getTime() + ((nextQuarterStart.getTime() - quarterStart.getTime()) / 2));
  const preClose = new Date(nextQuarterStart.getTime() - (7 * 24 * 60 * 60 * 1000));
  const windowMs = resolved.triggerWindowHours * 60 * 60 * 1000;

  const reminders = [
    { id: 'quarter-start', label: 'Quarter kickoff', dueAt: quarterStart, kind: 'quarter-start', objective: objectives[0] || 'Set quarter objective and publish planning issue.' },
    { id: 'quarter-mid', label: 'Mid-quarter checkpoint', dueAt: quarterMid, kind: 'mid-quarter', objective: objectives[1] || 'Review objective progress and adjust timeline backlog.' },
    { id: 'quarter-preclose', label: 'Pre-close review', dueAt: preClose, kind: 'pre-close', objective: objectives[2] || 'Finalize quarter wrap-up and evidence review.' },
  ];

  if (coverStoryCheckpoint) {
    reminders.push({
      id: 'cover-story-checkpoint',
      label: 'Cover story checkpoint',
      dueAt: preClose,
      kind: 'cover-story',
      objective: coverStoryCheckpoint,
    });
  }

  return reminders.map((item) => {
    const delta = item.dueAt.getTime() - now.getTime();
    return {
      ...item,
      dueDateKey: toDateKey(item.dueAt, resolved.timezone),
      triggerWindowStart: new Date(item.dueAt.getTime() - windowMs),
      triggerWindowEnd: new Date(item.dueAt.getTime() + windowMs),
      pending: delta >= -windowMs,
      timelineNote: item.objective,
    };
  });
}

export function getQuarterRolloverKey({ now = new Date(), config = {} }) {
  const resolved = { ...DEFAULT_CONFIG, ...config };
  const { quarterStart } = getQuarterBoundaries({ now, fiscalQuarterOffsetMonths: resolved.fiscalQuarterOffsetMonths });
  return toDateKey(quarterStart, resolved.timezone);
}
