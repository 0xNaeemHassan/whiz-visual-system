import { describe, it, expect } from 'vitest';
import { buildNarrativeArcModel, detectArcContinuityDrift, suggestNextArcStep } from './narrativeArcService';

describe('narrativeArcService', () => {
  it('groups posts by thesis theme + arc and tracks orphan posts', () => {
    const issues = [
      { id: '1', issueNum: '001', thesisTheme: 'Theme A', arc: 'Arc 1', arcPhase: 'setup' },
      { id: '2', issueNum: '002', thesisTheme: 'Theme A', arc: 'Arc 1', arcPhase: 'evidence' },
      { id: '3', issueNum: '003', topic: 'No arc' },
    ];
    const model = buildNarrativeArcModel(issues);
    expect(model.arcs).toHaveLength(1);
    expect(model.arcs[0].posts).toHaveLength(2);
    expect(model.orphanPosts).toHaveLength(1);
  });

  it('detects continuity drift and schedule drift', () => {
    const arc = {
      posts: [
        { id: '1', arcPhase: 'setup', publishDate: '2026-05-01' },
        { id: '2', arcPhase: 'resolution', publishDate: '2026-05-10' },
      ],
    };
    const previous = new Map([['2', '2026-05-04']]);
    const drift = detectArcContinuityDrift(arc, previous);
    expect(drift.missingPhasePosts).toEqual(['evidence', 'tension']);
    expect(drift.maxScheduleDriftDays).toBe(6);
    expect(drift.hasDrift).toBe(true);
  });

  it('suggests next arc phase from published sequence', () => {
    const issues = [
      { id: '1', status: 'published', arcPhase: 'setup', publishDate: '2026-05-01' },
      { id: '2', status: 'published', arcPhase: 'evidence', publishDate: '2026-05-02' },
    ];
    const suggestion = suggestNextArcStep(issues);
    expect(suggestion.suggestedPhase).toBe('tension');
  });
});
