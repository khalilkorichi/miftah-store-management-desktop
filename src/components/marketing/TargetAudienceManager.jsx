import { useState } from 'react';
import { PlusIcon, EditIcon, TrashIcon, XIcon, CheckIcon, UsersIcon, UserIcon } from '../Icons';

const EMPTY_SEGMENT = {
  name: '',
  description: '',
  ageRange: { min: 18, max: 45 },
  gender: 'all',
  education: '',
  income: '',
  interests: '',
  buyingBehavior: '',
  platforms: [],
};

const EMPTY_PERSONA = {
  name: '',
  age: 30,
  job: '',
  challenges: '',
  motivations: '',
  quote: '',
};

const PLATFORM_OPTIONS = [
  'تويتر/X', 'إنستغرام', 'تيك توك', 'سناب شات', 'يوتيوب', 'فيسبوك', 'لينكد إن', 'تلغرام', 'واتساب',
];

const GENDER_OPTIONS = [
  { value: 'all', label: 'الكل' },
  { value: 'male', label: 'ذكور' },
  { value: 'female', label: 'إناث' },
];

export default function TargetAudienceManager({ segments, personas, onUpdate }) {
  const [showSegmentForm, setShowSegmentForm] = useState(false);
  const [showPersonaForm, setShowPersonaForm] = useState(false);
  const [editingSegment, setEditingSegment] = useState(null);
  const [editingPersona, setEditingPersona] = useState(null);
  const [segmentForm, setSegmentForm] = useState({ ...EMPTY_SEGMENT });
  const [personaForm, setPersonaForm] = useState({ ...EMPTY_PERSONA });

  const saveSegment = () => {
    if (!segmentForm.name.trim()) return;
    const newSegment = { ...segmentForm, id: editingSegment || `seg_${Date.now()}` };
    let newSegments;
    if (editingSegment) {
      newSegments = segments.map(s => s.id === editingSegment ? newSegment : s);
    } else {
      newSegments = [...segments, newSegment];
    }
    onUpdate({ segments: newSegments, personas });
    setShowSegmentForm(false);
    setEditingSegment(null);
    setSegmentForm({ ...EMPTY_SEGMENT });
  };

  const deleteSegment = (id) => {
    onUpdate({ segments: segments.filter(s => s.id !== id), personas });
  };

  const startEditSegment = (seg) => {
    setSegmentForm({ ...seg });
    setEditingSegment(seg.id);
    setShowSegmentForm(true);
  };

  const savePersona = () => {
    if (!personaForm.name.trim()) return;
    const newPersona = { ...personaForm, id: editingPersona || `per_${Date.now()}` };
    let newPersonas;
    if (editingPersona) {
      newPersonas = personas.map(p => p.id === editingPersona ? newPersona : p);
    } else {
      newPersonas = [...personas, newPersona];
    }
    onUpdate({ segments, personas: newPersonas });
    setShowPersonaForm(false);
    setEditingPersona(null);
    setPersonaForm({ ...EMPTY_PERSONA });
  };

  const deletePersona = (id) => {
    onUpdate({ segments, personas: personas.filter(p => p.id !== id) });
  };

  const startEditPersona = (per) => {
    setPersonaForm({ ...per });
    setEditingPersona(per.id);
    setShowPersonaForm(true);
  };

  const togglePlatform = (platform) => {
    setSegmentForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  return (
    <div className="mkt-section">
      <div className="mkt-section-block">
        <div className="mkt-section-header">
          <div className="mkt-section-header-right">
            <UsersIcon />
            <h2>الفئات المستهدفة</h2>
            <span className="mkt-badge">{segments.length}</span>
          </div>
          <button className="mkt-btn-primary" onClick={() => { setSegmentForm({ ...EMPTY_SEGMENT }); setEditingSegment(null); setShowSegmentForm(true); }}>
            <PlusIcon />
            <span>إضافة فئة</span>
          </button>
        </div>

        {showSegmentForm && (
          <div className="mkt-form-card">
            <div className="mkt-form-title">{editingSegment ? 'تعديل الفئة' : 'إضافة فئة جديدة'}</div>
            <div className="mkt-form-grid">
              <div className="mkt-form-group mkt-form-full">
                <label>اسم الفئة</label>
                <input type="text" value={segmentForm.name} onChange={e => setSegmentForm(p => ({ ...p, name: e.target.value }))} placeholder="مثال: المهتمون بالذكاء الاصطناعي" />
              </div>
              <div className="mkt-form-group mkt-form-full">
                <label>الوصف العام</label>
                <textarea value={segmentForm.description} onChange={e => setSegmentForm(p => ({ ...p, description: e.target.value }))} placeholder="وصف مختصر لهذه الفئة..." rows={2} />
              </div>
              <div className="mkt-form-group">
                <label>نطاق العمر</label>
                <div className="mkt-range-inputs">
                  <input type="number" min={10} max={80} value={segmentForm.ageRange.min} onChange={e => setSegmentForm(p => ({ ...p, ageRange: { ...p.ageRange, min: +e.target.value } }))} />
                  <span>—</span>
                  <input type="number" min={10} max={80} value={segmentForm.ageRange.max} onChange={e => setSegmentForm(p => ({ ...p, ageRange: { ...p.ageRange, max: +e.target.value } }))} />
                </div>
              </div>
              <div className="mkt-form-group">
                <label>الجنس</label>
                <select value={segmentForm.gender} onChange={e => setSegmentForm(p => ({ ...p, gender: e.target.value }))}>
                  {GENDER_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <div className="mkt-form-group">
                <label>المستوى التعليمي</label>
                <input type="text" value={segmentForm.education} onChange={e => setSegmentForm(p => ({ ...p, education: e.target.value }))} placeholder="جامعي، ثانوي..." />
              </div>
              <div className="mkt-form-group">
                <label>مستوى الدخل</label>
                <input type="text" value={segmentForm.income} onChange={e => setSegmentForm(p => ({ ...p, income: e.target.value }))} placeholder="متوسط، مرتفع..." />
              </div>
              <div className="mkt-form-group mkt-form-full">
                <label>الاهتمامات</label>
                <input type="text" value={segmentForm.interests} onChange={e => setSegmentForm(p => ({ ...p, interests: e.target.value }))} placeholder="التقنية، البرمجة، التصميم..." />
              </div>
              <div className="mkt-form-group mkt-form-full">
                <label>سلوك الشراء</label>
                <input type="text" value={segmentForm.buyingBehavior} onChange={e => setSegmentForm(p => ({ ...p, buyingBehavior: e.target.value }))} placeholder="يبحث عن الجودة، حساس للسعر..." />
              </div>
              <div className="mkt-form-group mkt-form-full">
                <label>المنصات الرقمية المفضلة</label>
                <div className="mkt-platform-chips">
                  {PLATFORM_OPTIONS.map(pl => (
                    <button key={pl} type="button" className={`mkt-chip ${segmentForm.platforms.includes(pl) ? 'active' : ''}`} onClick={() => togglePlatform(pl)}>
                      {pl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mkt-form-actions">
              <button className="mkt-btn-primary" onClick={saveSegment}><CheckIcon /> <span>حفظ</span></button>
              <button className="mkt-btn-secondary" onClick={() => { setShowSegmentForm(false); setEditingSegment(null); }}><XIcon /> <span>إلغاء</span></button>
            </div>
          </div>
        )}

        {segments.length === 0 && !showSegmentForm ? (
          <div className="mkt-empty">لم يتم إضافة أي فئة مستهدفة بعد</div>
        ) : (
          <div className="mkt-cards-grid">
            {segments.map(seg => (
              <div key={seg.id} className="mkt-segment-card">
                <div className="mkt-segment-card-header">
                  <h3>{seg.name}</h3>
                  <div className="mkt-segment-card-actions">
                    <button onClick={() => startEditSegment(seg)} title="تعديل"><EditIcon /></button>
                    <button onClick={() => deleteSegment(seg.id)} title="حذف"><TrashIcon /></button>
                  </div>
                </div>
                {seg.description && <p className="mkt-segment-desc">{seg.description}</p>}
                <div className="mkt-segment-meta">
                  <span>العمر: {seg.ageRange.min}–{seg.ageRange.max}</span>
                  <span>الجنس: {GENDER_OPTIONS.find(g => g.value === seg.gender)?.label}</span>
                  {seg.education && <span>التعليم: {seg.education}</span>}
                  {seg.income && <span>الدخل: {seg.income}</span>}
                </div>
                {seg.platforms.length > 0 && (
                  <div className="mkt-segment-platforms">
                    {seg.platforms.map(pl => <span key={pl} className="mkt-chip active">{pl}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mkt-section-block">
        <div className="mkt-section-header">
          <div className="mkt-section-header-right">
            <UserIcon />
            <h2>شخصيات المشتري (Buyer Personas)</h2>
            <span className="mkt-badge">{personas.length}</span>
          </div>
          <button className="mkt-btn-primary" onClick={() => { setPersonaForm({ ...EMPTY_PERSONA }); setEditingPersona(null); setShowPersonaForm(true); }}>
            <PlusIcon />
            <span>إنشاء شخصية</span>
          </button>
        </div>

        {showPersonaForm && (
          <div className="mkt-form-card">
            <div className="mkt-form-title">{editingPersona ? 'تعديل الشخصية' : 'إنشاء شخصية جديدة'}</div>
            <div className="mkt-form-grid">
              <div className="mkt-form-group">
                <label>الاسم الافتراضي</label>
                <input type="text" value={personaForm.name} onChange={e => setPersonaForm(p => ({ ...p, name: e.target.value }))} placeholder='مثال: "أحمد المحترف"' />
              </div>
              <div className="mkt-form-group">
                <label>العمر</label>
                <input type="number" min={15} max={80} value={personaForm.age} onChange={e => setPersonaForm(p => ({ ...p, age: +e.target.value }))} />
              </div>
              <div className="mkt-form-group mkt-form-full">
                <label>الوظيفة</label>
                <input type="text" value={personaForm.job} onChange={e => setPersonaForm(p => ({ ...p, job: e.target.value }))} placeholder="مصمم جرافيك، طالب جامعي..." />
              </div>
              <div className="mkt-form-group mkt-form-full">
                <label>التحديات اليومية</label>
                <textarea value={personaForm.challenges} onChange={e => setPersonaForm(p => ({ ...p, challenges: e.target.value }))} placeholder="ما المشاكل التي يواجهها؟" rows={2} />
              </div>
              <div className="mkt-form-group mkt-form-full">
                <label>الدوافع الشرائية</label>
                <textarea value={personaForm.motivations} onChange={e => setPersonaForm(p => ({ ...p, motivations: e.target.value }))} placeholder="ما الذي يدفعه للشراء؟" rows={2} />
              </div>
              <div className="mkt-form-group mkt-form-full">
                <label>الاقتباس التمثيلي</label>
                <input type="text" value={personaForm.quote} onChange={e => setPersonaForm(p => ({ ...p, quote: e.target.value }))} placeholder='"أحتاج أدوات تساعدني أنجز أسرع"' />
              </div>
            </div>
            <div className="mkt-form-actions">
              <button className="mkt-btn-primary" onClick={savePersona}><CheckIcon /> <span>حفظ</span></button>
              <button className="mkt-btn-secondary" onClick={() => { setShowPersonaForm(false); setEditingPersona(null); }}><XIcon /> <span>إلغاء</span></button>
            </div>
          </div>
        )}

        {personas.length === 0 && !showPersonaForm ? (
          <div className="mkt-empty">لم يتم إنشاء أي شخصية مشتري بعد</div>
        ) : (
          <div className="mkt-cards-grid">
            {personas.map(per => (
              <div key={per.id} className="mkt-persona-card">
                <div className="mkt-persona-avatar">
                  <span>{per.name.charAt(0)}</span>
                </div>
                <div className="mkt-persona-info">
                  <div className="mkt-persona-header">
                    <h3>{per.name}</h3>
                    <div className="mkt-segment-card-actions">
                      <button onClick={() => startEditPersona(per)} title="تعديل"><EditIcon /></button>
                      <button onClick={() => deletePersona(per.id)} title="حذف"><TrashIcon /></button>
                    </div>
                  </div>
                  <div className="mkt-persona-meta">
                    <span>{per.age} سنة</span>
                    {per.job && <><span className="mkt-dot">·</span><span>{per.job}</span></>}
                  </div>
                  {per.challenges && <div className="mkt-persona-field"><strong>التحديات:</strong> {per.challenges}</div>}
                  {per.motivations && <div className="mkt-persona-field"><strong>الدوافع:</strong> {per.motivations}</div>}
                  {per.quote && <blockquote className="mkt-persona-quote">"{per.quote}"</blockquote>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
