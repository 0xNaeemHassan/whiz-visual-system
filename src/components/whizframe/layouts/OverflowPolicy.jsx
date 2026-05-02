const TYPE_TOKENS = [84, 56, 36, 24, 18, 14, 12];

const BUDGETS = {
  core: {
    portrait: { title: { maxLines: 3, maxChars: 72 }, deck: { maxLines: 4, maxChars: 200 }, body: { maxLines: 16, maxChars: 1100 } },
    landscape: { title: { maxLines: 2, maxChars: 56 }, deck: { maxLines: 3, maxChars: 150 }, body: { maxLines: 11, maxChars: 760 } },
  },
  extended: {
    portrait: { title: { maxLines: 2, maxChars: 54 }, deck: { maxLines: 3, maxChars: 140 }, body: { maxLines: 12, maxChars: 820 } },
    landscape: { title: { maxLines: 2, maxChars: 42 }, deck: { maxLines: 2, maxChars: 110 }, body: { maxLines: 9, maxChars: 600 } },
  },
};

const nearestScaleToken = (size = 36) => {
  for (const token of [...TYPE_TOKENS].reverse()) {
    if (token < size) return token;
  }
  return TYPE_TOKENS[TYPE_TOKENS.length - 1];
};

const clampLines = (text = '', maxLines = 3, charsPerLine = 28) => text.slice(0, maxLines * charsPerLine).trim();

const ellipsis = (text = '', maxChars = 120) => (text.length <= maxChars ? text : `${text.slice(0, maxChars - 1).trimEnd()}…`);

const compressText = ({ text = '', budget, style = {}, baseSize }) => {
  const actions = [];
  let nextText = text;
  const nextStyle = { ...style };

  if (nextText.length > budget.maxChars * 0.9) {
    nextStyle.letterSpacing = Math.min(Number(style.letterSpacing ?? -0.02), -0.03);
    actions.push('tighten-tracking');
  }

  if (nextText.length > budget.maxChars) {
    nextStyle.fontSize = nearestScaleToken(baseSize);
    actions.push('reduce-font');
  }

  if (nextText.length > budget.maxChars * 1.2) {
    nextText = clampLines(nextText, budget.maxLines, Math.round(budget.maxChars / budget.maxLines));
    actions.push('clamp-lines');
  }

  if (nextText.length > budget.maxChars) {
    nextText = ellipsis(nextText, budget.maxChars);
    actions.push('ellipsis');
  }

  return { text: nextText, style: nextStyle, actions };
};

export function applyOverflowPolicy({ family = 'core', aspectRatio, content = {}, ov = {}, baseTitleSize = 36 }) {
  const ratioKey = (aspectRatio?.w || 1080) > (aspectRatio?.h || 1350) ? 'landscape' : 'portrait';
  const familyBudget = BUDGETS[family] || BUDGETS.core;
  const budget = familyBudget[ratioKey];

  const title = compressText({ text: content.title, budget: budget.title, style: ov.title, baseSize: ov.title?.fontSize || baseTitleSize });
  const deck = compressText({ text: content.deck, budget: budget.deck, style: ov.deck, baseSize: ov.deck?.fontSize || 18 });
  const body = compressText({ text: content.body, budget: budget.body, style: ov.body, baseSize: ov.body?.fontSize || 16 });

  return {
    content: { ...content, title: title.text, deck: deck.text, body: body.text },
    ov: { ...ov, title: title.style, deck: deck.style, body: body.style },
    actions: { title: title.actions, deck: deck.actions, body: body.actions },
    budget,
  };
}
