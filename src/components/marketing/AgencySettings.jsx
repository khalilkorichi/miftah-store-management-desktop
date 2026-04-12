import { useState } from 'react';
import { AGENT_META } from '../../data/contentAgencyData';
import { GEMINI_MODELS, OPENROUTER_MODELS, AGENTROUTER_MODELS } from '../../utils/aiProvider';
import { CheckIcon, PlusIcon, XIcon, TrashIcon } from '../Icons';

const PROVIDERS = [
  { id: 'gemini', label: 'Google Gemini' },
  { id: 'openrouter', label: 'OpenRouter' },
  { id: 'agentrouter', label: 'AgentRouter' },
];

function getModelList(provider) {
  if (provider === 'gemini') return GEMINI_MODELS;
  if (provider === 'openrouter') return OPENROUTER_MODELS;
  if (provider === 'agentrouter') return AGENTROUTER_MODELS;
  return [];
}

export default function AgencySettings({ agencyData, setAgencyData, appSettings }) {
  const [activeSection, setActiveSection] = useState('agents');
  const [newCheckItem, setNewCheckItem] = useState('');

  const updateAgent = (agentId, field, value) => {
    setAgencyData(prev => ({
      ...prev,
      agents: {
        ...prev.agents,
        [agentId]: { ...prev.agents[agentId], [field]: value },
      },
    }));
  };

  const updateBrand = (field, value) => {
    setAgencyData(prev => ({
      ...prev,
      brandIdentity: { ...prev.brandIdentity, [field]: value },
    }));
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    setAgencyData(prev => ({
      ...prev,
      brandIdentity: {
        ...prev.brandIdentity,
        checklistItems: [...(prev.brandIdentity.checklistItems || []), newCheckItem.trim()],
      },
    }));
    setNewCheckItem('');
  };

  const removeCheckItem = (idx) => {
    setAgencyData(prev => ({
      ...prev,
      brandIdentity: {
        ...prev.brandIdentity,
        checklistItems: prev.brandIdentity.checklistItems.filter((_, i) => i !== idx),
      },
    }));
  };

  const updateSchedule = (field, value) => {
    setAgencyData(prev => ({
      ...prev,
      schedule: { ...prev.schedule, [field]: value },
    }));
  };

  const agentIds = ['scott', 'spark', 'brill', 'rami', 'lens'];

  return (
    <div className="agency-settings">
      <div className="agency-settings-nav">
        <button className={`agency-settings-tab ${activeSection === 'agents' ? 'active' : ''}`} onClick={() => setActiveSection('agents')}>
          إعدادات الوكلاء
        </button>
        <button className={`agency-settings-tab ${activeSection === 'brand' ? 'active' : ''}`} onClick={() => setActiveSection('brand')}>
          هوية العلامة التجارية
        </button>
        <button className={`agency-settings-tab ${activeSection === 'schedule' ? 'active' : ''}`} onClick={() => setActiveSection('schedule')}>
          الجدول الزمني
        </button>
      </div>

      {activeSection === 'agents' && (
        <div className="agency-agents-settings">
          {agentIds.map(id => {
            const meta = AGENT_META[id];
            const config = agencyData.agents?.[id] || {};
            const models = getModelList(config.provider || appSettings.aiProvider || 'gemini');

            return (
              <div key={id} className="agent-setting-card" style={{ '--agent-color': meta.color }}>
                <div className="agent-setting-header">
                  <span className="agent-setting-icon">{meta.icon}</span>
                  <div>
                    <span className="agent-setting-name">{meta.name} — {meta.nameAr}</span>
                    <span className="agent-setting-role">{meta.role}</span>
                  </div>
                  <label className="agent-toggle">
                    <input
                      type="checkbox"
                      checked={config.enabled !== false}
                      onChange={e => updateAgent(id, 'enabled', e.target.checked)}
                    />
                    <span className="agent-toggle-slider" />
                  </label>
                </div>

                <div className="agent-setting-fields">
                  <div className="mkt-form-group">
                    <label>المزوّد</label>
                    <select value={config.provider || appSettings.aiProvider || 'gemini'} onChange={e => updateAgent(id, 'provider', e.target.value)}>
                      {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  </div>
                  <div className="mkt-form-group">
                    <label>النموذج</label>
                    <select value={config.model || ''} onChange={e => updateAgent(id, 'model', e.target.value)}>
                      <option value="">الافتراضي</option>
                      {models.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                    </select>
                  </div>
                  <div className="mkt-form-group mkt-form-full">
                    <label>مفتاح API (اختياري — يستخدم الافتراضي إذا تُرك فارغاً)</label>
                    <input
                      type="password"
                      value={config.apiKey || ''}
                      onChange={e => updateAgent(id, 'apiKey', e.target.value)}
                      placeholder="يستخدم المفتاح من الإعدادات العامة"
                      dir="ltr"
                    />
                  </div>
                  <div className="mkt-form-group mkt-form-full">
                    <label>أسلوب الوكيل</label>
                    <textarea
                      value={config.style || ''}
                      onChange={e => updateAgent(id, 'style', e.target.value)}
                      rows={2}
                      placeholder="تعليمات إضافية لتخصيص أسلوب الوكيل..."
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeSection === 'brand' && (
        <div className="agency-brand-settings">
          <div className="mkt-form-card">
            <div className="mkt-form-title">هوية العلامة التجارية (Brand Identity)</div>
            <div className="mkt-form-grid">
              <div className="mkt-form-group mkt-form-full">
                <label>نبرة الصوت</label>
                <textarea
                  value={agencyData.brandIdentity?.voice || ''}
                  onChange={e => updateBrand('voice', e.target.value)}
                  placeholder="مثال: ودية ومحترفة، تستخدم لغة بسيطة ومباشرة..."
                  rows={2}
                />
              </div>
              <div className="mkt-form-group mkt-form-full">
                <label>الكلمات والعبارات المحظورة</label>
                <textarea
                  value={agencyData.brandIdentity?.forbiddenWords || ''}
                  onChange={e => updateBrand('forbiddenWords', e.target.value)}
                  placeholder="كلمات يجب تجنبها، مفصولة بفاصلة..."
                  rows={2}
                />
              </div>
              <div className="mkt-form-group mkt-form-full">
                <label>ألوان وعبارات العلامة</label>
                <input
                  type="text"
                  value={agencyData.brandIdentity?.brandColors || ''}
                  onChange={e => updateBrand('brandColors', e.target.value)}
                  placeholder="مثال: #5E4FDE بنفسجي، شعار 'خلنا على يمناك'"
                />
              </div>
              <div className="mkt-form-group mkt-form-full">
                <label>إرشادات إضافية</label>
                <textarea
                  value={agencyData.brandIdentity?.guidelines || ''}
                  onChange={e => updateBrand('guidelines', e.target.value)}
                  placeholder="أي إرشادات أخرى لفحص الجودة..."
                  rows={3}
                />
              </div>
              <div className="mkt-form-group mkt-form-full">
                <label>قائمة المراجعة (Checklist)</label>
                <div className="brand-checklist">
                  {(agencyData.brandIdentity?.checklistItems || []).map((item, idx) => (
                    <div key={idx} className="brand-checklist-item">
                      <CheckIcon />
                      <span>{item}</span>
                      <button onClick={() => removeCheckItem(idx)}><XIcon /></button>
                    </div>
                  ))}
                  <div className="brand-checklist-add">
                    <input
                      type="text"
                      value={newCheckItem}
                      onChange={e => setNewCheckItem(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addCheckItem()}
                      placeholder="إضافة عنصر جديد..."
                    />
                    <button onClick={addCheckItem} disabled={!newCheckItem.trim()}>
                      <PlusIcon />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'schedule' && (
        <div className="agency-schedule-settings">
          <div className="mkt-form-card">
            <div className="mkt-form-title">الجدول الزمني</div>
            <div className="mkt-form-grid">
              <div className="mkt-form-group">
                <label>تفعيل التوليد التلقائي</label>
                <label className="agent-toggle" style={{ marginTop: 4 }}>
                  <input
                    type="checkbox"
                    checked={agencyData.schedule?.enabled || false}
                    onChange={e => updateSchedule('enabled', e.target.checked)}
                  />
                  <span className="agent-toggle-slider" />
                </label>
              </div>
              <div className="mkt-form-group">
                <label>وقت التوليد اليومي</label>
                <input
                  type="time"
                  value={agencyData.schedule?.time || '08:00'}
                  onChange={e => updateSchedule('time', e.target.value)}
                  disabled={!agencyData.schedule?.enabled}
                />
              </div>
            </div>
            <p className="agency-schedule-note">
              عند التفعيل، سيتم تشغيل Scott و Spark تلقائياً في الوقت المحدد يومياً لتوليد أفكار جديدة.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
