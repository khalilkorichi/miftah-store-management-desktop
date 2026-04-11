import React, { useState, useMemo } from 'react';
import { PlusIcon, SearchIcon, ShieldCheckIcon, AlertTriangleIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '../Icons';
import WarrantyCard, { getWarrantyStatus } from './WarrantyCard';
import WarrantyModal from './WarrantyModal';

const FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'active', label: 'نشطة' },
  { id: 'soon', label: 'تنتهي هذا الأسبوع' },
  { id: 'expired', label: 'منتهية' },
];

function matchesFilter(warranty, filterId) {
  if (filterId === 'all') return true;
  const { status } = getWarrantyStatus(warranty);
  if (filterId === 'active') return status === 'active';
  if (filterId === 'soon') return status === 'soon' || status === 'today';
  if (filterId === 'expired') return status === 'expired';
  return true;
}

export default function WarrantyManager({ warranties, setWarranties, products, suppliers, durations }) {
  const [showModal, setShowModal] = useState(false);
  const [editingWarranty, setEditingWarranty] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const getProductName = (productId) => {
    if (!productId) return null;
    const p = products.find(p => String(p.id) === String(productId));
    return p?.name || null;
  };

  const getSupplier = (supplierId) => {
    if (!supplierId) return null;
    return suppliers.find(s => String(s.id) === String(supplierId)) || null;
  };

  const filtered = useMemo(() => {
    return (warranties || []).filter(w => {
      if (search) {
        const q = search.toLowerCase();
        const customer = (w.customerName || '').toLowerCase();
        const product = (getProductName(w.productId) || '').toLowerCase();
        if (!customer.includes(q) && !product.includes(q)) return false;
      }
      return matchesFilter(w, filter);
    });
  }, [warranties, search, filter, products]);

  const stats = useMemo(() => {
    const all = warranties || [];
    const active = all.filter(w => getWarrantyStatus(w).status === 'active').length;
    const expired = all.filter(w => getWarrantyStatus(w).status === 'expired').length;
    const soon = all.filter(w => {
      const { status } = getWarrantyStatus(w);
      return status === 'soon' || status === 'today';
    }).length;
    return { total: all.length, active, expired, soon };
  }, [warranties]);

  const handleSave = (warranty) => {
    setWarranties(prev => {
      const idx = (prev || []).findIndex(w => w.id === warranty.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = warranty;
        return next;
      }
      return [warranty, ...(prev || [])];
    });
  };

  const handleDelete = (id) => {
    setWarranties(prev => (prev || []).filter(w => w.id !== id));
  };

  const openEdit = (w) => { setEditingWarranty(w); setShowModal(true); };
  const openNew = () => { setEditingWarranty(null); setShowModal(true); };

  return (
    <div className="warranty-manager">
      {(warranties || []).length > 0 && (
        <div className="warranty-stats-row">
          <div className="warranty-stat warranty-stat-total">
            <ShieldCheckIcon className="icon-xs" />
            <span className="warranty-stat-val">{stats.total}</span>
            <span className="warranty-stat-lbl">إجمالي الضمانات</span>
          </div>
          <div className="warranty-stat warranty-stat-active">
            <CheckCircleIcon className="icon-xs" />
            <span className="warranty-stat-val">{stats.active}</span>
            <span className="warranty-stat-lbl">نشطة</span>
          </div>
          <div className="warranty-stat warranty-stat-soon">
            <ClockIcon className="icon-xs" />
            <span className="warranty-stat-val">{stats.soon}</span>
            <span className="warranty-stat-lbl">تنتهي هذا الأسبوع</span>
          </div>
          <div className="warranty-stat warranty-stat-expired">
            <AlertTriangleIcon className="icon-xs" />
            <span className="warranty-stat-val">{stats.expired}</span>
            <span className="warranty-stat-lbl">منتهية</span>
          </div>
        </div>
      )}

      <div className="task-quick-filters">
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={`task-qf-btn ${filter === f.id ? 'task-qf-active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="ops-toolbar">
        <div className="ops-search-wrap">
          <SearchIcon className="icon-sm ops-search-icon" />
          <input
            type="text"
            className="ops-search-input"
            placeholder="بحث بالاسم أو المنتج..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="ops-btn ops-btn-primary ops-add-btn" onClick={openNew}>
          <PlusIcon className="icon-sm" /> ضمان جديد
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="unified-empty">
          <div className="unified-empty-icon"><ShieldCheckIcon className="icon-xl" /></div>
          {(warranties || []).length === 0 ? (
            <>
              <h4>لا توجد سجلات ضمان بعد</h4>
              <p>أضف سجلات ضمان لتتبّع ضمانات عملائك وحالتها تلقائياً</p>
              <button className="unified-empty-action" onClick={openNew}>
                <PlusIcon className="icon-sm" /> إضافة أول ضمان
              </button>
            </>
          ) : (
            <>
              <h4>لا توجد نتائج</h4>
              <p>جرّب تغيير الفلتر أو كلمة البحث</p>
            </>
          )}
        </div>
      ) : (
        <div className="warranty-list">
          {filtered.map(w => (
            <WarrantyCard
              key={w.id}
              warranty={w}
              productName={getProductName(w.productId)}
              supplier={getSupplier(w.supplierId)}
              products={products}
              durations={durations}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showModal && (
        <WarrantyModal
          warranty={editingWarranty}
          products={products}
          suppliers={suppliers}
          durations={durations}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingWarranty(null); }}
        />
      )}
    </div>
  );
}
