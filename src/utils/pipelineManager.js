import { runAgent } from './agentEngine';
import { buildAgencyContext } from './storeContextBuilder';

export async function runIdeation(agencyData, appSettings, appData) {
  const context = buildAgencyContext(appData);
  const prompt = 'بناءً على بيانات المتجر أعلاه، ولّد أفكار محتوى تسويقي جديدة ومبتكرة.';

  const results = await Promise.all([
    agencyData.agents.scott.enabled
      ? runAgent('scott', prompt, context, agencyData.agents.scott, appSettings).catch(e => ({ error: e.message, agent: 'scott' }))
      : null,
    agencyData.agents.spark.enabled
      ? runAgent('spark', prompt, context, agencyData.agents.spark, appSettings).catch(e => ({ error: e.message, agent: 'spark' }))
      : null,
  ]);

  const pipelineItems = [];
  const now = new Date().toISOString();

  results.forEach((result, idx) => {
    if (!result) return;
    const agentId = idx === 0 ? 'scott' : 'spark';
    if (result.error) {
      pipelineItems.push({
        id: `idea_${Date.now()}_${agentId}`,
        stage: 'ideation',
        status: 'error',
        agentId,
        content: null,
        error: result.error,
        createdAt: now,
        attempts: 0,
      });
      return;
    }

    try {
      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const ideas = JSON.parse(cleaned);
      (Array.isArray(ideas) ? ideas : [ideas]).forEach((idea, i) => {
        pipelineItems.push({
          id: `idea_${Date.now()}_${agentId}_${i}`,
          stage: 'approval',
          status: 'pending',
          agentId,
          contentType: idea.type || 'post',
          content: idea,
          createdAt: now,
          attempts: 0,
        });
      });
    } catch (e) {
      pipelineItems.push({
        id: `idea_${Date.now()}_${agentId}_raw`,
        stage: 'approval',
        status: 'pending',
        agentId,
        contentType: 'post',
        content: { title: 'فكرة', summary: result, type: 'post', product: '' },
        createdAt: now,
        attempts: 0,
      });
    }
  });

  return pipelineItems;
}

export async function runProduction(item, agencyData, appSettings) {
  const isScript = item.contentType === 'script';
  const agentId = isScript ? 'rami' : 'brill';
  const agentConfig = agencyData.agents[agentId];

  if (!agentConfig?.enabled) throw new Error(`الوكيل ${agentId} غير مفعّل`);

  const prompt = `أنتج محتوى بناءً على هذه الفكرة الموافق عليها:\nالعنوان: ${item.content.title}\nالنوع: ${item.contentType}\nالمنتج: ${item.content.product || 'عام'}\nالملخص: ${item.content.summary}`;

  const result = await runAgent(agentId, prompt, null, agentConfig, appSettings);

  let parsed;
  try {
    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = { text: result };
  }

  return {
    ...item,
    stage: 'qa',
    status: 'pending_qa',
    producedBy: agentId,
    producedContent: parsed,
    producedAt: new Date().toISOString(),
  };
}

export async function runQA(item, agencyData, appSettings) {
  const agentConfig = agencyData.agents.lens;
  if (!agentConfig?.enabled) {
    return { ...item, stage: 'done', status: 'approved', qaResult: { approved: true, score: 100, issues: [], suggestions: [] } };
  }

  const contentStr = typeof item.producedContent === 'string' ? item.producedContent : JSON.stringify(item.producedContent, null, 2);
  const prompt = `افحص هذا المحتوى التسويقي وقيّم تطابقه مع هوية العلامة التجارية:\n\nنوع المحتوى: ${item.contentType}\nالمنتج: ${item.content?.product || 'عام'}\n\nالمحتوى:\n${contentStr}`;

  const result = await runAgent('lens', prompt, null, agentConfig, appSettings, agencyData.brandIdentity);

  let qaResult;
  try {
    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    qaResult = JSON.parse(cleaned);
  } catch {
    qaResult = { approved: true, score: 70, issues: [], suggestions: ['لم يتمكن الفاحص من تحليل المحتوى تلقائياً'] };
  }

  if (qaResult.approved) {
    return { ...item, stage: 'done', status: 'approved', qaResult, qaAt: new Date().toISOString() };
  }

  const attempts = (item.attempts || 0) + 1;
  if (attempts >= 2) {
    return { ...item, stage: 'done', status: 'approved_with_issues', qaResult, attempts, qaAt: new Date().toISOString() };
  }

  return { ...item, stage: 'production', status: 'retry', qaResult, attempts };
}
