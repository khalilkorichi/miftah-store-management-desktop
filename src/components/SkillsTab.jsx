import React, { useState, useCallback, useMemo } from 'react';
import { PlusIcon, ChevronDownIcon, SparklesIcon, XIcon } from './Icons';
import SkillCard, { StarRating } from './SkillCard';
import SkillEditor from './SkillEditor';
import SkillUploader from './SkillUploader';
import { loadSkills, saveSkills, SKILL_CATEGORIES } from '../data/builtinSkills';

const TASK_SUGGESTIONS = [
  { label: 'تحسين وصف منتج', keywords: ['محتوى', 'كتابة', 'وصف', 'منتج', 'تسويق', 'SEO', 'سيو'] },
  { label: 'إطلاق منتج جديد', keywords: ['إطلاق', 'منتج', 'حملة', 'ترويج', 'تسويق', 'إعلان', 'خطة'] },
  { label: 'تحسين المبيعات', keywords: ['مبيعات', 'بيع', 'تحويل', 'عروض', 'خصم', 'كوبون', 'نمو'] },
  { label: 'تحسين ظهور المتجر', keywords: ['سيو', 'SEO', 'محركات البحث', 'كلمات مفتاحية', 'ترتيب', 'ظهور'] },
  { label: 'تحليل المنافسين', keywords: ['منافسة', 'تحليل', 'سوق', 'مقارنة', 'تموضع', 'أسعار'] },
  { label: 'إنشاء حملة إعلانية', keywords: ['إعلان', 'حملة', 'جوجل', 'فيسبوك', 'سناب', 'تسويق', 'ميتا'] },
  { label: 'زيادة ولاء العملاء', keywords: ['عملاء', 'احتفاظ', 'ولاء', 'خسارة', 'دعم', 'رضا'] },
  { label: 'تسعير المنتجات', keywords: ['تسعير', 'سعر', 'ربح', 'هامش', 'استراتيجية', 'قيمة'] },
  { label: 'نشر محتوى تواصل اجتماعي', keywords: ['تواصل', 'إنستغرام', 'تويتر', 'سناب', 'محتوى', 'نشر'] },
  { label: 'كتابة مقال مدونة', keywords: ['مدونة', 'مقال', 'كتابة', 'SEO', 'محتوى', 'تدوين'] },
];

