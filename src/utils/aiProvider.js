/* ─── Google Gemini API models (ai.google.dev) ───────────────────────────────
   Updated: April 2026
   Note: Gemini 1.5 family was shut down April 30, 2025.
         Gemini 2.0 family deprecates June 1, 2026.
   ─────────────────────────────────────────────────────────────────────────── */
export const GEMINI_MODELS = [
  // ── 3.1 Family (Preview) ──
  { id: 'gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite (Preview)' },
  // ── 2.5 Family (Current / Recommended) ──
  { id: 'gemini-2.5-pro',            label: 'Gemini 2.5 Pro ✦' },
  { id: 'gemini-2.5-flash',          label: 'Gemini 2.5 Flash ✦' },
  { id: 'gemini-2.5-flash-lite',     label: 'Gemini 2.5 Flash Lite ✦' },
  // ── 2.0 Family (Deprecating June 1, 2026) ──
  { id: 'gemini-2.0-flash',          label: 'Gemini 2.0 Flash (يُوقَف قريباً)' },
  { id: 'gemini-2.0-flash-lite',     label: 'Gemini 2.0 Flash Lite (يُوقَف قريباً)' },
];

/* ─── OpenRouter models (openrouter.ai) ──────────────────────────────────────
   Updated: April 2026 — 290+ models available; curated selection below.
   ─────────────────────────────────────────────────────────────────────────── */
export const OPENROUTER_MODELS = [
  // ── Anthropic Claude ──
  { id: 'anthropic/claude-opus-4.6',        label: 'Claude Opus 4.6 🏆' },
  { id: 'anthropic/claude-opus-4.6-fast',   label: 'Claude Opus 4.6 (Fast)' },
  { id: 'anthropic/claude-sonnet-4.6',      label: 'Claude Sonnet 4.6 ✦' },
  { id: 'anthropic/claude-opus-4.5',        label: 'Claude Opus 4.5' },
  { id: 'anthropic/claude-haiku-4.5',       label: 'Claude Haiku 4.5' },
  { id: 'anthropic/claude-3.5-haiku',       label: 'Claude 3.5 Haiku' },
  // ── OpenAI GPT ──
  { id: 'openai/gpt-5.4',                   label: 'GPT-5.4 🏆' },
  { id: 'openai/gpt-5.2',                   label: 'GPT-5.2' },
  { id: 'openai/gpt-4o',                    label: 'GPT-4o' },
  { id: 'openai/gpt-4o-mini',               label: 'GPT-4o Mini' },
  { id: 'openai/gpt-oss-120b',              label: 'GPT-OSS-120B (مجاني)' },
  // ── Google Gemini ──
  { id: 'google/gemini-3.1-pro-preview',    label: 'Gemini 3.1 Pro (Preview)' },
  { id: 'google/gemini-3.1-flash-lite',     label: 'Gemini 3.1 Flash Lite' },
  { id: 'google/gemini-2.5-pro',            label: 'Gemini 2.5 Pro ✦' },
  { id: 'google/gemini-2.5-flash',          label: 'Gemini 2.5 Flash ✦' },
  { id: 'google/gemma-3-27b-it',            label: 'Gemma 3 27B (مجاني)' },
  { id: 'google/gemma-4-26b-a4b-it:free',   label: 'Gemma 4 26B (مجاني)' },
  // ── Meta Llama ──
  { id: 'meta-llama/llama-4-maverick',      label: 'Llama 4 Maverick' },
  { id: 'meta-llama/llama-4-scout',         label: 'Llama 4 Scout (10M ctx)' },
  { id: 'meta-llama/llama-3.3-70b-instruct',label: 'Llama 3.3 70B' },
  // ── DeepSeek ──
  { id: 'deepseek/deepseek-v3-2',           label: 'DeepSeek V3.2 ✦' },
  { id: 'deepseek/deepseek-r1',             label: 'DeepSeek R1' },
  // ── Qwen / Alibaba ──
  { id: 'qwen/qwen3-coder-480b-a35b',       label: 'Qwen3 Coder 480B' },
  { id: 'qwen/qwen-2.5-72b-instruct',       label: 'Qwen 2.5 72B' },
  // ── Zhipu AI ──
  { id: 'z-ai/glm-5.1',                     label: 'GLM-5.1 (Z.ai)' },
  // ── Mistral ──
  { id: 'mistralai/devstral',               label: 'Devstral (كود)' },
  { id: 'mistralai/mistral-large',          label: 'Mistral Large' },
];

