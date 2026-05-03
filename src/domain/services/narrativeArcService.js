const ARC_PHASES = ['setup', 'evidence', 'tension', 'resolution'];

export function normalizeArcPhase(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return ARC_PHASES.includes(normalized) ? normalized : '';
}

export function buildNarrativeArcModel(issues = []) {
  const arcsById = {};
  const orphanPosts = [];

  issues.forEach((issue) => {
    const thesisTheme = String(issue?.thesisTheme || '').trim();
    const arcName = String(issue?.arc || '').trim();
    const arcPhase = normalizeArcPhase(issue?.arcPhase);
    const hasArc = Boolean(arcName && arcPhase);

    if (!hasArc) {
      orphanPosts.push(issue);
      return;
    }

    const arcId = `${thesisTheme || 'unassigned'}::${arcName}`;
    if (!arcsById[arcId]) {
      arcsById[arcId] = {
        arcId,
        arcName,
        thesisTheme: thesisTheme || 'Unassigned',
        posts: [],
      };
    }
    arcsById[arcId].posts.push(issue);
  });

  const arcs = Object.values(arcsById).map((arc) => ({
    ...arc,
    posts: [...arc.posts].sort((a, b) => {
      const aDate = new Date(a.publishDate || 0).getTime();
      const bDate = new Date(b.publishDate || 0).getTime();
      return aDate - bDate;
    }),
  }));

  return { arcs, orphanPosts };
}

export function detectArcContinuityDrift(arc, previousSchedule = new Map()) {
  const missingPhasePosts = ARC_PHASES.filter((phase) => !arc.posts.some((post) => normalizeArcPhase(post.arcPhase) === phase));
  const outOfOrder = arc.posts.some((post, index) => {
    if (index === 0) return false;
    const previous = normalizeArcPhase(arc.posts[index - 1].arcPhase);
    const current = normalizeArcPhase(post.arcPhase);
    return ARC_PHASES.indexOf(current) < ARC_PHASES.indexOf(previous);
  });

  const scheduleDrift = arc.posts
    .filter((post) => previousSchedule.has(post.id))
    .map((post) => {
      const oldDate = previousSchedule.get(post.id);
      if (!oldDate || !post.publishDate) return 0;
      const delta = Math.abs(new Date(post.publishDate).getTime() - new Date(oldDate).getTime());
      return Math.round(delta / (1000 * 60 * 60 * 24));
    });

  const maxScheduleDriftDays = scheduleDrift.length ? Math.max(...scheduleDrift) : 0;

  return {
    missingPhasePosts,
    outOfOrder,
    maxScheduleDriftDays,
    hasDrift: outOfOrder || missingPhasePosts.length > 0 || maxScheduleDriftDays > 0,
  };
}

export function suggestNextArcStep(issues = []) {
  const published = issues
    .filter((issue) => (issue.status || '').trim() === 'published')
    .sort((a, b) => new Date(a.publishDate || 0) - new Date(b.publishDate || 0));

  const last = published[published.length - 1];
  if (!last) return { suggestedPhase: 'setup', reason: 'No published posts yet.' };

  const currentPhase = normalizeArcPhase(last.arcPhase);
  const currentIndex = ARC_PHASES.indexOf(currentPhase);
  if (currentIndex === -1) {
    return { suggestedPhase: 'setup', reason: 'Last published post is not assigned to an arc phase.' };
  }

  const nextIndex = Math.min(currentIndex + 1, ARC_PHASES.length - 1);
  const suggestedPhase = ARC_PHASES[nextIndex];
  return {
    suggestedPhase,
    reason: suggestedPhase === currentPhase
      ? 'Latest published post is already in resolution; continue with a new setup arc.'
      : `Advance from ${currentPhase} to ${suggestedPhase}.`,
  };
}
