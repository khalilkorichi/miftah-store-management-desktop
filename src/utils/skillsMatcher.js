/**
 * Matches user message text against enabled skills by tag overlap.
 * Returns the best-matching skill object (or null).
 */
export function matchSkill(text, skills) {
  if (!text || !Array.isArray(skills) || skills.length === 0) return null;
  const normalized = text.toLowerCase().trim();
  if (!normalized) return null;

  let bestSkill = null;
  let bestScore = 0;

  for (const skill of skills) {
    if (!skill.enabled) continue;
    const tags = skill.tags || [];
    let score = 0;
    for (const tag of tags) {
      if (normalized.includes(tag.toLowerCase())) {
        score += 1;
      }
    }
    if (
      score > bestScore ||
      (score === bestScore && score > 0 && (skill.priority || 5) > (bestSkill?.priority || 5))
    ) {
      bestScore = score;
      bestSkill = skill;
    }
  }

  return bestScore >= 2 ? bestSkill : null;
}