/* ─── AgentRouter models (agentrouter.org) ───────────────────────────────────
   Updated: April 2026 — OpenAI-compatible gateway (non-profit, generous credits).
   Supports: Anthropic, OpenAI, DeepSeek, Zhipu AI (GLM).
   ─────────────────────────────────────────────────────────────────────────── */
export const AGENTROUTER_MODELS = [
  // ── OpenAI GPT ──
  { id: 'gpt-5',                            label: 'GPT-5 🏆' },
  { id: 'gpt-4o',                           label: 'GPT-4o' },
  { id: 'gpt-4o-mini',                      label: 'GPT-4o Mini' },
  { id: 'gpt-4.1',                          label: 'GPT-4.1' },
  { id: 'gpt-4.1-mini',                     label: 'GPT-4.1 Mini' },
  // ── Anthropic Claude ──
  { id: 'claude-sonnet-4-5-20250929',       label: 'Claude Sonnet 4.5 ✦' },
  { id: 'claude-haiku-4-5-20251001',        label: 'Claude Haiku 4.5' },
  { id: 'claude-3-5-haiku-20241022',        label: 'Claude 3.5 Haiku' },
  // ── DeepSeek ──
  { id: 'deepseek-v3.1',                    label: 'DeepSeek V3.1' },
  { id: 'deepseek-chat',                    label: 'DeepSeek Chat' },
  { id: 'deepseek-r1',                      label: 'DeepSeek R1' },
  // ── Zhipu AI (GLM) ──
  { id: 'glm-4.6',                          label: 'GLM-4.6 (Zhipu AI)' },
  { id: 'glm-4.5-air',                      label: 'GLM-4.5 Air (Zhipu AI)' },
  { id: 'glm-4',                            label: 'GLM-4 (Zhipu AI)' },
];

export function getModelList(provider) {
  if (provider === 'gemini') return GEMINI_MODELS;
  if (provider === 'openrouter') return OPENROUTER_MODELS;
  if (provider === 'agentrouter') return AGENTROUTER_MODELS;
  return [];
}

export function getDefaultModel(provider) {
  if (provider === 'gemini') return 'gemini-2.5-flash';
  if (provider === 'openrouter') return 'anthropic/claude-sonnet-4.6';
  if (provider === 'agentrouter') return 'gpt-4o';
  return '';
}

export async function callAI({ systemPrompt, messages, appSettings }) {
  const provider = appSettings?.aiProvider || 'gemini';

  if (provider === 'gemini') {
    const apiKey = appSettings?.geminiApiKey || '';
    if (!apiKey) throw new Error('NO_KEY');
    const model = appSettings?.geminiModel || 'gemini-2.5-flash';
    return callGemini({ systemPrompt, messages, apiKey, model });

  } else if (provider === 'openrouter') {
    const apiKey = appSettings?.openrouterApiKey || '';
    if (!apiKey) throw new Error('NO_KEY');
    const model = appSettings?.openrouterModel || 'anthropic/claude-sonnet-4.6';
    return callOpenRouterCompat({
      systemPrompt, messages, apiKey, model,
      baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
      extraHeaders: {
        'HTTP-Referer': 'https://miftah.store',
        'X-Title': 'Miftah Store Manager',
      },
    });

  } else if (provider === 'agentrouter') {
    const apiKey = appSettings?.agentrouterApiKey || '';
    if (!apiKey) throw new Error('NO_KEY');
    const model = appSettings?.agentrouterModel || 'gpt-4o';
    return callOpenRouterCompat({
      systemPrompt, messages, apiKey, model,
      baseUrl: 'https://agentrouter.org/v1/chat/completions',
    });

  } else {
    throw new Error('NO_KEY');
  }
}

async function callGemini({ systemPrompt, messages, apiKey, model }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `خطأ في الاتصال: HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callOpenRouterCompat({ systemPrompt, messages, apiKey, model, baseUrl, extraHeaders = {} }) {
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `خطأ في الاتصال: HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}
