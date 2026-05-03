import { describe, it, expect } from 'vitest';
import { extractProtocolTagSuggestions, normalizeProtocolTags } from './protocolTagging';

describe('protocolTagging', () => {
  it('resolves aliases to canonical tags', () => {
    const res = normalizeProtocolTags(['dex', 'AMM', 'lending']);
    expect(res.tags).toEqual(['DEX', 'LENDING']);
  });

  it('deduplicates canonical matches', () => {
    const res = normalizeProtocolTags(['perp', 'perps', 'PERPS']);
    expect(res.tags).toEqual(['PERPS']);
  });

  it('marks ambiguous matches on equal scoring', () => {
    const suggestions = extractProtocolTagSuggestions({ title: 'Dex lending', body: '', tableRows: [] });
    const dex = suggestions.find((s) => s.tag === 'DEX');
    const lending = suggestions.find((s) => s.tag === 'LENDING');
    expect(dex?.ambiguous).toBe(true);
    expect(lending?.ambiguous).toBe(true);
  });
});
