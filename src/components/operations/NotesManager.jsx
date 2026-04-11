import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  PlusIcon, SearchIcon, XIcon, EditIcon, TrashIcon,
  TagIcon, StarIcon, PinIcon, GridIcon, FilterIcon,
  CheckCircleIcon, ClockIcon
} from '../Icons';

const NOTE_COLORS = [
  { id: 'default', bg: 'var(--bg-card)', border: 'var(--border-color)', label: 'افتراضي' },
  { id: 'purple', bg: '#2d2254', border: '#5e4fde44', label: 'بنفسجي' },
  { id: 'blue', bg: '#1e3a5f', border: '#3b82f644', label: 'أزرق' },
  { id: 'green', bg: '#1a3a2a', border: '#22c55e44', label: 'أخضر' },
  { id: 'yellow', bg: '#3d3520', border: '#eab30844', label: 'أصفر' },
  { id: 'red', bg: '#3d2020', border: '#ef444444', label: 'أحمر' },
  { id: 'teal', bg: '#1a3535', border: '#14b8a644', label: 'سماوي' },
  { id: 'orange', bg: '#3d2d1a', border: '#f9731644', label: 'برتقالي' },
];

const LIGHT_NOTE_COLORS = {
  default: { bg: 'var(--bg-card)', border: 'var(--border-color)' },
  purple: { bg: '#ede9fe', border: '#a78bfa66' },
  blue: { bg: '#dbeafe', border: '#60a5fa66' },
  green: { bg: '#dcfce7', border: '#4ade8066' },
  yellow: { bg: '#fef9c3', border: '#facc1566' },
  red: { bg: '#fee2e2', border: '#f8717166' },
  teal: { bg: '#ccfbf1', border: '#2dd4bf66' },
  orange: { bg: '#ffedd5', border: '#fb923c66' },
};

function getNoteColor(colorId) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    return NOTE_COLORS.find(c => c.id === colorId) || NOTE_COLORS[0];
  }
  const light = LIGHT_NOTE_COLORS[colorId] || LIGHT_NOTE_COLORS.default;
  return { id: colorId, ...light, label: '' };
}

