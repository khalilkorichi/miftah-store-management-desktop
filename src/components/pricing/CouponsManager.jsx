import React, { useState } from 'react';
import { useNotifications } from '../NotificationContext';
import { TagIcon, StarIcon, ClipboardIcon, TrashIcon, DatabaseIcon, DollarSignIcon, ScaleIcon, AlertTriangleIcon, LightbulbIcon } from '../Icons';

const fmt = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function CouponsManager({ coupons, setCoupons, products, suppliers, costs, exchangeRate, pricingData }) {
  const { addNotification } = useNotifications();
  const [code, setCode] = useState('');
  const [type, setType] = useState('percentage');
  const [value, setValue] = useState('');
  const [limit, setLimit] = useState('');
  const [target, setTarget] = useState('all');

  const [simProductId, setSimProductId] = useState('');
  const [simCouponCode, setSimCouponCode] = useState('');
  const [simSellingPrice, setSimSellingPrice] = useState(100);

  const handleAddCoupon = (e) => {
    e.preventDefault();
    if (!code.trim() || !value) return;
    const newCoupon = {
      id: `coupon_${Date.now()}`,
      code: code.toUpperCase(),
      type,
      value: parseFloat(value) || 0,
      limit: parseInt(limit) || null,
      usedCount: 0,
      target,
      active: true,
      createdAt: new Date().toISOString()
    };
    setCoupons([...coupons, newCoupon]);
    addNotification({ type: 'success', title: 'تم إضافة كوبون', description: `الكوبون "${code.toUpperCase()}"`, category: 'pricing', actionTab: 'pricing' });
    setCode(''); setValue(''); setLimit('');
  };

  const handleToggle = (id) => {
    const coupon = coupons.find(c => c.id === id);
    setCoupons(coupons.map(c => c.id === id ? { ...c, active: !c.active } : c));
    if (coupon) addNotification({ type: 'info', title: coupon.active ? 'تم تعطيل كوبون' : 'تم تفعيل كوبون', description: `"${coupon.code}"`, category: 'pricing', actionTab: 'pricing' });
  };
  const handleDelete = (id) => {
    const coupon = coupons.find(c => c.id === id);
    setCoupons(coupons.filter(c => c.id !== id));
    if (coupon) addNotification({ type: 'warning', title: 'تم حذف كوبون', description: `"${coupon.code}"`, category: 'pricing', actionTab: 'pricing' });
  };

  const simProduct = products.find(p => p.id === parseInt(simProductId));
  const simCoupon = coupons.find(c => c.code === simCouponCode);

  const getBaseCost = (prod) => {
    if (!prod || !prod.plans || prod.plans.length === 0) return 0;
    const plan = prod.plans[0];
    const savedConfig = pricingData[prod.id] || {};
    const supplierId = savedConfig.primarySupplierId || suppliers[0]?.id;
    return (plan.prices[supplierId] || 0) * exchangeRate;
  };

  let totalCost = 0;
  let finalPrice = simSellingPrice;
  let discountAmount = 0;
  let normalProfit = 0;
  let discountedProfit = 0;
  let breakEvenSales = 0;

  if (simProduct) {
    const baseCost = getBaseCost(simProduct);
    let fixedCosts = 0;
    let percentCostsTotal = 0;
    costs.filter(c => c.active).forEach(c => {
      if (c.type === 'fixed') fixedCosts += c.value;
      else if (c.type === 'percentage') percentCostsTotal += c.value / 100;
    });
    totalCost = baseCost + fixedCosts + (simSellingPrice * percentCostsTotal);
    normalProfit = simSellingPrice - totalCost;
    if (simCoupon) {
      if (simCoupon.type === 'percentage') {
        discountAmount = simSellingPrice * (simCoupon.value / 100);
      } else {
        discountAmount = simCoupon.value;
      }
      finalPrice = Math.max(0, simSellingPrice - discountAmount);
      const discountedTotalCost = baseCost + fixedCosts + (finalPrice * percentCostsTotal);
      discountedProfit = finalPrice - discountedTotalCost;
      if (discountedProfit > 0 && normalProfit > 0) {
        breakEvenSales = normalProfit / discountedProfit;
      }
    }
  }

  const activeCoupons = coupons.filter(c => c.active);

  return (
    <div className="cpn-container">
      <div className="cpn-grid">
        {/* Create Coupon Card */}
        <div className="cpn-create-card">
          <div className="cpn-card-header">
            <span className="cpn-card-icon flex-row align-center justify-center"><TagIcon className="icon-lg" /></span>
            <div>
              <h3>إنشاء كوبون جديد</h3>
              <p>أنشئ كوبونات خصم واختبر تأثيرها على أرباحك</p>
            </div>
          </div>
          <form className="cpn-form" onSubmit={handleAddCoupon}>
            <div className="cpn-field">
              <label>كود الكوبون</label>
              <input type="text" value={code} onChange={e=>setCode(e.target.value)} placeholder="مثال: SAVE20" required />
            </div>
            <div className="cpn-form-row">
              <div className="cpn-field">
                <label>نوع الخصم</label>
                <select value={type} onChange={e=>setType(e.target.value)}>
                  <option value="percentage">نسبة مئوية (%)</option>
                  <option value="fixed">قيمة ثابتة (ر.س)</option>
                </select>
              </div>
              <div className="cpn-field">
                <label>مقدار الخصم</label>
                <input type="number" step="0.01" value={value} onChange={e=>setValue(e.target.value)} required />
              </div>
            </div>
            <div className="cpn-form-row">
              <div className="cpn-field">
                <label>الحد الأقصى للاستخدام</label>
                <input type="number" placeholder="بدون حد" value={limit} onChange={e=>setLimit(e.target.value)} />
              </div>
              <div className="cpn-field">
                <label>يشمل</label>
                <select value={target} onChange={e=>setTarget(e.target.value)}>
                  <option value="all">جميع المنتجات</option>
                </select>
              </div>
            </div>
            <button type="submit" className="cpn-submit-btn flex-row align-center gap-2">
              <StarIcon className="icon-sm" />
              إنشاء وحفظ الكوبون
            </button>
          </form>
        </div>

        {/* Coupons List */}
        <div className="cpn-list-card">
          <div className="cpn-card-header">
            <span className="cpn-card-icon flex-row align-center justify-center"><ClipboardIcon className="icon-lg" /></span>
            <div>
              <h3>الكوبونات الفعالة</h3>
              <p>{activeCoupons.length} كوبون نشط من {coupons.length}</p>
            </div>
          </div>
          {coupons.length === 0 ? (
            <div className="cpn-empty">
              <span className="flex-row align-center justify-center"><TagIcon className="icon-xl" /></span>
              <p>لا يوجد كوبونات مسجلة</p>
            </div>
          ) : (
            <div className="cpn-table-wrap">
              <table className="cpn-table">
                <thead>
                  <tr>
                    <th>الكود</th>
                    <th>الخصم</th>
                    <th>الحالة</th>
                    <th>حذف</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(c => (
                    <tr key={c.id} className={!c.active ? 'cpn-row-inactive' : ''}>
                      <td>
                        <span className="cpn-code-badge">{c.code}</span>
                      </td>
                      <td className="cpn-td-discount">
                        <span className="cpn-discount-value">
                          {c.value}{c.type === 'percentage' ? '%' : ' ر.س'}
                        </span>
                        <span className="cpn-discount-type">
                          {c.type === 'percentage' ? 'نسبة' : 'ثابت'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className={`cm-toggle ${c.active ? 'cm-toggle-on' : 'cm-toggle-off'}`}
                          onClick={() => handleToggle(c.id)}
                        >
                          <span className="cm-toggle-track">
                            <span className="cm-toggle-thumb" />
                          </span>
                          <span className="cm-toggle-label">{c.active ? 'نشط' : 'معطل'}</span>
                        </button>
                      </td>
                      <td>
                        <button className="cm-delete-btn flex-row align-center justify-center" onClick={()=>handleDelete(c.id)}><TrashIcon className="icon-sm" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Simulator */}
        <div className="cpn-simulator-card">
          <div className="cpn-card-header">
            <span className="cpn-card-icon flex-row align-center justify-center"><DatabaseIcon className="icon-lg" /></span>
            <div>
              <h3>محاكي الكوبونات ونقطة التعادل</h3>
              <p>Break-Even Analysis</p>
            </div>
          </div>
          
          <div className="cpn-sim-selectors">
            <div className="cpn-field">
              <label>المنتج المراد الاختبار عليه</label>
              <select value={simProductId} onChange={e=>setSimProductId(e.target.value)}>
                <option value="">اختر المنتج...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="cpn-field">
              <label>الكوبون المعطى</label>
              <select value={simCouponCode} onChange={e=>setSimCouponCode(e.target.value)}>
                <option value="">اختر الكوبون (اختياري)</option>
                {coupons.filter(c => c.active).map(c => <option key={c.id} value={c.code}>{c.code}</option>)}
              </select>
            </div>
            <div className="cpn-field">
              <label>سعر البيع الافتراضي (ر.س)</label>
              <input type="number" value={simSellingPrice} onChange={e=>setSimSellingPrice(parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          {simProduct ? (
            <div className="cpn-sim-results">
              <div className="cpn-sim-panel cpn-sim-normal">
                <div className="cpn-sim-panel-header">
                  <span className="flex-row align-center justify-center"><DollarSignIcon className="icon-sm" /></span>
                  <h4>بدون كوبون</h4>
                </div>
                <div className="cpn-sim-rows">
                  <div className="cpn-sim-row">
                    <span>سعر البيع</span>
                    <strong>{fmt(simSellingPrice)} ر.س</strong>
                  </div>
                  <div className="cpn-sim-row">
                    <span>التكاليف</span>
                    <strong>{fmt(totalCost)} ر.س</strong>
                  </div>
                  <div className="cpn-sim-row cpn-sim-highlight">
                    <span>الربح الصافي</span>
                    <strong className={normalProfit > 0 ? 'text-success' : 'text-danger'}>{fmt(normalProfit)} ر.س</strong>
                  </div>
                </div>
              </div>

              {simCoupon && (
                <div className="cpn-sim-panel cpn-sim-coupon">
                  <div className="cpn-sim-panel-header">
                    <span className="flex-row align-center justify-center"><TagIcon className="icon-sm" /></span>
                    <h4>مع الكوبون ({simCoupon.code})</h4>
                  </div>
                  <div className="cpn-sim-rows">
                    <div className="cpn-sim-row">
                      <span>مقدار الخصم</span>
                      <strong>{fmt(discountAmount)} ر.س</strong>
                    </div>
                    <div className="cpn-sim-row">
                      <span>سعر البيع الجديد</span>
                      <strong>{fmt(finalPrice)} ر.س</strong>
                    </div>
                    <div className="cpn-sim-row cpn-sim-highlight">
                      <span>الربح بالمقدار</span>
                      <strong className={discountedProfit > 0 ? 'text-success' : 'text-danger'}>{fmt(discountedProfit)} ر.س</strong>
                    </div>
                  </div>
                </div>
              )}

              {simCoupon && (
                <div className="cpn-sim-panel cpn-sim-breakeven">
                  <div className="cpn-sim-panel-header">
                    <span className="flex-row align-center justify-center"><ScaleIcon className="icon-sm" /></span>
                    <h4>نقطة التعادل</h4>
                  </div>
                  {discountedProfit <= 0 ? (
                    <div className="cpn-sim-warning">
                      <span className="flex-row align-center justify-center"><AlertTriangleIcon className="icon-sm" /></span>
                      <p><strong>تحذير:</strong> هذا الكوبون يؤدي إلى البيع بالخسارة! لا يوجد نقطة تعادل.</p>
                    </div>
                  ) : (
                    <div className="cpn-sim-breakeven-info">
                      <p>
                        لتعويض فارق الخصم وتحقيق نفس إجمالي الأرباح، تحتاج إلى بيع 
                        <strong> {Math.ceil(breakEvenSales)} </strong>
                        قطعة بسعر الخصم مقابل كل قطعة تبيعها بالسعر الطبيعي.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="cpn-sim-empty">
              <span className="flex-row align-center justify-center"><LightbulbIcon className="icon-xl" /></span>
              <p>اختر منتجاً لتفعيل المحاكاة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CouponsManager;
