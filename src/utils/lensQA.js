export function buildLensPrompt(content, brandIdentity) {
  let prompt = 'افحص المحتوى التالي وقيّم تطابقه مع هوية العلامة التجارية.\n\n';
  prompt += `المحتوى:\n${typeof content === 'string' ? content : JSON.stringify(content, null, 2)}\n\n`;

  if (brandIdentity) {
    prompt += 'هوية العلامة التجارية:\n';
    if (brandIdentity.voice) prompt += `- نبرة الصوت: ${brandIdentity.voice}\n`;
    if (brandIdentity.forbiddenWords) prompt += `- كلمات محظورة: ${brandIdentity.forbiddenWords}\n`;
    if (brandIdentity.guidelines) prompt += `- إرشادات: ${brandIdentity.guidelines}\n`;
    if (brandIdentity.checklistItems?.length > 0) {
      prompt += `- قائمة المراجعة:\n${brandIdentity.checklistItems.map((c, i) => `  ${i + 1}. ${c}`).join('\n')}\n`;
    }
  }

  prompt += '\nأجب بتنسيق JSON فقط:\n{"approved": true/false, "score": 0-100, "issues": ["..."], "suggestions": ["..."]}';
  return prompt;
}

export function parseLensResult(rawResult) {
  try {
    const cleaned = rawResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleaned);
    return {
      approved: !!result.approved,
      score: Math.min(100, Math.max(0, Number(result.score) || 0)),
      issues: Array.isArray(result.issues) ? result.issues : [],
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
    };
  } catch {
    return { approved: true, score: 70, issues: [], suggestions: ['لم يتمكن من تحليل النتيجة'] };
  }
}