const DEFAULT_CATEGORIES = [
  { id: 'general', name: 'عام', color: '#6366f1' },
  { id: 'ideas', name: 'أفكار', color: '#f59e0b' },
  { id: 'important', name: 'مهم', color: '#ef4444' },
  { id: 'work', name: 'عمل', color: '#3b82f6' },
  { id: 'personal', name: 'شخصي', color: '#22c55e' },
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function NoteCard({ note, onEdit, onDelete, onTogglePin, categories }) {
  const color = getNoteColor(note.color || 'default');
  const cat = categories.find(c => c.id === note.categoryId);
  const lines = (note.content || '').split('\n');
  const hasChecklist = lines.some(l => l.startsWith('[ ] ') || l.startsWith('[x] '));

  return (
    <div
      className={`keep-note-card ${note.pinned ? 'keep-note-pinned' : ''}`}
      style={{ background: color.bg, borderColor: color.border }}
      onClick={() => onEdit(note)}
    >
      {note.pinned && (
        <div className="keep-note-pin-badge">
          <PinIcon className="icon-xs" />
        </div>
      )}
      {note.title && <div className="keep-note-title">{note.title}</div>}
      <div className="keep-note-body">
        {hasChecklist ? (
          lines.slice(0, 6).map((line, i) => {
            if (line.startsWith('[x] ')) return (
              <div key={i} className="keep-note-check done"><CheckCircleIcon className="icon-xs" /><span>{line.slice(4)}</span></div>
            );
            if (line.startsWith('[ ] ')) return (
              <div key={i} className="keep-note-check"><div className="keep-check-box" /><span>{line.slice(4)}</span></div>
            );
            return <div key={i} className="keep-note-line">{line}</div>;
          })
        ) : (
          <div className="keep-note-text">{note.content?.slice(0, 200)}{note.content?.length > 200 ? '...' : ''}</div>
        )}
        {lines.length > 6 && hasChecklist && <div className="keep-note-more">+{lines.length - 6} عنصر آخر</div>}
      </div>
      <div className="keep-note-footer">
        {cat && (
          <span className="keep-note-cat" style={{ background: cat.color + '22', color: cat.color, borderColor: cat.color + '44' }}>
            <TagIcon className="icon-xxs" />
            {cat.name}
          </span>
        )}
        <span className="keep-note-date">
          {new Date(note.updatedAt || note.createdAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
        </span>
      </div>
      <div className="keep-note-actions" onClick={e => e.stopPropagation()}>
        <button className="keep-action-btn" onClick={() => onTogglePin(note.id)} title={note.pinned ? 'إلغاء التثبيت' : 'تثبيت'}>
          <PinIcon className="icon-xs" />
        </button>
        <button className="keep-action-btn keep-action-delete" onClick={() => onDelete(note.id)} title="حذف">
          <TrashIcon className="icon-xs" />
        </button>
      </div>
    </div>
  );
}

function NoteModal({ note, onSave, onClose, categories, onAddCategory }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [color, setColor] = useState(note?.color || 'default');
  const [categoryId, setCategoryId] = useState(note?.categoryId || '');
  const [pinned, setPinned] = useState(note?.pinned || false);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');
  const contentRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (contentRef.current && !note) {
      contentRef.current.focus();
    }
  }, []);

  const handleSave = () => {
    if (!title.trim() && !content.trim()) return;
    onSave({
      id: note?.id || generateId(),
      title: title.trim(),
      content: content.trim(),
      color,
      categoryId: categoryId || null,
      pinned,
      createdAt: note?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCat = { id: generateId(), name: newCatName.trim(), color: newCatColor };
    onAddCategory(newCat);
    setCategoryId(newCat.id);
    setNewCatName('');
    setShowNewCat(false);
  };

  const selColor = getNoteColor(color);

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) onClose(); }} onKeyDown={e => e.key === 'Escape' && onClose()} role="dialog" aria-modal="true">
      <div className="modal-box keep-modal-box" dir="rtl" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, #5E4FDE 0%, #7b6ff0 100%)', color: '#fff' }}>
          <div className="modal-header-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EditIcon />
          </div>
          <div className="modal-header-text">
            <h2>{note ? 'تعديل الملاحظة' : 'ملاحظة جديدة'}</h2>
            <p>{note ? 'قم بتعديل محتوى الملاحظة' : 'أنشئ ملاحظة جديدة لتنظيم أفكارك'}</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="إغلاق" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XIcon className="icon-sm" />
          </button>
        </div>

        <div className="keep-modal-body" style={{ background: selColor.bg, borderColor: selColor.border }}>
          <div className="modal-field">
            <label className="modal-label">
              <span className="label-icon" style={{ display: 'flex' }}><TagIcon className="icon-xs" /></span>
              عنوان الملاحظة
            </label>
            <input
              className="modal-input"
              placeholder="عنوان الملاحظة..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              dir="rtl"
              maxLength={120}
            />
          </div>

          <div className="modal-field">
            <label className="modal-label">
              <span className="label-icon" style={{ display: 'flex' }}><EditIcon className="icon-xs" /></span>
              المحتوى
              <span className="modal-hint">يمكنك كتابة قوائم مهام باستخدام [ ] و [x]</span>
            </label>
            <textarea
              ref={contentRef}
              className="modal-input keep-modal-textarea"
              placeholder={"اكتب ملاحظتك هنا...\nيمكنك كتابة قائمة مهام:\n[ ] مهمة غير مكتملة\n[x] مهمة مكتملة"}
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={10}
              dir="rtl"
            />
          </div>

          <div className="modal-field">
            <label className="modal-label">
              <span className="label-icon" style={{ display: 'flex' }}>🎨</span>
              لون الملاحظة
            </label>
            <div className="keep-modal-colors">
              {NOTE_COLORS.map(c => (
                <button
                  key={c.id}
                  className={`keep-color-btn ${color === c.id ? 'keep-color-active' : ''}`}
                  style={{ background: getNoteColor(c.id).bg, borderColor: color === c.id ? 'var(--accent-blue)' : getNoteColor(c.id).border }}
                  onClick={() => setColor(c.id)}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="keep-modal-options-row">
            <div className="modal-field keep-modal-cat-field">
              <label className="modal-label">
                <span className="label-icon" style={{ display: 'flex' }}><TagIcon className="icon-xs" /></span>
                التصنيف
              </label>
              <div className="keep-modal-cat-row">
                <select className="keep-cat-select" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                  <option value="">بدون تصنيف</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button className="keep-add-cat-btn" onClick={() => setShowNewCat(!showNewCat)} title="تصنيف جديد">
                  <PlusIcon className="icon-xs" />
                </button>
              </div>
            </div>

            <div className="modal-field keep-modal-pin-field">
              <label className="modal-label">
                <span className="label-icon" style={{ display: 'flex' }}><PinIcon className="icon-xs" /></span>
                التثبيت
              </label>
              <button
                className={`keep-pin-toggle ${pinned ? 'keep-pin-active' : ''}`}
                onClick={() => setPinned(!pinned)}
              >
                <PinIcon className="icon-xs" />
                <span>{pinned ? 'مثبّتة' : 'غير مثبّتة'}</span>
              </button>
            </div>
          </div>

          {showNewCat && (
            <div className="keep-new-cat-row" style={{ animation: 'fadeIn 0.15s ease-out' }}>
              <input
                className="keep-new-cat-input"
                placeholder="اسم التصنيف..."
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                autoFocus
              />
              <input
                type="color"
                className="keep-new-cat-color"
                value={newCatColor}
                onChange={e => setNewCatColor(e.target.value)}
              />
              <button className="keep-add-cat-confirm" onClick={handleAddCategory} disabled={!newCatName.trim()}>إضافة</button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-btn modal-btn-ghost" onClick={onClose}>إلغاء</button>
          <button className="modal-btn modal-btn-primary" onClick={handleSave} disabled={!title.trim() && !content.trim()}>
            <CheckCircleIcon className="icon-sm" style={{ display: 'flex' }} />
            {note ? 'حفظ التعديلات' : 'إضافة الملاحظة'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryManager({ categories, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
  };

  const saveEdit = () => {
    if (!editName.trim()) return;
    onUpdate({ id: editingId, name: editName.trim(), color: editColor });
    setEditingId(null);
  };

  return (
    <div className="keep-cat-manager">
      <div className="keep-cat-manager-title">
        <TagIcon className="icon-sm" />
        <span>إدارة التصنيفات</span>
      </div>
      <div className="keep-cat-list">
        {categories.map(cat => (
          <div key={cat.id} className="keep-cat-item">
            {editingId === cat.id ? (
              <div className="keep-cat-edit-row">
                <input
                  className="keep-cat-edit-input"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveEdit()}
                />
                <input type="color" className="keep-new-cat-color" value={editColor} onChange={e => setEditColor(e.target.value)} />
                <button className="keep-add-cat-confirm" onClick={saveEdit}>حفظ</button>
                <button className="keep-modal-cancel" onClick={() => setEditingId(null)}>إلغاء</button>
              </div>
            ) : (
              <>
                <span className="keep-cat-chip" style={{ background: cat.color + '22', color: cat.color, borderColor: cat.color + '44' }}>
                  {cat.name}
                </span>
                <div className="keep-cat-actions">
                  <button className="keep-action-btn" onClick={() => startEdit(cat)}><EditIcon className="icon-xs" /></button>
                  <button className="keep-action-btn keep-action-delete" onClick={() => onDelete(cat.id)}><TrashIcon className="icon-xs" /></button>
                </div>
              </>
            )}
          </div>
        ))}
        {categories.length === 0 && (
          <div className="keep-cat-empty">لا توجد تصنيفات بعد</div>
        )}
      </div>
    </div>
  );
}

export default function NotesManager({ notes, setNotes }) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [showCatManager, setShowCatManager] = useState(false);
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('miftah_note_categories');
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    } catch { return DEFAULT_CATEGORIES; }
  });

  useEffect(() => {
    localStorage.setItem('miftah_note_categories', JSON.stringify(categories));
  }, [categories]);

  const handleSaveNote = (noteData) => {
    setNotes(prev => {
      const idx = prev.findIndex(n => n.id === noteData.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = noteData;
        return updated;
      }
      return [noteData, ...prev];
    });
    setShowModal(false);
    setEditingNote(null);
  };

  const handleDeleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleTogglePin = (id) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() } : n));
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setShowModal(true);
  };

  const handleAddCategory = (cat) => {
    setCategories(prev => [...prev, cat]);
  };

  const handleUpdateCategory = (updated) => {
    setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleDeleteCategory = (id) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    setNotes(prev => prev.map(n => n.categoryId === id ? { ...n, categoryId: null } : n));
  };

  const filtered = useMemo(() => {
    let result = [...(notes || [])];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(n =>
        (n.title || '').toLowerCase().includes(q) ||
        (n.content || '').toLowerCase().includes(q)
      );
    }
    if (filterCategory !== 'all') {
      if (filterCategory === 'pinned') {
        result = result.filter(n => n.pinned);
      } else if (filterCategory === 'uncategorized') {
        result = result.filter(n => !n.categoryId);
      } else {
        result = result.filter(n => n.categoryId === filterCategory);
      }
    }
    const pinned = result.filter(n => n.pinned).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const unpinned = result.filter(n => !n.pinned).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return { pinned, unpinned };
  }, [notes, search, filterCategory]);

  const totalCount = (notes || []).length;
  const pinnedCount = (notes || []).filter(n => n.pinned).length;

  return (
    <div className="keep-container">
      <div className="keep-toolbar">
        <div className="keep-toolbar-start">
          <button className="ops-btn ops-btn-primary keep-add-btn" onClick={() => { setEditingNote(null); setShowModal(true); }}>
            <PlusIcon className="icon-xs" />
            <span>ملاحظة جديدة</span>
          </button>
          <button
            className={`ops-btn ops-btn-ghost keep-cat-mgr-btn ${showCatManager ? 'keep-cat-mgr-active' : ''}`}
            onClick={() => setShowCatManager(!showCatManager)}
          >
            <TagIcon className="icon-xs" />
            <span>التصنيفات</span>
          </button>
        </div>
        <div className="keep-toolbar-end">
          <div className="keep-search-box">
            <SearchIcon className="icon-xs" />
            <input
              className="keep-search-input"
              placeholder="بحث في الملاحظات..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className="keep-search-clear" onClick={() => setSearch('')}><XIcon className="icon-xs" /></button>}
          </div>
          <div className="keep-filter-wrap">
            <FilterIcon className="icon-xs" />
            <select className="keep-filter-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="all">الكل ({totalCount})</option>
              <option value="pinned">المثبّتة ({pinnedCount})</option>
              <option value="uncategorized">بدون تصنيف</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {showCatManager && (
        <CategoryManager
          categories={categories}
          onUpdate={handleUpdateCategory}
          onDelete={handleDeleteCategory}
        />
      )}

      {filtered.pinned.length === 0 && filtered.unpinned.length === 0 ? (
        <div className="unified-empty">
          <div className="unified-empty-icon">
            <EditIcon className="icon-xl" />
          </div>
          <h4>لا توجد ملاحظات{search || filterCategory !== 'all' ? ' تطابق البحث' : ''}</h4>
          <p>{search || filterCategory !== 'all' ? 'جرّب تغيير معايير البحث أو الفلترة' : 'ابدأ بإنشاء ملاحظتك الأولى لتنظيم أفكارك'}</p>
          {!search && filterCategory === 'all' && (
            <button className="unified-empty-action" onClick={() => { setEditingNote(null); setShowModal(true); }}>
              <PlusIcon className="icon-xs" />
              <span>إنشاء ملاحظة</span>
            </button>
          )}
        </div>
      ) : (
        <div className="keep-notes-area">
          {filtered.pinned.length > 0 && (
            <>
              <div className="keep-section-label">
                <PinIcon className="icon-xs" />
                <span>مثبّتة</span>
              </div>
              <div className="keep-grid">
                {filtered.pinned.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                    onTogglePin={handleTogglePin}
                    categories={categories}
                  />
                ))}
              </div>
            </>
          )}
          {filtered.unpinned.length > 0 && (
            <>
              {filtered.pinned.length > 0 && (
                <div className="keep-section-label">
                  <ClockIcon className="icon-xs" />
                  <span>أخرى</span>
                </div>
              )}
              <div className="keep-grid">
                {filtered.unpinned.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                    onTogglePin={handleTogglePin}
                    categories={categories}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {showModal && (
        <NoteModal
          note={editingNote}
          onSave={handleSaveNote}
          onClose={() => { setShowModal(false); setEditingNote(null); }}
          categories={categories}
          onAddCategory={handleAddCategory}
        />
      )}
    </div>
  );
}
