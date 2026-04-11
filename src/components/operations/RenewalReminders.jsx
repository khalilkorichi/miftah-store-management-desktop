import React, { useState, useMemo } from 'react';
import { PlusIcon, SearchIcon, CalendarIcon, AlertTriangleIcon, ClockIcon, CheckCircleIcon } from '../Icons';
import RenewalCard, { getRenewalDaysInfo } from './RenewalCard';
import RenewalModal from './RenewalModal';

const FILTERS = [
  { id: 'all', label: 'الكل', Icon: CalendarIcon },
  { id: 'overdue', label: 'متأخرة', Icon: AlertTriangleIcon },
  { id: 'week', label: 'هذا الأسبوع', Icon: ClockIcon },
  { id: 'month', label: 'هذا الشهر', Icon: CalendarIcon },
  { id: 'future', label: 'مستقبلية', Icon: CheckCircleIcon },
];

function matchesFilter(renewal, filterId) {
  if (filterId === 'all') return true;
  const info = getRenewalDaysInfo(renewal.renewalDate);
  if (!info) return filterId === 'future';
  if (filterId === 'overdue') return info.isOverdue;
  if (filterId === 'week') return info.isThisWeek || info.isToday;
  if (filterId === 'month') return info.isThisMonth || info.isToday;
  if (filterId === 'future') return !info.isOverdue && info.diffDays > 30;
  return true;
}

function sortRenewals(list) {
  return [...list].sort((a, b) => {
    if (!a.renewalDate && !b.renewalDate) return 0;
    if (!a.renewalDate) return 1;
    if (!b.renewalDate) return -1;
    return a.renewalDate.localeCompare(b.renewalDate);
  });
}

export default function RenewalReminders({
  renewals, setRenewals, products, suppliers, exchangeRate,
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingRenewal, setEditingRenewal] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const getProductName = (productId) => {
    if (!productId) return null;
    const p = products.find(p => String(p.id) === String(productId));
    return p?.name || null;
  };

  const getSupplierName = (supplierId) => {
    if (!supplierId) return null;
    const s = suppliers.find(s => String(s.id) === String(supplierId));
    return s?.name || null;
  };

  const active = useMemo(() => (renewals || []).filter(r => !r.archived), [renewals]);

  const filtered = useMemo(() => {
    return sortRenewals(active.filter(r => {
      if (search) {
        const q = search.toLowerCase();
        const name = (getProductName(r.productId) || '').toLowerCase();
        const sup = (getSupplierName(r.supplierId) || '').toLowerCase();
        const notes = (r.notes || '').toLowerCase();
        if (!name.includes(q) && !sup.includes(q) && !notes.includes(q)) return false;
      }
      if (!matchesFilter(r, filter)) return false;
      return true;
    }));
  }, [active, search, filter]);

  const stats = useMemo(() => {
    const overdue = active.filter(r => getRenewalDaysInfo(r.renewalDate)?.isOverdue).length;
    const week = active.filter(r => {
      const i = getRenewalDaysInfo(r.renewalDate);
      return i && (i.isThisWeek || i.isToday);
    }).length;
    const month = active.filter(r => {
      const i = getRenewalDaysInfo(r.renewalDate);
      return i && i.isThisMonth;
    }).length;
    const totalCostUsd = active.reduce((sum, r) => sum + (r.costUsd || 0), 0);
    return { overdue, week, month, totalCostUsd };
  }, [active]);

  const handleSave = (renewal) => {
    setRenewals(prev => {
      const idx = (prev || []).findIndex(r => r.id === renewal.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = renewal;
        return next;
      }
      return [renewal, ...(prev || [])];
    });
  };

  const handleDelete = (id) => {
    setRenewals(prev => (prev || []).filter(r => r.id !== id));
  };

  const handleRenewed = (id, nextDate) => {
    setRenewals(prev => (prev || []).map(r =>
      r.id === id ? { ...r, renewalDate: nextDate, updatedAt: new Date().toISOString() } : r
    ));
  };

  const openEdit = (r) => { setEditingRenewal(r); setShowModal(true); };
  const openNew = () => { setEditingRenewal(null); setShowModal(true); };

  return (
    <div className="renewal-manager">
      {/* Mini stats */}
      {active.length > 0 && (
        <div className="renewal-stats-row">
          <div className={`renewal-stat ${stats.overdue > 0 ? 'renewal-stat-danger' : 'renewal-stat-ok'}`}>
            <AlertTriangleIcon className="icon-xs" />
            <span className="renewal-stat-val">{stats.overdue}</span>
            <span className="renewal-stat-lbl">متأخرة</span>
          </div>
          <div className="renewal-stat renewal-stat-warn">
            <ClockIcon className="icon-xs" />
            <span className="renewal-stat-val">{stats.week}</span>
            <span className="renewal-stat-lbl">هذا الأسبوع</span>
          </div>
          <div className="renewal-stat renewal-stat-info">
            <CalendarIcon className="icon-xs" />
            <span className="renewal-stat-val">{stats.month}</span>
            <span className="renewal-stat-lbl">هذا الشهر</span>
          </div>
          <div className="renewal-stat renewal-stat-total">
            <span className="renewal-stat-val">{stats.totalCostUsd.toFixed(0)}</span>
            <span className="renewal-stat-lbl">إجمالي الكلفة (USD)</span>
          </div>
        </div>
      )}

      {/* Filter pills */}
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

      {/* Toolbar */}
      <div className="ops-toolbar">
        <div className="ops-search-wrap">
          <SearchIcon className="icon-sm ops-search-icon" />
          <input
            type="text"
            className="ops-search-input"
            placeholder="بحث في التذكيرات..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="ops-btn ops-btn-primary ops-add-btn" onClick={openNew}>
          <PlusIcon className="icon-sm" /> تذكير جديد
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="unified-empty">
          <div className="unified-empty-icon"><CalendarIcon className="icon-xl" /></div>
          {active.length === 0 ? (
            <>
              <h4>لا توجد تذكيرات تجديد بعد</h4>
              <p>أضف تذكيرات لتجديد اشتراكاتك مع الموردين وتتبّع مواعيدها تلقائياً</p>
              <button className="unified-empty-action" onClick={openNew}>
                <PlusIcon className="icon-sm" /> إضافة أول تذكير
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
        <div className="renewal-list">
          {filtered.map(r => (
            <RenewalCard
              key={r.id}
              renewal={r}
              productName={getProductName(r.productId)}
              supplierName={getSupplierName(r.supplierId)}
              exchangeRate={exchangeRate}
              onEdit={openEdit}
              onDelete={handleDelete}
              onRenewed={handleRenewed}
            />
          ))}
        </div>
      )}

      {showModal && (
        <RenewalModal
          renewal={editingRenewal}
          products={products}
          suppliers={suppliers}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingRenewal(null); }}
        />
      )}
    </div>
  );
}
