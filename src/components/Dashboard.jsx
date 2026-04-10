import React, { useState, useMemo, useEffect } from 'react';
import {
  PackageIcon, UsersIcon, GiftIcon, DollarSignIcon, BarChartIcon,
  TrendingUpIcon, TrendingDownIcon, AlertTriangleIcon, CheckCircleIcon,
  PlusIcon, TagIcon, StarIcon, ActivityIcon, PercentIcon,
  SettingsIcon, LayersIcon, ArrowLeftIcon, ZapIcon, AwardIcon,
  ExternalLinkIcon, GlobeIcon, CalendarIcon, CheckSquareIcon, BookOpenIcon, ClockIcon
} from './Icons';

const MOTIVATIONAL_QUOTES = [
  { text: 'بارك الله لك في سعيك ورزقك', emoji: '✨' },
  { text: 'الرزق بيد الله، والسعي واجبك', emoji: '💪' },
  { text: 'كل يوم بداية جديدة لبناء تجارة أفضل', emoji: '🌟' },
  { text: 'النجاح ثمرة الصبر والمثابرة', emoji: '🏆' },
  { text: 'اجعل كل صفقة خطوة نحو أحلامك', emoji: '🎯' },
  { text: 'من جدّ وجد، ومن زرع حصد', emoji: '🌱' },
  { text: 'التاجر الناجح يبني ثقة زبائنه قبل أرباحه', emoji: '💎' },
  { text: 'استثمر في جودة منتجاتك وستجني ثمار ذلك', emoji: '📈' },
  { text: 'كل عميل راضٍ هو إعلان مجاني لمتجرك', emoji: '🌈' },
  { text: 'التفوق في خدمة العملاء هو ميزتك التنافسية الأولى', emoji: '🤝' },
  { text: 'ابدأ صغيراً، فكّر بشكل كبير، تحرّك بسرعة', emoji: '🚀' },
  { text: 'ما أُعطي أحد خيراً من عمل يأكل منه', emoji: '☀️' },
];