function analyzeSkillsForTask(skills, taskText) {
  const words = taskText.toLowerCase().split(/\s+/);
  const scored = skills
    .filter(s => s.enabled)
    .map(skill => {
      let score = 0;
      const allTerms = [
        ...(skill.tags || []),
        skill.name,
        skill.description || '',
      ].join(' ').toLowerCase();

      for (const word of words) {
        if (word.length < 2) continue;
        if (allTerms.includes(word)) score += 3;
      }

      const suggestion = TASK_SUGGESTIONS.find(ts =>
        words.some(w => ts.label.includes(w)) ||
        ts.keywords.some(k => words.some(w => k.includes(w) || w.includes(k)))
      );
      if (suggestion) {
        for (const kw of suggestion.keywords) {
          if (allTerms.includes(kw.toLowerCase())) score += 2;
        }
      }

      score += (skill.rating || 0) * 0.5;
      score += (skill.priority || 0) * 0.3;

      return { skill, score };
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return scored;
}

export default function SkillsTab() {
  const [skills, setSkills] = useState(() => loadSkills());
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [collapsedFolders, setCollapsedFolders] = useState({});
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResults, setAiResults] = useState(null);

  const persist = useCallback((updated) => {
    setSkills(updated);
    saveSkills(updated);
  }, []);

  const handleToggle = (id) => {
    persist(skills.map(s => s.id === id ? { ...s, enabled: !s.enabled, updatedAt: Date.now() } : s));
  };

  const handleSelect = (skill) => {
    setSelectedSkill(skill);
  };

  const handleNew = () => {
    setSelectedSkill({ __new: true, id: '__new__' });
  };

  const handleSave = (updated) => {
    persist(skills.map(s => s.id === updated.id ? updated : s));
    setSelectedSkill(updated);
  };

  const handleCreate = (newSkill) => {
    const updated = [...skills, newSkill];
    persist(updated);
    setSelectedSkill(newSkill);
  };

  const handleDelete = (id) => {
    const updated = skills.filter(s => s.id !== id);
    persist(updated);
    setSelectedSkill(null);
  };

  const handleUpload = (skill) => {
    const existing = skills.find(s => s.name === skill.name);
    if (existing) {
      const updated = skills.map(s => s.name === skill.name ? { ...s, ...skill, id: s.id } : s);
      persist(updated);
      setSelectedSkill({ ...existing, ...skill, id: existing.id });
    } else {
      const updated = [...skills, skill];
      persist(updated);
      setSelectedSkill(skill);
    }
  };

  const toggleFolder = (catId) => {
    setCollapsedFolders(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleAiAnalyze = () => {
    if (!aiQuery.trim()) return;
    const results = analyzeSkillsForTask(skills, aiQuery.trim());
    setAiResults(results);
  };

  const handleSuggestionClick = (suggestion) => {
    setAiQuery(suggestion.label);
    const results = analyzeSkillsForTask(skills, suggestion.label);
    setAiResults(results);
  };

  const grouped = useMemo(() => {
    const map = {};
    for (const cat of SKILL_CATEGORIES) {
      map[cat.id] = { ...cat, skills: [] };
    }
    for (const skill of skills) {
      const catId = skill.category || 'other';
      if (!map[catId]) map[catId] = { ...SKILL_CATEGORIES.find(c => c.id === 'other'), id: catId, skills: [] };
      map[catId].skills.push(skill);
    }
    return SKILL_CATEGORIES.filter(cat => map[cat.id]?.skills.length > 0).map(cat => map[cat.id]);
  }, [skills]);

  const enabledCount = skills.filter(s => s.enabled).length;
  const customCount = skills.filter(s => s.type === 'custom').length;

  return (
    <div className="skills-tab">
      <div className="skills-lib">
        <div className="skills-summary-card">
          <div className="skills-summary-stat">
            <span className="skills-summary-num">{skills.length}</span>
            <span className="skills-summary-label">إجمالي</span>
          </div>
          <div className="skills-summary-stat">
            <span className="skills-summary-num skills-num-green">{enabledCount}</span>
            <span className="skills-summary-label">مفعّلة</span>
          </div>
          <div className="skills-summary-stat">
            <span className="skills-summary-num skills-num-blue">{customCount}</span>
            <span className="skills-summary-label">مخصصة</span>
          </div>
        </div>

        <div className="skills-lib-actions">
          <button className="skills-lib-btn skills-lib-btn-new" onClick={handleNew}>
            <PlusIcon className="icon-xs" /> مهارة جديدة
          </button>
          <button
            className={`skills-lib-btn skills-lib-btn-ai ${aiPanelOpen ? 'skills-lib-btn-ai-active' : ''}`}
            onClick={() => { setAiPanelOpen(!aiPanelOpen); if (aiPanelOpen) { setAiResults(null); setAiQuery(''); } }}
          >
            <SparklesIcon className="icon-xs" /> تحليل ذكي
          </button>
          <SkillUploader
            onUpload={handleUpload}
            existingNames={skills.map(s => s.name)}
          />
        </div>

        {aiPanelOpen && (
          <div className="skills-ai-panel">
            <div className="skills-ai-header">
              <SparklesIcon className="icon-xs" />
              <span>اختيار المهارة الأنسب</span>
              <button className="skills-ai-close" onClick={() => { setAiPanelOpen(false); setAiResults(null); setAiQuery(''); }}>
                <XIcon className="icon-xs" />
              </button>
            </div>
            <p className="skills-ai-desc">اكتب المهمة التي تريد إنجازها وسيقترح النظام أفضل المهارات المناسبة</p>
            <div className="skills-ai-input-row">
              <input
                className="skills-ai-input"
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                placeholder="مثال: أريد تحسين وصف منتجاتي لمحركات البحث..."
                onKeyDown={e => e.key === 'Enter' && handleAiAnalyze()}
              />
              <button className="skills-ai-btn" onClick={handleAiAnalyze} disabled={!aiQuery.trim()}>
                تحليل
              </button>
            </div>
            <div className="skills-ai-suggestions">
              {TASK_SUGGESTIONS.slice(0, 5).map(s => (
                <button key={s.label} className="skills-ai-chip" onClick={() => handleSuggestionClick(s)}>
                  {s.label}
                </button>
              ))}
            </div>

            {aiResults && (
              <div className="skills-ai-results">
                {aiResults.length === 0 ? (
                  <p className="skills-ai-no-result">لم يتم العثور على مهارات مناسبة. جرّب وصفاً مختلفاً أو فعّل مهارات إضافية.</p>
                ) : (
                  <>
                    <div className="skills-ai-results-title">المهارات المقترحة (مرتّبة حسب الملاءمة):</div>
                    {aiResults.map(({ skill, score }, idx) => {
                      const cat = SKILL_CATEGORIES.find(c => c.id === skill.category);
                      return (
                        <div
                          key={skill.id}
                          className="skills-ai-result-card"
                          onClick={() => { setSelectedSkill(skill); }}
                        >
                          <div className="skills-ai-result-rank">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                          </div>
                          <div className="skills-ai-result-icon" style={{ background: (skill.color || '#5E4FDE') + '22', color: skill.color }}>
                            {skill.icon}
                          </div>
                          <div className="skills-ai-result-info">
                            <div className="skills-ai-result-name">{skill.name}</div>
                            <div className="skills-ai-result-meta">
                              {cat && <span className="skills-ai-result-cat" style={{ color: cat.color }}>{cat.icon} {cat.label}</span>}
                              <StarRating rating={skill.rating} />
                              <span className="skills-ai-result-score">ملاءمة: {Math.round(score * 10)}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div className="skills-list">
          {grouped.map(group => {
            const isCollapsed = collapsedFolders[group.id];
            const enabledInGroup = group.skills.filter(s => s.enabled).length;
            return (
              <div key={group.id} className="skills-folder">
                <button
                  className={`skills-folder-header ${isCollapsed ? 'skills-folder-collapsed' : ''}`}
                  onClick={() => toggleFolder(group.id)}
                  style={{ '--folder-color': group.color }}
                >
                  <span className="skills-folder-icon">{group.icon}</span>
                  <span className="skills-folder-name">{group.label}</span>
                  <span className="skills-folder-count">{enabledInGroup}/{group.skills.length}</span>
                  <ChevronDownIcon className="icon-xs skills-folder-chevron" />
                </button>
                {!isCollapsed && (
                  <div className="skills-folder-content">
                    {group.skills.map(skill => (
                      <SkillCard
                        key={skill.id}
                        skill={skill}
                        isSelected={selectedSkill?.id === skill.id}
                        onSelect={handleSelect}
                        onToggle={handleToggle}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="skills-editor-panel">
        <SkillEditor
          skill={selectedSkill}
          onSave={handleSave}
          onDelete={handleDelete}
          onCreate={handleCreate}
        />
      </div>
    </div>
  );
}
