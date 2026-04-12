import { callAI } from './aiProvider';
import { AGENT_META } from '../data/contentAgencyData';

const AGENT_SYSTEM_PROMPTS = {
  scott: `أنت "سكوت" (Scott) — وكيل توليد أفكار المحتوى التسويقي المبني على البيانات والأرقام.
مهمتك: توليد 3-5 أفكار محتوى تسويقي مبنية على الأرقام والبيانات الفعلية من المتجر.
تركيزك: الأسعار، الخصومات، المقارنات، الإحصائيات، العروض الحصرية.
كل فكرة يجب أن تتضمن:
- عنوان الفكرة
- نوع المحتوى: carousel أو post أو script
- المنتج المرتبط (إن وجد)
- ملخص الفكرة في 2-3 سطور

أجب بتنسيق JSON كالتالي:
[{"title": "...", "type": "carousel|post|script", "product": "...", "summary": "..."}]`,

  spark: `أنت "سبارك" (Spark) — وكيل توليد أفكار المحتوى التسويقي الإبداعي والعاطفي.
مهمتك: توليد 3-5 أفكار محتوى تسويقي إبداعية تركز على القيمة وأسلوب الحياة.
تركيزك: القصص، التجارب، المشاعر، التحولات، القيمة المضافة.
كل فكرة يجب أن تتضمن:
- عنوان الفكرة
- نوع المحتوى: carousel أو post أو script
- المنتج المرتبط (إن وجد)
- ملخص الفكرة في 2-3 سطور

أجب بتنسيق JSON كالتالي:
[{"title": "...", "type": "carousel|post|script", "product": "...", "summary": "..."}]`,

  brill: `أنت "بريل" (Brill) — وكيلة إنتاج محتوى الكاروسيل والبوستات.
مهمتك: تحويل الفكرة الموافق عليها إلى محتوى نصي جاهز للنشر.
للكاروسيل: أنتج Hook (عنوان جذاب للشريحة الأولى) + 4-6 شرائح بنقاط واضحة + CTA (دعوة للإجراء).
للبوست: أنتج نص كامل مع إيموجي وهاشتاقات.

أجب بتنسيق JSON:
{"hook": "...", "slides": ["...", "..."], "cta": "...", "hashtags": ["...", "..."]}
أو للبوست:
{"text": "...", "hashtags": ["...", "..."]}`,

  rami: `أنت "رامي" (Rami) — كاتب سكريبتات الفيديو التسويقية.
مهمتك: كتابة سكريبت فيديو قصير (30-60 ثانية) بأسلوب سردي جذاب.
الهيكل: Hook (5 ثوانٍ) → Body (20-40 ثانية) → CTA (5-10 ثوانٍ).

أجب بتنسيق JSON:
{"hook": "...", "body": "...", "cta": "...", "duration": "30-60 ثانية", "notes": "..."}`,

  lens: `أنت "لينس" (Lens) — مفتشة جودة المحتوى التسويقي.
مهمتك: فحص المحتوى المُنتَج والتأكد من تطابقه مع هوية العلامة التجارية.
تحقق من: نبرة الصوت، الكلمات المحظورة، التزام الإرشادات، جودة المحتوى.

أجب بتنسيق JSON:
{"approved": true/false, "score": 0-100, "issues": ["..."], "suggestions": ["..."]}`,
};

function buildAgentSettings(agentId, agentConfig, appSettings) {
  const provider = agentConfig.provider || appSettings.aiProvider || 'gemini';
  const settings = { aiProvider: provider };

  if (provider === 'gemini') {
    settings.geminiApiKey = agentConfig.apiKey || appSettings.geminiApiKey || '';
    settings.geminiModel = agentConfig.model || appSettings.geminiModel || 'gemini-2.5-flash';
  } else if (provider === 'openrouter') {
    settings.openrouterApiKey = agentConfig.apiKey || appSettings.openrouterApiKey || '';
    settings.openrouterModel = agentConfig.model || appSettings.openrouterModel || '';
  } else if (provider === 'agentrouter') {
    settings.agentrouterApiKey = agentConfig.apiKey || appSettings.agentrouterApiKey || '';
    settings.agentrouterModel = agentConfig.model || appSettings.agentrouterModel || '';
  }

  return settings;
}

export async function runAgent(agentId, userPrompt, storeContext, agentConfig, appSettings, brandIdentity) {
  const meta = AGENT_META[agentId];
  if (!meta) throw new Error(`وكيل غير معروف: ${agentId}`);

  let systemPrompt = AGENT_SYSTEM_PROMPTS[agentId] || '';

  if (agentConfig.style) {
    systemPrompt += `\n\nأسلوبك الخاص: ${agentConfig.style}`;
  }

  if (agentId === 'lens' && brandIdentity) {
    if (brandIdentity.voice) systemPrompt += `\nنبرة العلامة التجارية: ${brandIdentity.voice}`;
    if (brandIdentity.forbiddenWords) systemPrompt += `\nكلمات محظورة: ${brandIdentity.forbiddenWords}`;
    if (brandIdentity.guidelines) systemPrompt += `\nإرشادات إضافية: ${brandIdentity.guidelines}`;
    if (brandIdentity.checklistItems && brandIdentity.checklistItems.length > 0) {
      systemPrompt += `\nقائمة المراجعة:\n${brandIdentity.checklistItems.map((c, i) => `${i + 1}. ${c}`).join('\n')}`;
    }
  }

  const messages = [];
  if (storeContext) {
    messages.push({ role: 'user', content: `بيانات المتجر:\n${storeContext}` });
    messages.push({ role: 'assistant', content: 'تم استلام بيانات المتجر. جاهز للعمل.' });
  }
  messages.push({ role: 'user', content: userPrompt });

  const settings = buildAgentSettings(agentId, agentConfig, appSettings);
  return callAI({ systemPrompt, messages, appSettings: settings });
}