const fmt = (val) => {
  if (val === null || val === undefined) return '0';
  return Number(val).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const fmtPct = (val) => {
  return Number(val).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

function Dashboard({
  products, suppliers, durations, exchangeRate, bundles,
  costs, pricingData, coupons, activationMethods,
  onNavigate, appSettings, tasks, activationGuides
}) {
  const todayQuote = useMemo(() => {
    const idx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    return MOTIVATIONAL_QUOTES[idx];
  }, []);

  const { arabicDate, greeting } = useMemo(() => {
    const now = new Date();
    const date = now.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const h = now.getHours();
    const greet = h < 12 ? 'صباح الخير' : h < 17 ? 'مساء النور' : 'مساء الخير';
    return { arabicDate: date, greeting: greet };
  }, []);

  // Live clock — ticks every second
  const [clockNow, setClockNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setClockNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const enabledTimezones = useMemo(() => {
    const defaults = [
      { id: 'dz', label: 'الجزائر', tz: 'Africa/Algiers', flag: '🇩🇿' },
      { id: 'sa', label: 'السعودية', tz: 'Asia/Riyadh', flag: '🇸🇦' },
    ];
    const tzSettings = appSettings?.timezones;
    if (!tzSettings || !Array.isArray(tzSettings)) return defaults;
    return tzSettings.filter(z => z.enabled !== false);
  }, [appSettings?.timezones]);

  const formatClock = (tz) => {
    try {
      return clockNow.toLocaleTimeString('en-US', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return '--:--:--';
    }
  };
  const tasksList = tasks || [];
  const guidesList = activationGuides || [];

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayTasks = tasksList.filter(t => {
    if (t.status === 'done') return false;
    if (!t.dueDate) return false;
    return t.dueDate === todayStr;
  }).length;

  const urgentTasks = tasksList.filter(t => t.priority === 'urgent' && t.status !== 'done').length;
  const totalGuides = guidesList.length;
  const linkedProductIds = [...new Set(guidesList.filter(g => g.productTag).map(g => g.productTag))];
  const guideProductCount = linkedProductIds.length;
  const guideProductNames = linkedProductIds
    .map(id => products.find(p => String(p.id) === String(id))?.name)
    .filter(Boolean)
    .slice(0, 2)
    .join('، ');

  const totalProducts = products.length;
  const totalSuppliers = suppliers.length;
  const totalBundles = bundles.length;
  const totalPlans = products.reduce((acc, p) => acc + p.plans.length, 0);
  const activeCoupons = coupons.filter(c => c.active !== false).length;

  const getSupplierPrice = (product) => {
    const primaryId = pricingData?.primarySupplier;
    let bestPrice = Infinity;
    for (const plan of product.plans) {
      for (const [sid, price] of Object.entries(plan.prices)) {
        if (price > 0 && price < bestPrice) {
          if (primaryId && parseInt(sid) === primaryId) {
            bestPrice = price;
            break;
          }
          bestPrice = price;
        }
      }
    }
    return bestPrice === Infinity ? 0 : bestPrice;
  };

  const getTotalCostMultiplier = () => {
    if (!costs) return 1;
    let totalPct = 0;
    let totalFixed = 0;
    costs.forEach(c => {
      if (c.active === false) return;
      if (c.type === 'percentage') totalPct += (c.value || 0);
      else totalFixed += (c.value || 0);
    });
    return { pctMultiplier: 1 + totalPct / 100, fixedCost: totalFixed };
  };

  const costInfo = getTotalCostMultiplier();

  const productsWithPricing = products.map(product => {
    const supplierPrice = getSupplierPrice(product);
    const supplierPriceSar = supplierPrice * exchangeRate;
    const totalCost = supplierPriceSar * costInfo.pctMultiplier + costInfo.fixedCost;
    const officialPrice = product.plans[0]?.officialPriceUsd
      ? product.plans[0].officialPriceUsd * exchangeRate
      : 0;
    const margin = officialPrice > 0 ? ((officialPrice - totalCost) / officialPrice) * 100 : 0;
    const status = officialPrice === 0 ? 'unpriced' :
      officialPrice < totalCost ? 'loss' :
      margin < 10 ? 'low' :
      margin > 50 ? 'high' : 'good';

    return { ...product, supplierPrice, totalCost, officialPrice, margin, status };
  });

  const unpricedProducts = productsWithPricing.filter(p => p.status === 'unpriced');
  const lossProducts = productsWithPricing.filter(p => p.status === 'loss');
  const lowMarginProducts = productsWithPricing.filter(p => p.status === 'low');
  const goodProducts = productsWithPricing.filter(p => p.status === 'good' || p.status === 'high');

  const avgMargin = productsWithPricing.filter(p => p.officialPrice > 0).length > 0
    ? productsWithPricing.filter(p => p.officialPrice > 0).reduce((acc, p) => acc + p.margin, 0) / productsWithPricing.filter(p => p.officialPrice > 0).length
    : 0;

  const bestSupplier = (() => {
    const wins = {};
    products.forEach(p => {
      p.plans.forEach(plan => {
        let min = Infinity;
        let bestId = null;
        for (const [sid, price] of Object.entries(plan.prices)) {
          if (price > 0 && price < min) {
            min = price;
            bestId = sid;
          }
        }
        if (bestId) wins[bestId] = (wins[bestId] || 0) + 1;
      });
    });
    let maxWins = 0;
    let bestSid = null;
    for (const [sid, count] of Object.entries(wins)) {
      if (count > maxWins) { maxWins = count; bestSid = sid; }
    }
    const supplier = suppliers.find(s => s.id === parseInt(bestSid));
    return supplier ? { name: supplier.name, wins: maxWins } : null;
  })();

  const alertItems = [
    ...lossProducts.map(p => ({ type: 'danger', icon: <TrendingDownIcon className="icon-sm" />, text: `${p.name} - يباع بخسارة`, action: 'pricing' })),
    ...lowMarginProducts.map(p => ({ type: 'warning', icon: <AlertTriangleIcon className="icon-sm" />, text: `${p.name} - هامش ربح منخفض (${fmtPct(p.margin)}%)`, action: 'pricing' })),
    ...unpricedProducts.map(p => ({ type: 'info', icon: <TagIcon className="icon-sm" />, text: `${p.name} - لم يتم تسعيره بعد`, action: 'products' })),
  ];

  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const visibleAlerts = showAllAlerts ? alertItems : alertItems.slice(0, 5);
  const visibleProducts = showAllProducts ? productsWithPricing : productsWithPricing.slice(0, 6);

  const storeUrl = appSettings?.storeUrl;

  return (
    <div className="dashboard-page">
      {/* Hero Header Card */}
      <div className="dash-hero-card">
        <div className="dash-hero-orb dash-hero-orb-1" />
        <div className="dash-hero-orb dash-hero-orb-2" />
        <div className="dash-hero-orb dash-hero-orb-3" />
        {/* Two-column layout: main content (right) | side panel (left) */}
        <div className="dash-hero-layout">

          {/* RIGHT — main text content */}
          <div className="dash-hero-main-content">
            <p className="dash-hero-greeting">{greeting}،</p>
            <h1 className="dash-hero-title-main">
              <ActivityIcon className="icon-md" /> لوحة التحكم
            </h1>
            <p className="dash-hero-subtitle">نظرة عامة شاملة على متجرك الرقمي</p>
            <div className="dash-hero-quote">
              <span className="dash-hero-quote-emoji">{todayQuote.emoji}</span>
              <span>{todayQuote.text}</span>
            </div>
          </div>

          {/* LEFT panel — top: date+clocks  |  bottom: store button */}
          <div className="dash-hero-side-panel">
            <div className="dash-hero-side-top">
              <div className="dash-hero-date">
                <CalendarIcon className="icon-xs" />
                <span>{arabicDate}</span>
              </div>
              {enabledTimezones.length > 0 && (
                <div className="dash-clocks-col">
                  {enabledTimezones.map((zone) => (
                    <div key={zone.id} className="dash-clock-pill">
                      <span className="dash-clock-flag">{zone.flag}</span>
                      <span className="dash-clock-label">{zone.label}</span>
                      <span className="dash-clock-time">{formatClock(zone.tz)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {storeUrl && (
              <div className="dash-hero-side-bottom">
                <a
                  href={storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dash-hero-store-btn"
                >
                  <GlobeIcon className="icon-sm" />
                  <span>زيارة المتجر</span>
                  <ExternalLinkIcon className="icon-xs dash-hero-ext-icon" />
                </a>
              </div>
            )}
          </div>

        </div>
      </div>

      <div className="dashboard-stats-grid">
        <div className="dash-stat-card stat-accent-blue" onClick={() => onNavigate('products')}>
          <div className="dash-stat-icon"><PackageIcon /></div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{fmt(totalProducts)}</span>
            <span className="dash-stat-label">المنتجات</span>
            <span className="dash-stat-sub">{fmt(totalPlans)} خطة</span>
          </div>
        </div>

        <div className="dash-stat-card stat-accent-green" onClick={() => onNavigate('products')}>
          <div className="dash-stat-icon"><UsersIcon /></div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{fmt(totalSuppliers)}</span>
            <span className="dash-stat-label">الموردين</span>
            {bestSupplier && <span className="dash-stat-sub"><AwardIcon className="icon-xs" /> {bestSupplier.name}</span>}
          </div>
        </div>

        <div className="dash-stat-card stat-accent-purple" onClick={() => onNavigate('bundles')}>
          <div className="dash-stat-icon"><GiftIcon /></div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{fmt(totalBundles)}</span>
            <span className="dash-stat-label">الحزم</span>
            <span className="dash-stat-sub">{fmt(activeCoupons)} كوبون فعّال</span>
          </div>
        </div>

        <div className="dash-stat-card stat-accent-orange" onClick={() => onNavigate('pricing')}>
          <div className="dash-stat-icon"><PercentIcon /></div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{fmtPct(avgMargin)}%</span>
            <span className="dash-stat-label">متوسط الهامش</span>
            <span className="dash-stat-sub">
              {avgMargin >= 20 ? <><TrendingUpIcon className="icon-xs" /> جيد</> : <><TrendingDownIcon className="icon-xs" /> يحتاج تحسين</>}
            </span>
          </div>
        </div>

        <div className="dash-stat-card stat-accent-red" onClick={() => onNavigate('tasks')}>
          <div className="dash-stat-icon"><CheckSquareIcon /></div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{fmt(todayTasks)}</span>
            <span className="dash-stat-label">مهام اليوم</span>
            <span className="dash-stat-sub">
              {urgentTasks > 0
                ? <><ClockIcon className="icon-xs" /> {urgentTasks} عاجلة</>
                : <><CheckCircleIcon className="icon-xs" /> لا توجد عاجلة</>}
            </span>
          </div>
        </div>

        <div className="dash-stat-card stat-accent-teal" onClick={() => onNavigate('tasks')}>
          <div className="dash-stat-icon"><BookOpenIcon /></div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{fmt(totalGuides)}</span>
            <span className="dash-stat-label">الأدلة المحفوظة</span>
            <span className="dash-stat-sub">
              {guideProductCount > 0
                ? <><TagIcon className="icon-xs" /> {guideProductNames}{guideProductCount > 2 ? ` +${guideProductCount - 2}` : ''}</>
                : 'لا يوجد ربط بعد'}
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-body">
        <div className="dashboard-main-col">
          {alertItems.length > 0 && (
            <div className="dash-section">
              <h2 className="dash-section-title">
                <AlertTriangleIcon className="icon-sm" /> تنبيهات تحتاج انتباهك
                <span className="dash-section-badge">{alertItems.length}</span>
              </h2>
              <div className="dash-alerts-list">
                {visibleAlerts.map((alert, idx) => {
                  const parts = alert.text.split(' - ');
                  const productName = parts[0];
                  const desc = parts.slice(1).join(' - ');
                  const typeLabel = alert.type === 'danger' ? 'خطر' : alert.type === 'warning' ? 'تحذير' : 'يحتاج تسعير';
                  return (
                    <div key={idx} className={`dash-alert-item alert-${alert.type}`} onClick={() => onNavigate(alert.action)}>
                      <span className="dash-alert-icon-wrap">{alert.icon}</span>
                      <span className="dash-alert-body">
                        <span className="dash-alert-product">{productName}</span>
                        <span className="dash-alert-desc">{desc}</span>
                      </span>
                      <span className={`dash-alert-badge badge-${alert.type}`}>{typeLabel}</span>
                      <ArrowLeftIcon className="icon-xs dash-alert-arrow" />
                    </div>
                  );
                })}
                {alertItems.length > 5 && (
                  <button className="dash-show-more-btn" onClick={() => setShowAllAlerts(!showAllAlerts)}>
                    {showAllAlerts ? 'عرض أقل' : `عرض الكل (${alertItems.length})`}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="dash-section">
            <h2 className="dash-section-title">
              <PackageIcon className="icon-sm" /> حالة المنتجات
            </h2>
            <div className="dash-products-summary">
              <div className="dash-product-status-bar">
                {goodProducts.length > 0 && (
                  <div className="status-segment good" style={{ flex: goodProducts.length }} title={`${goodProducts.length} منتج - هامش جيد`}></div>
                )}
                {lowMarginProducts.length > 0 && (
                  <div className="status-segment warning" style={{ flex: lowMarginProducts.length }} title={`${lowMarginProducts.length} منتج - هامش منخفض`}></div>
                )}
                {lossProducts.length > 0 && (
                  <div className="status-segment danger" style={{ flex: lossProducts.length }} title={`${lossProducts.length} منتج - خسارة`}></div>
                )}
                {unpricedProducts.length > 0 && (
                  <div className="status-segment neutral" style={{ flex: unpricedProducts.length }} title={`${unpricedProducts.length} منتج - غير مسعّر`}></div>
                )}
              </div>
              <div className="dash-status-legend">
                <span className="legend-item"><span className="legend-dot good"></span> جيد ({goodProducts.length})</span>
                <span className="legend-item"><span className="legend-dot warning"></span> منخفض ({lowMarginProducts.length})</span>
                <span className="legend-item"><span className="legend-dot danger"></span> خسارة ({lossProducts.length})</span>
                <span className="legend-item"><span className="legend-dot neutral"></span> غير مسعّر ({unpricedProducts.length})</span>
              </div>
            </div>

            <div className="dash-products-table">
              <div className="dash-table-header">
                <span>المنتج</span>
                <span>أفضل سعر</span>
                <span>التكلفة</span>
                <span>السعر الرسمي</span>
                <span>الهامش</span>
              </div>
              {visibleProducts.map(p => (
                <div key={p.id} className={`dash-table-row status-${p.status}`} onClick={() => onNavigate('products')}>
                  <span className="dash-table-name">{p.name}</span>
                  <span className="dash-table-cell" dir="ltr">{p.supplierPrice > 0 ? `${fmt(p.supplierPrice * exchangeRate)} ﷼` : '—'}</span>
                  <span className="dash-table-cell" dir="ltr">{p.totalCost > 0 ? `${fmt(p.totalCost)} ﷼` : '—'}</span>
                  <span className="dash-table-cell" dir="ltr">{p.officialPrice > 0 ? `${fmt(p.officialPrice)} ﷼` : '—'}</span>
                  <span className={`dash-table-cell margin-${p.status}`}>
                    {p.officialPrice > 0 ? `${fmtPct(p.margin)}%` : '—'}
                  </span>
                </div>
              ))}
              {productsWithPricing.length > 6 && (
                <button className="dash-show-more-btn" onClick={() => setShowAllProducts(!showAllProducts)}>
                  {showAllProducts ? 'عرض أقل' : `عرض كل المنتجات (${productsWithPricing.length})`}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-side-col">
          <div className="dash-section">
            <h2 className="dash-section-title">
              <ZapIcon className="icon-sm" /> إجراءات سريعة
            </h2>
            <div className="dash-quick-actions">
              <button className="dash-quick-btn dqb-blue" onClick={() => onNavigate('products')}>
                <span className="dqb-icon"><PlusIcon className="icon-sm" /></span>
                <span>إضافة منتج</span>
                <ArrowLeftIcon className="icon-xs dqb-arrow" />
              </button>
              <button className="dash-quick-btn dqb-green" onClick={() => onNavigate('bundles')}>
                <span className="dqb-icon"><GiftIcon className="icon-sm" /></span>
                <span>إنشاء حزمة</span>
                <ArrowLeftIcon className="icon-xs dqb-arrow" />
              </button>
              <button className="dash-quick-btn dqb-orange" onClick={() => onNavigate('pricing')}>
                <span className="dqb-icon"><DollarSignIcon className="icon-sm" /></span>
                <span>إدارة التكاليف</span>
                <ArrowLeftIcon className="icon-xs dqb-arrow" />
              </button>
              <button className="dash-quick-btn dqb-purple" onClick={() => onNavigate('reports')}>
                <span className="dqb-icon"><BarChartIcon className="icon-sm" /></span>
                <span>تصدير تقرير</span>
                <ArrowLeftIcon className="icon-xs dqb-arrow" />
              </button>
              <button className="dash-quick-btn dqb-grey" onClick={() => onNavigate('settings')}>
                <span className="dqb-icon"><SettingsIcon className="icon-sm" /></span>
                <span>الإعدادات</span>
                <ArrowLeftIcon className="icon-xs dqb-arrow" />
              </button>
              {storeUrl && (
                <a
                  href={storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dash-quick-btn dqb-teal"
                  style={{ textDecoration: 'none' }}
                >
                  <span className="dqb-icon"><GlobeIcon className="icon-sm" /></span>
                  <span>زيارة المتجر</span>
                  <ExternalLinkIcon className="icon-xs dqb-arrow" />
                </a>
              )}
            </div>
          </div>

          <div className="dash-section">
            <h2 className="dash-section-title">
              <DollarSignIcon className="icon-sm" /> ملخص التسعير
            </h2>
            <div className="dash-pricing-summary">
              <div className="dash-pricing-row">
                <span className="dash-pricing-label">سعر الصرف</span>
                <span className="dash-pricing-value" dir="ltr">1 USD = {fmt(exchangeRate)} SAR</span>
              </div>
              <div className="dash-pricing-row">
                <span className="dash-pricing-label">إجمالي التكاليف الثابتة</span>
                <span className="dash-pricing-value" dir="ltr">{fmt(costInfo.fixedCost)} ﷼</span>
              </div>
              <div className="dash-pricing-row">
                <span className="dash-pricing-label">نسبة التكاليف المتغيرة</span>
                <span className="dash-pricing-value" dir="ltr">{fmtPct((costInfo.pctMultiplier - 1) * 100)}%</span>
              </div>
              <div className="dash-pricing-row">
                <span className="dash-pricing-label">طرق التفعيل</span>
                <span className="dash-pricing-value">{fmt(activationMethods.length)} طريقة</span>
              </div>
              <div className="dash-pricing-row">
                <span className="dash-pricing-label">المدد المتاحة</span>
                <span className="dash-pricing-value">{fmt(durations.length)} مدة</span>
              </div>
            </div>
          </div>

          {bestSupplier && (
            <div className="dash-section">
              <h2 className="dash-section-title">
                <AwardIcon className="icon-sm" /> أفضل مورد
              </h2>
              <div className="dash-best-supplier">
                <div className="dash-supplier-avatar">{bestSupplier.name.charAt(0)}</div>
                <div className="dash-supplier-info">
                  <span className="dash-supplier-name">{bestSupplier.name}</span>
                  <span className="dash-supplier-wins">
                    <StarIcon className="icon-xs" /> أفضل سعر في {fmt(bestSupplier.wins)} من {fmt(totalPlans)} خطة
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
