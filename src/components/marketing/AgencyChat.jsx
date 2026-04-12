import { useState, useRef, useEffect, useCallback } from 'react';
import { AGENT_META } from '../../data/contentAgencyData';
import { runAgent } from '../../utils/agentEngine';
import { buildAgencyContext } from '../../utils/storeContextBuilder';
import { SendIcon, SettingsIcon, ChevronDownIcon, ChevronUpIcon, RefreshIcon, TrashIcon } from '../Icons';

const STAGE_FLOW = [
  { id: 'ideation', label: 'توليد الأفكار', agents: ['scott', 'spark'] },
  { id: 'production', label: 'الإنتاج', agents: ['brill', 'rami'] },
  { id: 'qa', label: 'فحص الجودة', agents: ['lens'] },
];

function AgentBubble({ msg, onToggleThinking, onOpenSettings }) {
  const meta = AGENT_META[msg.agentId];
  if (!meta) return null;

  const isWorking = msg.status === 'working';
  const isDone = msg.status === 'done';
  const isError = msg.status === 'error';

  return (
    <div className={`chat-bubble chat-bubble-agent ${isWorking ? 'working' : ''} ${isError ? 'error' : ''}`}>
      <div className="chat-bubble-header">
        <span className="chat-agent-icon" style={{ background: meta.color + '22', color: meta.color }}>
          {meta.icon}
        </span>
        <div className="chat-agent-info">
          <span className="chat-agent-name">{meta.nameAr} ({meta.name})</span>
          <span className="chat-agent-role">{meta.role}</span>
        </div>
        <div className="chat-agent-actions">
          {isWorking && <RefreshIcon className="spinning chat-working-icon" />}
          {isDone && <span className="chat-done-badge">✓</span>}
          {isError && <span className="chat-error-badge">✗</span>}
          <button className="chat-settings-btn" onClick={() => onOpenSettings(msg.agentId)} title="إعدادات الوكيل">
            <SettingsIcon />
          </button>
        </div>
      </div>

      {msg.thinking && (
        <div className="chat-thinking-section">
          <button className="chat-thinking-toggle" onClick={() => onToggleThinking(msg.id)}>
            {msg.thinkingOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            <span>طريقة التفكير</span>
          </button>
          {msg.thinkingOpen && (
            <div className="chat-thinking-content">
              {msg.thinking}
            </div>
          )}
        </div>
      )}

      {msg.content && (
        <div className="chat-bubble-body">
          {typeof msg.content === 'string' ? (
            <pre className="chat-result-text">{msg.content}</pre>
          ) : (
            <pre className="chat-result-text">{JSON.stringify(msg.content, null, 2)}</pre>
          )}
        </div>
      )}

      {isWorking && !msg.content && (
        <div className="chat-bubble-body">
          <div className="chat-typing-indicator">
            <span /><span /><span />
          </div>
        </div>
      )}
    </div>
  );
}

function SystemBubble({ msg }) {
  return (
    <div className={`chat-bubble chat-bubble-system ${msg.status === 'stage' ? 'stage' : ''}`}>
      <span>{msg.content}</span>
    </div>
  );
}

function UserBubble({ msg }) {
  return (
    <div className="chat-bubble chat-bubble-user">
      <div className="chat-bubble-body">{msg.content}</div>
      <span className="chat-time">{new Date(msg.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  );
}

function AgentSettingsPopup({ agentId, agencyData, setAgencyData, appSettings, onClose }) {
  const meta = AGENT_META[agentId];
  const config = agencyData.agents?.[agentId] || {};

  const updateField = (field, value) => {
    setAgencyData(prev => ({
      ...prev,
      agents: {
        ...prev.agents,
        [agentId]: { ...prev.agents[agentId], [field]: value },
      },
    }));
  };

  return (
    <div className="chat-settings-overlay" onClick={onClose}>
      <div className="chat-settings-popup" onClick={e => e.stopPropagation()}>
        <div className="chat-settings-popup-header">
          <span className="chat-agent-icon" style={{ background: meta.color + '22', color: meta.color }}>
            {meta.icon}
          </span>
          <span>{meta.nameAr} — {meta.name}</span>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="chat-settings-popup-body">
          <div className="chat-settings-field">
            <label>مفعّل</label>
            <label className="agent-toggle">
              <input type="checkbox" checked={config.enabled !== false} onChange={e => updateField('enabled', e.target.checked)} />
              <span className="agent-toggle-slider" />
            </label>
          </div>
          <div className="chat-settings-field">
            <label>المزوّد</label>
            <select value={config.provider || appSettings.aiProvider || 'gemini'} onChange={e => updateField('provider', e.target.value)}>
              <option value="gemini">Google Gemini</option>
              <option value="openrouter">OpenRouter</option>
              <option value="agentrouter">AgentRouter</option>
            </select>
          </div>
          <div className="chat-settings-field">
            <label>مفتاح API</label>
            <input type="password" value={config.apiKey || ''} onChange={e => updateField('apiKey', e.target.value)} placeholder="الافتراضي" dir="ltr" />
          </div>
          <div className="chat-settings-field">
            <label>أسلوب الوكيل</label>
            <textarea value={config.style || ''} onChange={e => updateField('style', e.target.value)} rows={2} placeholder="تعليمات إضافية..." />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgencyChat({ agencyData, setAgencyData, appSettings, appData }) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [settingsAgent, setSettingsAgent] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const mountedRef = useRef(true);

  const chatHistory = agencyData.chatHistory || [];

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, scrollToBottom]);

  const setChatHistory = useCallback((updater) => {
    if (!mountedRef.current) return;
    setAgencyData(prev => {
      const prevChat = prev.chatHistory || [];
      const newChat = typeof updater === 'function' ? updater(prevChat) : updater;
      return { ...prev, chatHistory: newChat };
    });
  }, [setAgencyData]);

  const addMessage = useCallback((msg) => {
    setChatHistory(prev => [...prev, msg]);
  }, [setChatHistory]);

  const updateMessage = useCallback((id, updates) => {
    setChatHistory(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, [setChatHistory]);

  const toggleThinking = useCallback((id) => {
    setChatHistory(prev => prev.map(m => m.id === id ? { ...m, thinkingOpen: !m.thinkingOpen } : m));
  }, [setChatHistory]);

  const runChatPipeline = async (userPrompt) => {
    setIsProcessing(true);
    const context = buildAgencyContext(appData);
    const sessionId = Date.now();
    const pipelineItems = [];

    addMessage({ id: `sys_start_${sessionId}`, type: 'system', content: '🚀 بدء معالجة طلبك...', status: 'stage', timestamp: new Date().toISOString() });

    addMessage({ id: `sys_ideation_${sessionId}`, type: 'system', content: '━━ مرحلة توليد الأفكار ━━', status: 'stage', timestamp: new Date().toISOString() });

    const ideationAgents = ['scott', 'spark'].filter(id => agencyData.agents[id]?.enabled);

    const agentMsgIds = {};
    ideationAgents.forEach(id => {
      const msgId = `agent_${id}_${sessionId}`;
      agentMsgIds[id] = msgId;
      addMessage({ id: msgId, type: 'agent', agentId: id, content: null, thinking: null, status: 'working', thinkingOpen: true, timestamp: new Date().toISOString() });
    });

    const ideationResults = await Promise.all(
      ideationAgents.map(async (id) => {
        const msgId = agentMsgIds[id];
        try {
          updateMessage(msgId, { thinking: `${AGENT_META[id].nameAr} يحلل البيانات ويولّد الأفكار...` });
          const result = await runAgent(id, userPrompt, context, agencyData.agents[id], appSettings);
          let parsed;
          try {
            const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            parsed = JSON.parse(cleaned);
          } catch {
            parsed = result;
          }
          updateMessage(msgId, { content: parsed, status: 'done', thinking: `تم تحليل بيانات المتجر وتوليد الأفكار بنجاح.` });
          return { agentId: id, result: parsed, raw: result };
        } catch (e) {
          updateMessage(msgId, { content: `خطأ: ${e.message}`, status: 'error', thinking: `حدث خطأ أثناء المعالجة: ${e.message}` });
          return { agentId: id, error: e.message };
        }
      })
    );

    const now = new Date().toISOString();
    ideationResults.forEach(r => {
      if (r.error) {
        pipelineItems.push({ id: `chat_${sessionId}_${r.agentId}_err`, stage: 'ideation', status: 'error', agentId: r.agentId, content: null, error: r.error, createdAt: now, attempts: 0 });
        return;
      }
      const ideas = Array.isArray(r.result) ? r.result : [r.result];
      ideas.forEach((idea, i) => {
        if (typeof idea === 'string') {
          pipelineItems.push({ id: `chat_${sessionId}_${r.agentId}_${i}`, stage: 'approval', status: 'pending', agentId: r.agentId, contentType: 'post', content: { title: 'فكرة', summary: idea, type: 'post', product: '' }, createdAt: now, attempts: 0 });
        } else {
          pipelineItems.push({ id: `chat_${sessionId}_${r.agentId}_${i}`, stage: 'approval', status: 'pending', agentId: r.agentId, contentType: idea.type || 'post', content: idea, createdAt: now, attempts: 0 });
        }
      });
    });

    addMessage({ id: `sys_approval_${sessionId}`, type: 'system', content: `⏸ تم توليد ${pipelineItems.filter(i => i.stage === 'approval').length} فكرة — بانتظار مراجعتك في صندوق الوارد`, status: 'info', timestamp: new Date().toISOString() });

    setAgencyData(prev => ({
      ...prev,
      pipeline: [...(prev.pipeline || []), ...pipelineItems],
    }));

    const approvedItems = pipelineItems.filter(i => i.stage === 'approval' && i.status === 'pending');
    if (approvedItems.length > 0) {
      addMessage({ id: `sys_prod_hint_${sessionId}`, type: 'system', content: '💡 وافق على الأفكار من صندوق الوارد لبدء مرحلة الإنتاج تلقائياً', status: 'info', timestamp: new Date().toISOString() });
    }

    if (mountedRef.current) {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isProcessing) return;

    addMessage({ id: `user_${Date.now()}`, type: 'user', content: text, timestamp: new Date().toISOString() });
    setInput('');

    await runChatPipeline(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearHistory = () => {
    setChatHistory([]);
  };

  return (
    <div className="agency-chat" dir="rtl">
      <div className="agency-chat-header">
        <div className="agency-chat-title">
          <span className="agency-chat-title-icon">💬</span>
          <span>محادثة الوكلاء</span>
        </div>
        {chatHistory.length > 0 && (
          <button className="agency-chat-clear" onClick={clearHistory} title="مسح المحادثة">
            <TrashIcon />
          </button>
        )}
      </div>

      <div className="agency-chat-messages">
        {chatHistory.length === 0 && (
          <div className="agency-chat-empty">
            <div className="agency-chat-empty-icon">🤖</div>
            <h3>مرحباً بك في وكالة المحتوى</h3>
            <p>اكتب وصفاً للمحتوى الذي تريد إنشاءه وسيبدأ الوكلاء بالعمل</p>
            <div className="agency-chat-suggestions">
              {[
                'أنشئ محتوى تسويقي لأفضل منتجاتنا',
                'ولّد أفكار لحملة رمضانية',
                'اقترح محتوى للسوشيال ميديا',
              ].map((s, i) => (
                <button key={i} className="agency-chat-suggestion" onClick={() => { setInput(s); inputRef.current?.focus(); }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map(msg => {
          if (msg.type === 'user') return <UserBubble key={msg.id} msg={msg} />;
          if (msg.type === 'agent') return <AgentBubble key={msg.id} msg={msg} onToggleThinking={toggleThinking} onOpenSettings={setSettingsAgent} />;
          return <SystemBubble key={msg.id} msg={msg} />;
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="agency-chat-input-area">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="اكتب طلبك هنا... (Enter للإرسال)"
          rows={1}
          disabled={isProcessing}
        />
        <button className="agency-chat-send" onClick={handleSend} disabled={!input.trim() || isProcessing}>
          {isProcessing ? <RefreshIcon className="spinning" /> : <SendIcon />}
        </button>
      </div>

      {settingsAgent && (
        <AgentSettingsPopup
          agentId={settingsAgent}
          agencyData={agencyData}
          setAgencyData={setAgencyData}
          appSettings={appSettings}
          onClose={() => setSettingsAgent(null)}
        />
      )}
    </div>
  );
}
