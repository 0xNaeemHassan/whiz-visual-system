function normalizeScore(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function resolveWinner(match = {}, fallbackLabel = 'TBD') {
  const leftName = (match.leftName || '').trim();
  const rightName = (match.rightName || '').trim();
  const leftSeed = match.leftSeed || '';
  const rightSeed = match.rightSeed || '';
  const leftScore = normalizeScore(match.leftScore);
  const rightScore = normalizeScore(match.rightScore);

  if (leftScore === null || rightScore === null || leftScore === rightScore) {
    return { name: '', seed: '', score: '' };
  }

  if (leftScore > rightScore) {
    return { name: leftName || fallbackLabel, seed: leftSeed, score: String(leftScore) };
  }
  return { name: rightName || fallbackLabel, seed: rightSeed, score: String(rightScore) };
}

function asMatches(roundMatches, expectedSize) {
  const matches = Array.isArray(roundMatches) ? roundMatches : [];
  return Array.from({ length: expectedSize }, (_, index) => ({ ...(matches[index] || {}) }));
}

export function computeBracketProgression(content = {}) {
  const round1 = asMatches(content.bracketRound1, 4);
  const providedRound2 = asMatches(content.bracketRound2, 2);
  const providedRound3 = asMatches(content.bracketRound3, 1);

  const round1Winners = round1.map((match, index) => resolveWinner(match, `QF ${index + 1}`));

  const round2 = providedRound2.map((match, index) => ({
    ...match,
    leftName: round1Winners[index * 2]?.name || match.leftName || '',
    leftSeed: round1Winners[index * 2]?.seed || match.leftSeed || '',
    rightName: round1Winners[index * 2 + 1]?.name || match.rightName || '',
    rightSeed: round1Winners[index * 2 + 1]?.seed || match.rightSeed || '',
  }));

  const round2Winners = round2.map((match, index) => resolveWinner(match, `SF ${index + 1}`));

  const round3 = [{
    ...providedRound3[0],
    leftName: round2Winners[0]?.name || providedRound3[0]?.leftName || '',
    leftSeed: round2Winners[0]?.seed || providedRound3[0]?.leftSeed || '',
    rightName: round2Winners[1]?.name || providedRound3[0]?.rightName || '',
    rightSeed: round2Winners[1]?.seed || providedRound3[0]?.rightSeed || '',
  }];

  const winner = resolveWinner(round3[0], 'CHAMP');

  return {
    bracketRound1: round1,
    bracketRound2: round2,
    bracketRound3: round3,
    bracketWinner: {
      name: winner.name || content.bracketWinner?.name || '',
      seed: winner.seed || content.bracketWinner?.seed || '',
      score: winner.score || content.bracketWinner?.score || '',
    },
  };
}

export function applyBracketProgression(content = {}) {
  if (!content || typeof content !== 'object') return content;
  const next = computeBracketProgression(content);
  return { ...content, ...next };
}
