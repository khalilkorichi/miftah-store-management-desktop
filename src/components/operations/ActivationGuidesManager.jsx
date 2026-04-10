import React, { useState, useMemo } from 'react';
import { PlusIcon, SearchIcon, BookOpenIcon, SparklesIcon } from '../Icons';
import GuideCard from './GuideCard';
import GuideModal from './GuideModal';

export default function ActivationGuidesManager({ guides, setGuides, products, durations }) {
  const [showModal, setShowModal] = useState(false);
  const [editingGuide, setEditingGuide] = useState(null);
  const [search, setSearch] = useState('');
  const [filterProduct, setFilterProduct] = useState('all');

  const filtered = useMemo(() => {
    return guides.filter(g => {
      if (search) {
        const q = search.toLowerCase();
        const inTitle = (g.title || '').toLowerCase().includes(q);
        const inSteps = (g.steps || []).some(s => (s.text || '').toLowerCase().includes(q));
        const inTags = (g.customTags || '').toLowerCase().includes(q);
        if (!inTitle && !inSteps && !inTags) return false;
      }
      if (filterProduct !== 'all') {
        const tag = g.productTag == null ? '' : String(g.productTag);
        if (tag !== String(filterProduct)) return false;
      }
      return true;
    });
  }, [guides, search, filterProduct]);

  const handleSave = (guide) => {
    setGuides(prev => {
      const idx = prev.findIndex(g => g.id === guide.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = guide;
        return next;
      }
      return [guide, ...prev];
    });
  };

  const handleDelete = (id) => {
    setGuides(prev => prev.filter(g => g.id !== id));
  };

  const openEdit = (guide) => {
    setEditingGuide(guide);
    setShowModal(true);
  };

  const openNew = () => {
    setEditingGuide(null);
    setShowModal(true);
  };

  const getProductName = (productTag) => {
    if (!productTag) return null;
    const p = products.find(p => String(p.id) === String(productTag));
    return p?.name || null;
  };

  const getPlanLabel = (productTag, planTag) => {
    if (!productTag || !planTag) return null;
    const p = products.find(p => String(p.id) === String(productTag));
    if (!p) return null;
    const plan = p.plans?.find(pl => String(pl.id) === String(planTag));
    if (!plan) return null;
    if (durations && plan.durationId) {
      const dur = durations.find(d => d.id === plan.durationId);
      if (dur) return dur.label;
    }
    return plan.durationId || null;
  };

  return (
    <div className="guides-manager">
      {/* Toolbar */}
      <div className="ops-toolbar">
        <div className="ops-search-wrap">
          <SearchIcon className="icon-sm ops-search-icon" />
          <input
            type="text"
            className="ops-search-input"
            placeholder="بحث في الأدلة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="ops-filters">
          <select
            className="ops-filter-select"
            value={filterProduct}
            onChange={e => setFilterProduct(e.target.value)}
          >
            <option value="all">كل المنتجات</option>
            {products.map(p => (
              <option key={p.id} value={String(p.id)}>{p.name}</option>
            ))}
            <option value="">بدون ربط</option>
          </select>
        </div>
        <button className="ops-btn ops-btn-primary ops-add-btn" onClick={openNew}>
          <PlusIcon className="icon-sm" /> دليل جديد
        </button>
      </div>

      {/* Guides list */}
      {filtered.length === 0 ? (
        <div className="ops-empty-state">
          {guides.length === 0 ? (
            <>
              <SparklesIcon className="icon-xl" />
              <h3>لا توجد أدلة بعد</h3>
              <p>أنشئ أدلة التفعيل لمنتجاتك وتوفير الوقت عند خدمة عملائك</p>
              <button className="ops-btn ops-btn-primary" onClick={openNew}>
                <PlusIcon className="icon-sm" /> إنشاء أول دليل
              </button>
            </>
          ) : (
            <>
              <BookOpenIcon className="icon-xl" />
              <h3>لا توجد نتائج</h3>
              <p>جرّب تغيير كلمة البحث أو الفلتر</p>
            </>
          )}
        </div>
      ) : (
        <div className="guides-list">
          {filtered.map(guide => (
            <GuideCard
              key={guide.id}
              guide={guide}
              productName={getProductName(guide.productTag)}
              planLabel={getPlanLabel(guide.productTag, guide.planTag)}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showModal && (
        <GuideModal
          guide={editingGuide}
          products={products}
          durations={durations}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingGuide(null); }}
        />
      )}
    </div>
  );
}
