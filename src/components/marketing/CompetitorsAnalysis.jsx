import { useState, useMemo } from 'react';
import { PlusIcon, EditIcon, TrashIcon, XIcon, CheckIcon, SearchIcon, ExternalLinkIcon, SwordsIcon } from '../Icons';

const EMPTY_COMPETITOR = {
  name: '',
  url: '',
  type: 'direct',
  strategies: '',
  channels: [],
  contentType: '',
  strengths: '',
  weaknesses: '',
};

const CHANNEL_OPTIONS = [
  'تويتر/X', 'إنستغرام', 'تيك توك', 'سناب شات', 'يوتيوب', 'فيسبوك', 'موقع إلكتروني', 'بريد إلكتروني', 'تلغرام',
];

export default function CompetitorsAnalysis({ marketingCompetitors, products, onUpdate }) {
  const [activeType, setActiveType] = useState('direct');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_COMPETITOR });
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [channelFilter, setChannelFilter] = useState('');

  const productCompetitors = useMemo(() => {
    const map = {};
    products.forEach(prod => {
      (prod.competitors || []).forEach(comp => {
        if (!map[comp.name]) {
          map[comp.name] = { name: comp.name, url: comp.url || '', products: [] };
        }
        map[comp.name].products.push({
          productName: prod.name,
          price: comp.price,
        });
      });
    });
    return Object.values(map);
  }, [products]);

  const currentList = marketingCompetitors[activeType] || [];

  const filtered = currentList.filter(c => {
    if (search && !c.name.includes(search) && !(c.strategies || '').includes(search)) return false;
    if (channelFilter && !(c.channels || []).includes(channelFilter)) return false;
    return true;
  });

  const save = () => {
    if (!form.name.trim()) return;
    const item = { ...form, id: editingId || `comp_${Date.now()}`, type: activeType };
    const key = activeType;
    let newList;
    if (editingId) {
      newList = currentList.map(c => c.id === editingId ? item : c);
    } else {
      newList = [...currentList, item];
    }
    onUpdate({ ...marketingCompetitors, [key]: newList });
    setShowForm(false);
    setEditingId(null);
    setForm({ ...EMPTY_COMPETITOR });
  };

  const remove = (id) => {
    onUpdate({ ...marketingCompetitors, [activeType]: currentList.filter(c => c.id !== id) });
  };

  const startEdit = (comp) => {
    setForm({ ...comp });
    setEditingId(comp.id);
    setShowForm(true);
  };

  const toggleChannel = (ch) => {
    setForm(prev => ({
      ...prev,
      channels: prev.channels.includes(ch) ? prev.channels.filter(c => c !== ch) : [...prev.channels, ch],
    }));
  };

  const importFromProducts = (pc) => {
    const exists = currentList.some(c => c.name === pc.name);
    if (exists) return;
    const item = { ...EMPTY_COMPETITOR, id: `comp_${Date.now()}`, name: pc.name, url: pc.url, type: activeType };
    onUpdate({ ...marketingCompetitors, [activeType]: [...currentList, item] });
  };

  return (
    <div className="mkt-section">
      <div className="mkt-section-block">
        <div className="mkt-section-header">
          <div className="mkt-section-header-right">
            <SwordsIcon />
            <h2>تحليل المنافسين</h2>
            <span className="mkt-badge">{currentList.length}</span>
          </div>
          <button className="mkt-btn-primary" onClick={() => { setForm({ ...EMPTY_COMPETITOR, type: activeType }); setEditingId(null); setShowForm(true); }}>
            <PlusIcon />
            <span>إضافة منافس</span>
          </button>
        </div>

        <div className="mkt-comp-tabs">
          <button className={`mkt-comp-tab ${activeType === 'direct' ? 'active' : ''}`} onClick={() => setActiveType('direct')}>
            المنافسون المباشرون ({marketingCompetitors.direct.length})
          </button>
          <button className={`mkt-comp-tab ${activeType === 'indirect' ? 'active' : ''}`} onClick={() => setActiveType('indirect')}>
            المنافسون غير المباشرون ({marketingCompetitors.indirect.length})
          </button>
        </div>

        {productCompetitors.length > 0 && (
          <div className="mkt-import-strip">
            <span className="mkt-import-label">استيراد من المنتجات:</span>
            <div className="mkt-import-chips">
              {productCompetitors.map(pc => {
                const exists = currentList.some(c => c.name === pc.name);
                return (
                  <button key={pc.name} className={`mkt-chip ${exists ? 'disabled' : ''}`} disabled={exists} onClick={() => importFromProducts(pc)}>
                    {pc.name} {exists ? '✓' : '+'}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mkt-comp-filters">
          <div className="mkt-search-bar">
            <SearchIcon />
            <input type="text" placeholder="بحث في المنافسين..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="mkt-channel-filter">
            <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)}>
              <option value="">كل القنوات</option>
              {CHANNEL_OPTIONS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
            </select>
          </div>
        </div>

        {showForm && (
          <div className="mkt-form-card">
            <div className="mkt-form-title">{editingId ? 'تعديل المنافس' : 'إضافة منافس جديد'}</div>
            <div className="mkt-form-grid">
              <div className="mkt-form-group">
                <label>اسم المنافس</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="اسم المتجر أو الشركة" />
              </div>
              <div className="mkt-form-group">
                <label>الرابط</label>
                <input type="url" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://..." dir="ltr" />
              </div>
              <div className="mkt-form-group mkt-form-full">
                <label>استراتيجيات التسويق</label>
                <textarea value={form.strategies} onChange={e => setForm(p => ({ ...p, strategies: e.target.value }))} placeholder="ما الاستراتيجيات المستخدمة؟" rows={2} />
              </div>
              <div className="mkt-form-group mkt-form-full">
                <label>نوع المحتوى</label>
                <input type="text" value={form.contentType} onChange={e => setForm(p => ({ ...p, contentType: e.target.value }))} placeholder="كاروسيل، ريلز، مقالات..." />
              </div>
              <div className="mkt-form-group mkt-form-full">
                <label>القنوات الرقمية</label>
                <div className="mkt-platform-chips">
                  {CHANNEL_OPTIONS.map(ch => (
                    <button key={ch} type="button" className={`mkt-chip ${form.channels.includes(ch) ? 'active' : ''}`} onClick={() => toggleChannel(ch)}>
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mkt-form-group">
                <label>نقاط القوة</label>
                <textarea value={form.strengths} onChange={e => setForm(p => ({ ...p, strengths: e.target.value }))} placeholder="ما الذي يتميز به؟" rows={2} />
              </div>
              <div className="mkt-form-group">
                <label>نقاط الضعف</label>
                <textarea value={form.weaknesses} onChange={e => setForm(p => ({ ...p, weaknesses: e.target.value }))} placeholder="ما الذي ينقصه؟" rows={2} />
              </div>
            </div>
            <div className="mkt-form-actions">
              <button className="mkt-btn-primary" onClick={save}><CheckIcon /> <span>حفظ</span></button>
              <button className="mkt-btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}><XIcon /> <span>إلغاء</span></button>
            </div>
          </div>
        )}

        {filtered.length === 0 && !showForm ? (
          <div className="mkt-empty">لا يوجد منافسون {activeType === 'direct' ? 'مباشرون' : 'غير مباشرون'} مُضافون</div>
        ) : (
          <div className="mkt-cards-grid">
            {filtered.map(comp => {
              const prodData = productCompetitors.find(pc => pc.name === comp.name);
              const isExpanded = expandedId === comp.id;
              return (
                <div key={comp.id} className="mkt-comp-card">
                  <div className="mkt-comp-card-header">
                    <div className="mkt-comp-card-name">
                      <h3>{comp.name}</h3>
                      {comp.url && (
                        <a href={comp.url} target="_blank" rel="noopener noreferrer" className="mkt-comp-link"><ExternalLinkIcon /></a>
                      )}
                    </div>
                    <div className="mkt-segment-card-actions">
                      <button onClick={() => startEdit(comp)} title="تعديل"><EditIcon /></button>
                      <button onClick={() => remove(comp.id)} title="حذف"><TrashIcon /></button>
                    </div>
                  </div>

                  {comp.strategies && <div className="mkt-comp-field"><strong>الاستراتيجيات:</strong> {comp.strategies}</div>}
                  {comp.contentType && <div className="mkt-comp-field"><strong>نوع المحتوى:</strong> {comp.contentType}</div>}

                  {comp.channels.length > 0 && (
                    <div className="mkt-segment-platforms">
                      {comp.channels.map(ch => <span key={ch} className="mkt-chip active">{ch}</span>)}
                    </div>
                  )}

                  {(comp.strengths || comp.weaknesses) && (
                    <div className="mkt-comp-sw">
                      {comp.strengths && <div className="mkt-comp-sw-item mkt-comp-sw-s"><strong>القوة:</strong> {comp.strengths}</div>}
                      {comp.weaknesses && <div className="mkt-comp-sw-item mkt-comp-sw-w"><strong>الضعف:</strong> {comp.weaknesses}</div>}
                    </div>
                  )}

                  {prodData && prodData.products.length > 0 && (
                    <div className="mkt-comp-prices">
                      <button className="mkt-comp-prices-toggle" onClick={() => setExpandedId(isExpanded ? null : comp.id)}>
                        أسعار المنتجات ({prodData.products.length}) {isExpanded ? '▲' : '▼'}
                      </button>
                      {isExpanded && (
                        <div className="mkt-comp-prices-table">
                          {prodData.products.map((pp, i) => (
                            <div key={i} className="mkt-comp-price-row">
                              <span>{pp.productName}</span>
                              <span>{pp.price != null ? `${pp.price}` : '—'}</span>
                            </div>
                          ))}
                        </div>
                      )}
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
