import React, { useState, useEffect } from 'react';
import { TrashIcon, DownloadIcon, PlusIcon, XIcon, SaveIcon } from './Icons';
import MarkdownRenderer from './MarkdownRenderer';
import { SKILL_CATEGORIES } from '../data/builtinSkills';

const PRIORITY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const COLORS = ['#5E4FDE', '#11BA65', '#F7784A', '#FFC530', '#1A51F4', '#EC4899', '#EF4444', '#06B6D4', '#8B5CF6', '#F59E0B'];
const ICONS = ['⚡', '📊', '💰', '✍️', '🏷️', '📦', '🎯', '🔍', '📈', '🛠️', '🤖', '💡', '📝', '🚀', '⭐', '🧠', '📣', '🧲', '🛡️', '✉️', '📋', '📰', '🧪', '🔬', '🤝', '🎉', '📱', '⚙️'];

export default function SkillEditor({ skill, onSave, onDelete, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [priority, setPriority] = useState(5);
  const [rating, setRating] = useState(3);
  const [icon, setIcon] = useState('⚡');
  const [color, setColor] = useState('#5E4FDE');
  const [category, setCategory] = useState('other');
  const [content, setContent] = useState('');
  const [resources, setResources] = useState([]);
  const [tab, setTab] = useState('edit');
  const [saved, setSaved] = useState(false);

  const isNew = skill?.__new === true;
  const isBuiltin = !isNew && skill?.type === 'builtin';

  useEffect(() => {
    if (!skill) return;
    if (isNew) {
      setName(''); setDescription(''); setTagsInput('');
      setPriority(5); setRating(3); setIcon('⚡'); setColor('#5E4FDE');
      setCategory('other'); setContent(''); setResources([]); setSaved(false);
    } else {
      setName(skill.name || '');
      setDescription(skill.description || '');
      setTagsInput((skill.tags || []).join('، '));
      setPriority(skill.priority || 5);
      setRating(skill.rating || 3);
      setIcon(skill.icon || '⚡');
      setColor(skill.color || '#5E4FDE');
      setCategory(skill.category || 'other');
      setContent(skill.content || '');
      setResources(skill.resources || []);
      setSaved(false);
    }
    setTab('edit');
  }, [skill?.id, skill?.__new]);

  const parseTags = (str) =>
    str.split(/[,،\s]+/).map(t => t.trim()).filter(Boolean);

  const buildObj = () => ({
    ...(skill && !isNew ? skill : {}),
    name: name.trim(),
    description: description.trim(),
    tags: parseTags(tagsInput),
    priority: Number(priority),
    rating: Number(rating),
    icon,
    color,
    category,
    content,
    resources,
    type: isNew ? 'custom' : (skill?.type || 'custom'),
    enabled: isNew ? true : (skill?.enabled !== false),
    updatedAt: Date.now(),
  });

  const handleSave = () => {
    if (!name.trim()) { alert('الرجاء إدخال اسم للمهارة'); return; }
    const obj = buildObj();
    if (isNew) {
      onCreate?.({ ...obj, id: `skill_${Date.now()}`, createdAt: Date.now() });
    } else {
      onSave?.(obj);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const obj = buildObj();
    const tagsStr = (obj.tags || []).join(', ');
    const fm = `---\nname: ${obj.name}\ndescription: ${obj.description}\ntags: [${tagsStr}]\npriority: ${obj.priority}\nrating: ${obj.rating}\ntype: ${obj.type}\nicon: ${obj.icon}\ncolor: ${obj.color}\n---\n\n`;
    const md = fm + (obj.content || '');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${obj.name || 'skill'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addResource = () => setResources(prev => [...prev, { name: 'مورد جديد', content: '' }]);
  const updateResource = (idx, key, val) =>
    setResources(prev => prev.map((r, i) => i === idx ? { ...r, [key]: val } : r));
  const removeResource = (idx) =>
    setResources(prev => prev.filter((_, i) => i !== idx));

  if (!skill) {
    return (
      <div className="skill-editor-placeholder">
        <div className="skill-editor-ph-icon">⚡</div>
        <p className="skill-editor-ph-text">اختر مهارة للتعديل أو أنشئ مهارة جديدة</p>
      </div>
    );
  }

  return (
    <div className="skill-editor">
      <div className="skill-editor-pickers">
        <span className="skill-editor-pickers-label">الأيقونة</span>
        <div className="skill-editor-icon-pick">
          {ICONS.map(ic => (
            <button
              key={ic}
              className={`skill-icon-option ${icon === ic ? 'skill-icon-option-active' : ''}`}
              onClick={() => setIcon(ic)}
              title={ic}
            >{ic}</button>
          ))}
        </div>
        <div className="skill-editor-divider" />
        <span className="skill-editor-pickers-label">اللون</span>
        <div className="skill-editor-color-pick">
          {COLORS.map(c => (
            <button
              key={c}
              className={`skill-color-swatch ${color === c ? 'skill-color-swatch-active' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              title={c}
            />
          ))}
        </div>
      </div>

      <div className="skill-editor-fields">
        <div className="skill-editor-field">
          <label className="skill-editor-label">اسم المهارة</label>
          <input
            className="skill-editor-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="مثال: محلل الأسعار"
            disabled={isBuiltin}
          />
        </div>
        <div className="skill-editor-field">
          <label className="skill-editor-label">الوصف</label>
          <input
            className="skill-editor-input"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="متى تُستخدم هذه المهارة؟"
          />
        </div>
        <div className="skill-editor-field-row">
          <div className="skill-editor-field" style={{ flex: 3 }}>
            <label className="skill-editor-label">الكلمات المفتاحية (tags)</label>
            <input
              className="skill-editor-input"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="سعر، ربح، تسعير"
            />
            <span className="skill-editor-hint">افصل بين الكلمات بفاصلة أو مسافة</span>
          </div>
          <div className="skill-editor-field" style={{ flex: 1 }}>
            <label className="skill-editor-label">الأولوية</label>
            <select className="skill-editor-input" value={priority} onChange={e => setPriority(e.target.value)}>
              {PRIORITY_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div className="skill-editor-field-row">
          <div className="skill-editor-field" style={{ flex: 1 }}>
            <label className="skill-editor-label">المجلد (التصنيف)</label>
            <select className="skill-editor-input" value={category} onChange={e => setCategory(e.target.value)}>
              {SKILL_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
              ))}
            </select>
          </div>
          <div className="skill-editor-field" style={{ flex: 1 }}>
            <label className="skill-editor-label">التقييم (النجوم)</label>
            <div className="skill-editor-star-picker">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  className={`skill-editor-star-btn ${n <= rating ? 'skill-editor-star-active' : ''}`}
                  onClick={() => setRating(n)}
                  title={`${n} نجوم`}
                >★</button>
              ))}
              <span className="skill-editor-star-label">{rating}/5</span>
            </div>
          </div>
        </div>
      </div>

      <div className="skill-editor-content-section">
        <div className="skill-editor-tab-bar">
          <button
            className={`skill-editor-tab ${tab === 'edit' ? 'skill-editor-tab-active' : ''}`}
            onClick={() => setTab('edit')}
          >تحرير</button>
          <button
            className={`skill-editor-tab ${tab === 'preview' ? 'skill-editor-tab-active' : ''}`}
            onClick={() => setTab('preview')}
          >معاينة</button>
          <span className="skill-editor-tab-title">محتوى التعليمات</span>
        </div>
        {tab === 'edit' ? (
          <textarea
            className="skill-editor-textarea"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="اكتب تعليمات المهارة هنا بصيغة Markdown..."
            rows={10}
          />
        ) : (
          <div className="skill-editor-preview">
            {content
              ? <MarkdownRenderer content={content} />
              : <p className="skill-editor-preview-empty">لا يوجد محتوى للمعاينة</p>}
          </div>
        )}
      </div>

      <div className="skill-editor-resources">
        <div className="skill-editor-resources-header">
          <span className="skill-editor-label">الموارد المرفقة</span>
          <button className="skill-editor-add-resource-btn" onClick={addResource}>
            <PlusIcon className="icon-xs" /> إضافة
          </button>
        </div>
        {resources.length === 0 && (
          <p className="skill-editor-hint">لا توجد موارد مرفقة — يمكنك إضافة ملفات JSON أو TXT مرجعية</p>
        )}
        {resources.map((res, idx) => (
          <div key={idx} className="skill-resource-row">
            <input
              className="skill-editor-input skill-resource-name"
              value={res.name}
              onChange={e => updateResource(idx, 'name', e.target.value)}
              placeholder="اسم المورد"
            />
            <textarea
              className="skill-editor-input skill-resource-content"
              value={res.content}
              onChange={e => updateResource(idx, 'content', e.target.value)}
              placeholder="محتوى المورد..."
              rows={2}
            />
            <button className="skill-resource-del" onClick={() => removeResource(idx)} title="حذف المورد">
              <XIcon className="icon-xs" />
            </button>
          </div>
        ))}
      </div>

      <div className="skill-editor-actions">
        <div className="skill-editor-actions-left">
          {!isBuiltin && !isNew && (
            <button
              className="skill-action-btn skill-action-delete"
              onClick={() => { if (confirm(`هل تريد حذف مهارة "${skill.name}"؟`)) onDelete?.(skill.id); }}
            >
              <TrashIcon className="icon-xs" /> حذف
            </button>
          )}
        </div>
        <div className="skill-editor-actions-right">
          <button className="skill-action-btn skill-action-export" onClick={handleExport}>
            <DownloadIcon className="icon-xs" /> تصدير .md
          </button>
          <button className="skill-action-btn skill-action-save" onClick={handleSave}>
            {saved ? '✓ تم الحفظ' : (isNew ? 'إنشاء المهارة' : 'حفظ التغييرات')}
          </button>
        </div>
      </div>
    </div>
  );
}
