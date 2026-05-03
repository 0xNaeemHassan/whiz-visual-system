import { describe, expect, it } from 'vitest';
import { createMilestoneReminderEvents, getQuarterRolloverKey } from './milestoneScheduler';

describe('milestoneScheduler', () => {
  it('generates quarter milestones including cover story checkpoint', () => {
    const now = new Date('2026-05-03T00:00:00Z');
    const reminders = createMilestoneReminderEvents({ now, coverStoryCheckpoint: 'Ship cover story' });
    expect(reminders.map((x) => x.kind)).toEqual(['quarter-start', 'mid-quarter', 'pre-close', 'cover-story']);
  });

  it('rolls quarter key when crossing quarter boundary', () => {
    const q2 = getQuarterRolloverKey({ now: new Date('2026-05-03T00:00:00Z') });
    const q3 = getQuarterRolloverKey({ now: new Date('2026-07-04T00:00:00Z') });
    expect(q2).not.toBe(q3);
  });

  it('supports fiscal quarter offset', () => {
    const noOffset = getQuarterRolloverKey({ now: new Date('2026-01-15T00:00:00Z'), config: { timezone: 'UTC', fiscalQuarterOffsetMonths: 0 } });
    const offsetOne = getQuarterRolloverKey({ now: new Date('2026-01-15T00:00:00Z'), config: { timezone: 'UTC', fiscalQuarterOffsetMonths: 1 } });
    expect(noOffset).not.toBe(offsetOne);
  });
});
