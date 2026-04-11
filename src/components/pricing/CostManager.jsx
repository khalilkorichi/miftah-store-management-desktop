import React, { useState } from 'react';
import { useNotifications } from '../NotificationContext';
import { BarChartIcon, PinIcon, TrendingUpIcon, PlusIcon, SaveIcon, ClipboardIcon, LightbulbIcon, TrashIcon, LockIcon } from '../Icons';

const fmt = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function CostManager({ costs, setCosts }) {
  const { addNotification } = useNotifications();
  const [newCostName, setNewCostName] = useState('');
  const [newCostType, setNewCostType] = useState('percentage');
  const [newCostValue, setNewCostValue] = useState('');

  const handleAddCost = (e) => {
    e.preventDefault();
    if (!newCostName.trim() || !newCostValue) return;
    
    const newCost = {
      id: `cost_${Date.now()}`,
      name: newCostName,
      type: newCostType,
      value: parseFloat(newCostValue) || 0,
      applyTo: 'all',
      active: true,
      custom: true,
    };

    setCosts([...costs, newCost]);
    addNotification({ type: 'success', title: 'تم إضافة تكلفة تشغيلية', description: `"${newCostName}"`, category: 'pricing', actionTab: 'pricing' });
    setNewCostName('');
    setNewCostValue('');
  };

  const handleToggleActive = (id) => {
    const cost = costs.find(c => c.id === id);
    setCosts(costs.map(c => c.id === id ? { ...c, active: !c.active } : c));
    if (cost) addNotification({ type: 'info', title: cost.active ? 'تم تعطيل تكلفة' : 'تم تفعيل تكلفة', description: `"${cost.name}"`, category: 'pricing', actionTab: 'pricing' });
  };

  const handleDeleteCost = (id) => {
    const cost = costs.find(c => c.id === id);
    setCosts(costs.filter(c => c.id !== id));
    if (cost) addNotification({ type: 'warning', title: 'تم حذف تكلفة', description: `"${cost.name}"`, category: 'pricing', actionTab: 'pricing' });
  };

  const activeCosts = costs.filter(c => c.active);
  const totalFixed = activeCosts.filter(c => c.type === 'fixed').reduce((s, c) => s + c.value, 0);
  const totalPercent = activeCosts.filter(c => c.type === 'percentage').reduce((s, c) => s + c.value, 0);

  return (
    <div className="cm-container">
      {/* Summary Cards */}
      <div className="cm-summary-grid">
        <div className="cm-summary-card cm-summary-total">
          <div className="cm-summary-icon flex-row align-center justify-center"><BarChartIcon className="icon-lg" /></div>
          <div className="cm-summary-data">
            <span className="cm-summary-value">{costs.length}</span>
            <span className="cm-summary-label">إجمالي التكاليف</span>
          </div>
        </div>
        <div className="cm-summary-card cm-summary-fixed">
          <div className="cm-summary-icon flex-row align-center justify-center"><PinIcon className="icon-lg" /></div>
          <div className="cm-summary-data">
            <span className="cm-summary-value">{fmt(totalFixed)} <small>ر.س</small></span>
            <span className="cm-summary-label">تكاليف ثابتة</span>
          </div>
        </div>
        <div className="cm-summary-card cm-summary-percent">
          <div className="cm-summary-icon flex-row align-center justify-center"><TrendingUpIcon className="icon-lg" /></div>
          <div className="cm-summary-data">
            <span className="cm-summary-value">{fmtPct(totalPercent)}%</span>
            <span className="cm-summary-label">تكاليف نسبية</span>
          </div>
        </div>
      </div>

      {/* Add Cost Form */}
      <div className="cm-add-card">
        <div className="cm-add-header">
          <span className="cm-add-icon flex-row align-center justify-center"><PlusIcon className="icon-sm" /></span>
          <div>
            <h3>إضافة تكلفة جديدة</h3>
            <p>أضف التزاماتك المالية الثابتة والمتغيرة لحساب هامش الربح بدقة</p>
          </div>
        </div>
        <form className="cm-add-form" onSubmit={handleAddCost}>
          <div className="cm-form-row">
            <div className="cm-field">
              <label>اسم التكلفة</label>
              <input 
                type="text" 
                placeholder="مثال: رسوم بوابات الدفع"
                value={newCostName}
                onChange={(e) => setNewCostName(e.target.value)}
                required
              />
            </div>
            <div className="cm-field">
              <label>نوع التكلفة</label>
              <select value={newCostType} onChange={(e) => setNewCostType(e.target.value)}>
                <option value="percentage">نسبة مئوية (%)</option>
                <option value="fixed">قيمة ثابتة (ر.س)</option>
              </select>
            </div>
            <div className="cm-field">
              <label>القيمة</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                placeholder="مثال: 5"
                value={newCostValue}
                onChange={(e) => setNewCostValue(e.target.value)}
                required
              />
            </div>
            <div className="cm-field cm-field-action">
              <button type="submit" className="cm-submit-btn flex-row align-center gap-2">
                <SaveIcon className="icon-sm" />
                حفظ التكلفة
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Costs Table */}
      <div className="cm-table-card">
        <div className="cm-table-header">
          <h3 className="flex-row align-center gap-2">
            <span className="flex-row align-center justify-center"><ClipboardIcon className="icon-sm" /></span>
            قائمة التكاليف المسجلة
          </h3>
          <span className="cm-active-badge">{activeCosts.length} مفعّل من {costs.length}</span>
        </div>
        {costs.length === 0 ? (
          <div className="cm-empty">
            <span className="cm-empty-icon flex-row align-center justify-center"><LightbulbIcon className="icon-xl" /></span>
            <p>لا توجد تكاليف مضافة حالياً</p>
            <span>ابدأ بإضافة التكاليف الأساسية كرسوم المنصة وبوابات الدفع</span>
          </div>
        ) : (
          <div className="cm-table-wrap">
            <table className="cm-table">
              <thead>
                <tr>
                  <th className="cm-th-name">اسم التكلفة</th>
                  <th>النوع</th>
                  <th>القيمة</th>
                  <th>الحالة</th>
                  <th className="cm-th-actions">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {costs.map(cost => (
                  <tr key={cost.id} className={`cm-row ${!cost.active ? 'cm-row-inactive' : ''}`}>
                    <td className="cm-td-name">
                      <span className="cm-cost-name">{cost.name}</span>
                      {!cost.custom && <span className="cm-system-badge">أساسية</span>}
                    </td>
                    <td>
                      <span className={`cm-type-badge ${cost.type === 'percentage' ? 'cm-type-percent' : 'cm-type-fixed'} flex-row align-center gap-1`}>
                        {cost.type === 'percentage' ? <><BarChartIcon className="icon-xs" /> نسبة مئوية</> : <><PinIcon className="icon-xs" /> قيمة ثابتة</>}
                      </span>
                    </td>
                    <td className="cm-td-value">
                      <span className="cm-value-display">
                        {cost.value}{cost.type === 'percentage' ? '%' : ' ر.س'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className={`cm-toggle ${cost.active ? 'cm-toggle-on' : 'cm-toggle-off'}`}
                        onClick={() => handleToggleActive(cost.id)}
                      >
                        <span className="cm-toggle-track">
                          <span className="cm-toggle-thumb" />
                        </span>
                        <span className="cm-toggle-label">{cost.active ? 'مفعّل' : 'معطّل'}</span>
                      </button>
                    </td>
                    <td>
                      {cost.custom ? (
                        <button 
                          className="cm-delete-btn flex-row align-center justify-center" 
                          onClick={() => handleDeleteCost(cost.id)}
                          title="حذف"
                        >
                          <TrashIcon className="icon-sm" />
                        </button>
                      ) : (
                        <span className="cm-locked flex-row align-center justify-center"><LockIcon className="icon-sm" /></span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default CostManager;
