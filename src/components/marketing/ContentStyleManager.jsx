import { useState } from 'react';
import { PlusIcon, EditIcon, TrashIcon, XIcon, CheckIcon, SearchIcon, PenToolIcon, ChevronDownIcon, ChevronUpIcon } from '../Icons';

const EMPTY_FILE = {
  source: '',
  competitorId: '',
  content: '',
  tone: '',
  headlineStyle: '',
  contentType: '',
  repeatedPhrases: '',
};

export default function ContentStyleManager({ contentStyles, competitors, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FILE });
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const save = () => {
    if (!form.source.trim()) return;
    const item = { ...form, id: editingId || `cs_${Date.now()}`, updatedAt: new Date().toISOString() };
    let newList;
    if (editingId) {
      newList = contentStyles.map(c => c.id === editingId ? item : c);
    } else {
      newList = [...contentStyles, item];
    }
    onUpdate(newList);
    setShowForm(false);
    setEditingId(null);
    setForm({ ...EMPTY_FILE });
  };

  const remove = (id) => {
    onUpdate(contentStyles.filter(c => c.id !== id));
  };

  const startEdit = (file) => {
    setForm({ ...file });
    setEditingId(file.id);
    setShowForm(true);
  };

  const filtered = contentStyles.filter(c =>
    !search || c.source.includes(search) || (c.content || '').includes(search) || (c.tone || '').includes(search)
  );

  return (
    <div className="mkt-section">
      <div className="mkt-section-block">
        <div className="mkt-section-header">
          <div className="mkt-section-header-right">
            <PenToolIcon />
            <h2>أسلوب المحتوى</h2>
            <span className="mkt-badge">{contentStyles.length}</span>
          </div>
          <button className="mkt-btn-primary" onClick={() => { setForm({ ...EMPTY_FILE }); setEditingId(null); setShowForm(true); }}>
            <PlusIcon />
            <span>إضافة ملف تحليل</span>
          </button>
        </div>

        <div className="mkt-search-bar">
          <SearchIcon />
          <input type="text" placeholder="بحث في ملفات التحليل..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {showForm && (
          <div className="mkt-form-card">
            <div className="mkt-form-title">{editingId ? 'تعديل ملف التحليل' : 'إضافة ملف تحليل جديد'}</div>
            <div className="mkt-form-grid">
              <div className="mkt-form-group">
                <label>اسم المنافس أو المصدر</label>
                <input type="text" value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} placeholder="اسم المنافس أو المصدر" />
              </div>
              <div className="mkt-form-group">
                <label>ربط بمنافس موجود (اختياري)</label>
                <select value={form.competitorId} onChange={e => setForm(p => ({ ...p, competitorId: e.target.value }))}>
                  <option value="">بدون ربط</option>
                  {competitors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="mkt-form-group">
                <label>نبرة الكتابة</label>
                <input type="text" value={form.tone} onChange={e => setForm(p => ({ ...p, tone: e.target.value }))} placeholder="رسمية، ودية، حماسية..." />
              </div>
              <div className="mkt-form-group">
                <label>أسلوب العناوين</label>
                <input type="text" value={form.headlineStyle} onChange={e => setForm(p => ({ ...p, headlineStyle: e.target.value }))} placeholder="أسئلة، أرقام، تحفيزي..." />
              </div>
              <div className="mkt-form-group">
                <label>نوع المحتوى الأكثر شيوعاً</label>
                <input type="text" value={form.contentType} onChange={e => setForm(p => ({ ...p, contentType: e.target.value }))} placeholder="كاروسيل، ريلز، ثريد..." />
              </div>
              <div className="mkt-form-group">
                <label>الكلمات والعبارات المتكررة</label>
                <input type="text" value={form.repeatedPhrases} onChange={e => setForm(p => ({ ...p, repeatedPhrases: e.target.value }))} placeholder="عبارات يكررها المنافس..." />
              </div>
              <div className="mkt-form-group mkt-form-full">
                <label>التحليل (يدعم Markdown)</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                  placeholder="اكتب تحليلك هنا... يدعم تنسيق Markdown"
                  rows={8}
                  className="mkt-markdown-editor"
                />
              </div>
            </div>
            <div className="mkt-form-actions">
              <button className="mkt-btn-primary" onClick={save}><CheckIcon /> <span>حفظ</span></button>
              <button className="mkt-btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}><XIcon /> <span>إلغاء</span></button>
            </div>
          </div>
        )}

        {filtered.length === 0 && !showForm ? (
          <div className="mkt-empty">لم يتم إنشاء أي ملف تحليل محتوى بعد</div>
        ) : (
          <div className="mkt-content-files">
            {filtered.map(file => {
              const isExpanded = expandedId === file.id;
              const linkedComp = competitors.find(c => c.id === file.competitorId);
              return (
                <div key={file.id} className="mkt-content-file-card">
                  <div className="mkt-content-file-header" onClick={() => setExpandedId(isExpanded ? null : file.id)}>
                    <div className="mkt-content-file-title">
                      <h3>{file.source}</h3>
                      {linkedComp && <span className="mkt-chip active">{linkedComp.name}</span>}
                    </div>
                    <div className="mkt-content-file-actions">
                      <button onClick={e => { e.stopPropagation(); startEdit(file); }} title="تعديل"><EditIcon /></button>
                      <button onClick={e => { e.stopPropagation(); remove(file.id); }} title="حذف"><TrashIcon /></button>
                      {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    </div>
                  </div>

                  {(file.tone || file.headlineStyle || file.contentType || file.repeatedPhrases) && (
                    <div className="mkt-content-file-meta">
                      {file.tone && <span><strong>النبرة:</strong> {file.tone}</span>}
                      {file.headlineStyle && <span><strong>العناوين:</strong> {file.headlineStyle}</span>}
                      {file.contentType && <span><strong>النوع:</strong> {file.contentType}</span>}
                      {file.repeatedPhrases && <span><strong>عبارات:</strong> {file.repeatedPhrases}</span>}
                    </div>
                  )}

                  {isExpanded && file.content && (
                    <div className="mkt-content-file-body">
                      <pre className="mkt-content-file-text">{file.content}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
