import React, { useRef, useState } from 'react';
import { useNotifications } from './NotificationContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  BarChartIcon, PackageIcon, BuildingIcon, ClipboardIcon, 
  CurrencyIcon, GlobeIcon, ScaleIcon, TrendingUpIcon, ZapIcon, DownloadIcon,
  StarIcon, KeyIcon, ChevronDownIcon, FileTextIcon, ListIcon, CheckCircleIcon
} from './Icons';
import { FEATURE_ICONS, FEATURE_BADGES } from '../data/productTemplates';

const fmt = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtInt = (v) => Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 });

/* ── Pricing helpers (mirrored from FinalPricesManager, no JSX) ── */
function rpComputeTotalCost(baseSAR, costs) {
  let fixed = 0, percents = 0;
  costs.filter(c => c.active).forEach(c => {
    if (c.type === 'fixed') fixed += c.value;
    else if (c.type === 'percentage') percents += c.value / 100;
  });
  const marginDec = 0.20;
  const denom = 1 - marginDec - percents;
  const suggested = denom > 0 ? (baseSAR + fixed) / denom : 0;
  return baseSAR + fixed + (suggested * percents);
}
function rpComputeSuggested(baseSAR, costs) {
  let fixed = 0, percents = 0;
  costs.filter(c => c.active).forEach(c => {
    if (c.type === 'fixed') fixed += c.value;
    else if (c.type === 'percentage') percents += c.value / 100;
  });
  const marginDec = 0.20;
  const denom = 1 - marginDec - percents;
  return denom > 0 ? (baseSAR + fixed) / denom : 0;
}
function rpGetStatusLabel(finalPrice, totalCost, suggested) {
  if (!finalPrice || finalPrice <= 0) return null;
  if (finalPrice < totalCost)       return 'تحت التكلفة';
  if (finalPrice < suggested)       return 'يحتاج رفع';
  if (finalPrice > suggested * 1.5) return 'مرتفع جداً';
  return 'مثالي';
}
function rpStatusColor(label) {
  if (!label) return '#9CA3AF';
  if (label === 'تحت التكلفة') return '#F94B60';
  if (label === 'يحتاج رفع')  return '#E68A00';
  if (label === 'مرتفع جداً') return '#4B9CF9';
  return '#3ECF8E';
}

const pdfColors = {
  primary: '#1a1a3e',
  accent: '#5E4FDE',
  green: '#0ea85c',
  blue: '#1A51F4',
  orange: '#F7784A',
  red: '#F94B60',
  gold: '#FFC530',
  muted: '#6b7280',
  light: '#f8f9fe',
  border: '#e5e7eb',
  borderLight: '#f0f0f0',
};

const thStyle = {
  padding: '8px 10px',
  textAlign: 'center',
  fontWeight: '700',
  borderBottom: `2px solid ${pdfColors.border}`,
  background: pdfColors.light,
  fontSize: '12px',
};
const subThStyle = {
  padding: '6px 8px',
  textAlign: 'center',
  fontWeight: '500',
  borderBottom: `1px solid ${pdfColors.border}`,
  background: '#fafbff',
  fontSize: '11px',
};
const tdStyle = {
  padding: '6px 10px',
  textAlign: 'center',
  borderBottom: `1px solid ${pdfColors.borderLight}`,
  fontSize: '12px',
};

const MetricCard = ({ label, value, color, icon }) => (
  <div style={{
    background: `${color}10`,
    border: `1.5px solid ${color}30`,
    borderRadius: '8px',
    padding: '10px 12px',
    textAlign: 'center',
    flex: '1 1 0',
    minWidth: '90px',
  }}>
    <div style={{ fontSize: '18px', fontWeight: '800', color, lineHeight: '1.2' }}>{value}</div>
    <div style={{ fontSize: '10px', color: pdfColors.muted, marginTop: '3px', fontWeight: '500' }}>{label}</div>
  </div>
);

const ReportHeader = ({ title, color, subtitle, stats }) => (
  <div>
    <div style={{
      background: `linear-gradient(135deg, ${color} 0%, ${color}bb 100%)`,
      color: '#fff',
      padding: '18px 28px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: '20px', margin: '0 0 3px 0', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '11px', margin: 0, opacity: 0.85 }}>{subtitle}</p>}
      </div>
      <div style={{ textAlign: 'left', flexShrink: 0 }}>
        <div style={{ fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
          متجر مفتاح <KeyIcon className="icon-sm" style={{ color: '#fff' }} />
        </div>
        <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
          {new Date().toLocaleDateString('ar-SA-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
    </div>
    {stats && (
      <div style={{ padding: '10px 28px', background: '#fff', borderBottom: `2px solid ${pdfColors.border}`, display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {stats}
      </div>
    )}
  </div>
);

const SectionTitle = ({ children, color = pdfColors.accent }) => (
  <h2 style={{ fontSize: '14px', fontWeight: '700', color, margin: '14px 0 8px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: `2px solid ${color}20`, paddingBottom: '6px' }}>
    {children}
  </h2>
);

const ReportFooter = () => (
  <div style={{
    background: pdfColors.light,
    padding: '12px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: `2px solid ${pdfColors.border}`,
  }}>
    <span style={{ fontSize: '11px', color: pdfColors.muted }}>
      متجر مفتاح — تقرير تلقائي — {new Date().toLocaleDateString('ar-SA-u-nu-latn', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })}
    </span>
    <span style={{ fontSize: '10px', color: '#bbb' }}>miftah.store</span>
  </div>
);

const InfoRow = ({ label, value, color, bold }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${pdfColors.borderLight}` }}>
    <span style={{ fontSize: '12px', color: pdfColors.muted }}>{label}</span>
    <span style={{ fontSize: '13px', fontWeight: bold ? '700' : '600', color: color || pdfColors.primary }}>{value}</span>
  </div>
);

const Badge = ({ children, color = pdfColors.accent, bg }) => (
  <span style={{
    background: bg || `${color}12`,
    color,
    padding: '3px 10px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '600',
    display: 'inline-block',
  }}>{children}</span>
);

const DonutChartVisual = ({ data, size = 160, thickness = 34, label, sublabel }) => {
  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  if (!total) return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>لا بيانات</div>
  );
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;
  let cumFrac = 0;
  const segs = data.map(d => {
    const frac = d.value / total;
    const dashLen = frac * C;
    const rot = cumFrac * 360 - 90;
    cumFrac += frac;
    return { color: d.color, dashLen, rot };
  });
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-tertiary)" strokeWidth={thickness} />
        {segs.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={s.color} strokeWidth={thickness - 3}
            strokeDasharray={`${s.dashLen} ${C - s.dashLen}`}
            transform={`rotate(${s.rot}, ${cx}, ${cy})`}
          />
        ))}
      </svg>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
        {label !== undefined && <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{label}</div>}
        {sublabel && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{sublabel}</div>}
      </div>
    </div>
  );
};

const HBarChartVisual = ({ data }) => {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ width: '100%', padding: '4px 0' }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, direction: 'rtl' }}>
          <div style={{ width: 120, fontSize: 12, color: 'var(--text-primary)', textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.label}>
            {d.label}
          </div>
          <div style={{ flex: 1, height: 22, background: 'var(--bg-tertiary)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ width: `${Math.max((d.value / maxVal) * 100, 2)}%`, height: '100%', background: d.color || 'var(--accent-blue)', borderRadius: 6, minWidth: 6 }} />
          </div>
          <div style={{ width: 64, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left', flexShrink: 0, direction: 'ltr' }}>
            {d.display || d.value}
          </div>
        </div>
      ))}
    </div>
  );
};

function ReportsExport({ products, suppliers, durations, exchangeRate, activationMethods = [], categories = [], finalPrices = {}, costs = [], pricingData = {} }) {
  const { addNotification } = useNotifications();
  const reportRef = useRef(null);
  const [generating, setGenerating] = useState(null);
  const [activeSection, setActiveSection] = useState('global');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('all');
  const [expandedProducts, setExpandedProducts] = useState({});
  const [finalPricesProductId, setFinalPricesProductId] = useState('');
  const [fpExpandedIds, setFpExpandedIds] = useState(() => new Set(products.slice(0, 1).map(p => p.id)));

  const toggleProduct = (productName) => {
    setExpandedProducts(prev => ({ ...prev, [productName]: !prev[productName] }));
  };

  const expandAll = () => {
    const all = {};
    products.forEach(p => { all[formatProductName(p)] = true; });
    setExpandedProducts(all);
  };

  const collapseAll = () => {
    setExpandedProducts({});
  };

  const getDurationLabel = (durationId) => {
    const dur = durations.find((d) => d.id === durationId);
    return dur ? dur.label : durationId;
  };

  const formatProductName = (product) => {
    if (product.accountType === 'individual') return `${product.name} (فردي)`;
    if (product.accountType === 'team') return `${product.name} (فريق)`;
    return product.name;
  };

  const getAnalyticsFor = (productList) => {
    const rows = [];
    productList.forEach((product) => {
      product.plans.forEach((plan) => {
        let cheapest = { price: Infinity, supplierName: '-' };
        let expensive = { price: 0, supplierName: '-' };
        let total = 0, count = 0;
        suppliers.forEach((s) => {
          const p = plan.prices[s.id] || 0;
          if (p > 0) {
            total += p; count++;
            if (p < cheapest.price) cheapest = { price: p, supplierName: s.name };
            if (p > expensive.price) expensive = { price: p, supplierName: s.name };
          }
        });
        const avg = count > 0 ? total / count : 0;
        const savings = cheapest.price < Infinity ? expensive.price - cheapest.price : 0;
        const savingsPercent = expensive.price > 0 ? fmtPct((savings / expensive.price) * 100) : '0';
        rows.push({
          productName: formatProductName(product),
          planDuration: getDurationLabel(plan.durationId),
          cheapest: cheapest.price < Infinity ? cheapest : { price: 0, supplierName: '-' },
          expensive, avgPrice: avg, savings, savingsPercent,
          supplierCount: count,
          warrantyDays: plan.warrantyDays || 0,
        });
      });
    });
    return rows;
  };

  const analytics     = getAnalyticsFor(products);
  const totalSavings  = analytics.reduce((s, a) => s + a.savings, 0);
  const totalPlans    = products.reduce((s, p) => s + p.plans.length, 0);
  const avgSavingsPercent = analytics.length > 0
    ? fmtPct(analytics.reduce((s, a) => s + parseFloat(a.savingsPercent), 0) / analytics.length)
    : '0';

  const groupedAnalytics = (() => {
    const groups = [];
    let currentGroup = null;
    analytics.forEach((a) => {
      if (!currentGroup || currentGroup.productName !== a.productName) {
        currentGroup = { productName: a.productName, plans: [] };
        groups.push(currentGroup);
      }
      currentGroup.plans.push(a);
    });
    return groups;
  })();

  const getBestSupplierPerProduct = (productList) => {
    return productList.map((product) => {
      const wins = {};
      product.plans.forEach((plan) => {
        let min = Infinity, bestName = '';
        suppliers.forEach((s) => {
          const p = plan.prices[s.id] || 0;
          if (p > 0 && p < min) { min = p; bestName = s.name; }
        });
        if (bestName) wins[bestName] = (wins[bestName] || 0) + 1;
      });
      const sorted = Object.entries(wins).sort((a, b) => b[1] - a[1]);
      return sorted.length > 0
        ? { productName: formatProductName(product), supplierName: sorted[0][0], planCount: sorted[0][1] }
        : null;
    }).filter(Boolean);
  };

  const getOverallBestSupplier = () => {
    const wins = {};
    products.forEach(product => {
      product.plans.forEach(plan => {
        let min = Infinity, bestName = '';
        suppliers.forEach(s => {
          const p = plan.prices[s.id] || 0;
          if (p > 0 && p < min) { min = p; bestName = s.name; }
        });
        if (bestName) wins[bestName] = (wins[bestName] || 0) + 1;
      });
    });
    const sorted = Object.entries(wins).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? { name: sorted[0][0], count: sorted[0][1], total: totalPlans } : null;
  };

  const getRowBreakPoints = (element, canvasScale) => {
    const containerTop = element.getBoundingClientRect().top;
    const breakPoints = new Set();
    breakPoints.add(0);
    const rows = element.querySelectorAll('tr');
    rows.forEach(row => {
      const rect = row.getBoundingClientRect();
      const topPx = Math.round((rect.top - containerTop) * canvasScale);
      const bottomPx = Math.round((rect.bottom - containerTop) * canvasScale);
      breakPoints.add(topPx);
      breakPoints.add(bottomPx);
    });
    const sections = element.querySelectorAll('div[style*="padding"], div[style*="margin"], h2, h3');
    sections.forEach(el => {
      const rect = el.getBoundingClientRect();
      const topPx = Math.round((rect.top - containerTop) * canvasScale);
      breakPoints.add(topPx);
    });
    return [...breakPoints].sort((a, b) => a - b);
  };

  const findBestBreakPoint = (breakPoints, minY, maxY) => {
    let best = -1;
    for (let i = breakPoints.length - 1; i >= 0; i--) {
      if (breakPoints[i] <= maxY && breakPoints[i] >= minY) {
        best = breakPoints[i];
        break;
      }
    }
    return best;
  };

  const sliceCanvasSmartly = (canvas, element, doc, margin, usableW, usableH, canvasScale) => {
    const scale = usableW / canvas.width;
    const maxSliceHeightPx = Math.floor(usableH / scale);
    const breakPoints = getRowBreakPoints(element, canvasScale);
    let srcY = 0;
    let pageIdx = 0;
    while (srcY < canvas.height) {
      if (pageIdx > 0) doc.addPage();
      const remaining = canvas.height - srcY;
      let srcH;
      if (remaining <= maxSliceHeightPx) {
        srcH = remaining;
      } else {
        const idealEnd = srcY + maxSliceHeightPx;
        const minAcceptable = srcY + maxSliceHeightPx * 0.6;
        const bestBreak = findBestBreakPoint(breakPoints, minAcceptable, idealEnd);
        srcH = bestBreak > srcY ? bestBreak - srcY : Math.min(maxSliceHeightPx, remaining);
      }
      if (srcH <= 0) srcH = Math.min(maxSliceHeightPx, remaining);
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = srcH;
      const ctx = sliceCanvas.getContext('2d');
      ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
      const sliceData = sliceCanvas.toDataURL('image/png');
      const drawH = srcH * scale;
      doc.addImage(sliceData, 'PNG', margin, margin, usableW, drawH);
      srcY += srcH;
      pageIdx++;
      if (pageIdx > 500) break;
    }
  };

  const generatePDF = async (key, filename, isLandscape = false) => {
    setGenerating(key);
    try {
      await new Promise((r) => setTimeout(r, 250));
      const element = reportRef.current;
      if (!element) return;
      const canvasScale = 2;
      const canvas = await html2canvas(element, {
        scale: canvasScale, useCORS: true, backgroundColor: '#ffffff', logging: false,
      });
      const orientation = isLandscape ? 'landscape' : 'portrait';
      const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 8;
      const usableW = pageW - margin * 2;
      const usableH = pageH - margin * 2;
      const scale = usableW / canvas.width;
      const scaledH = canvas.height * scale;

      if (scaledH <= usableH) {
        const imgData = canvas.toDataURL('image/png');
        const xOff = (pageW - canvas.width * scale) / 2;
        doc.addImage(imgData, 'PNG', xOff, margin, canvas.width * scale, scaledH);
      } else {
        sliceCanvasSmartly(canvas, element, doc, margin, usableW, usableH, canvasScale);
      }
      const safeName = filename.replace(/[<>:"/\\|?*]/g, '_').trim() || 'report.pdf';
      doc.save(safeName);
      addNotification({ type: 'success', title: 'تم تصدير التقرير', description: `تم إنشاء وتحميل "${safeName}"`, category: 'operations', actionTab: 'reports' });
    } catch (e) {
      alert('حدث خطأ أثناء إنشاء التقرير: ' + e.message);
      addNotification({ type: 'error', title: 'فشل تصدير التقرير', description: e.message, category: 'operations', actionTab: 'reports' });
    } finally {
      setGenerating(null);
    }
  };

  const generateAllProductPDFs = async () => {
    setGenerating('all-products');
    try {
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        await new Promise((r) => setTimeout(r, 300));
        const element = reportRef.current;
        if (!element) continue;
        setGenerating(`all-products-${product.id}`);
        await new Promise((r) => setTimeout(r, 250));
        const canvasScale = 2;
        const canvas = await html2canvas(element, {
          scale: canvasScale, useCORS: true, backgroundColor: '#ffffff', logging: false,
        });
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 8;
        const usableW = pageW - margin * 2;
        const usableH = pageH - margin * 2;
        const scale = usableW / canvas.width;
        const scaledH = canvas.height * scale;

        if (scaledH <= usableH) {
          const imgData = canvas.toDataURL('image/png');
          const xOff = (pageW - canvas.width * scale) / 2;
          doc.addImage(imgData, 'PNG', xOff, margin, canvas.width * scale, scaledH);
        } else {
          sliceCanvasSmartly(canvas, element, doc, margin, usableW, usableH, canvasScale);
        }
        const safeName = `تقرير_${product.name}_مفتاح.pdf`.replace(/[<>:"/\\|?*]/g, '_').trim();
        doc.save(safeName);
      }
      addNotification({ type: 'success', title: 'تم تصدير جميع التقارير', description: `تم إنشاء ${products.length} ملف PDF`, category: 'operations', actionTab: 'reports' });
    } catch (e) {
      alert('حدث خطأ أثناء إنشاء التقارير: ' + e.message);
      addNotification({ type: 'error', title: 'فشل تصدير التقارير', description: e.message, category: 'operations', actionTab: 'reports' });
    } finally {
      setGenerating(null);
    }
  };

  // ══════════════════════════════════════════════════════════
  // 1. FULL REPORT — All products with all suppliers
  // ══════════════════════════════════════════════════════════
  const renderFullReport = () => {
    const bestSupplier = getOverallBestSupplier();
    return (
      <div style={{ fontFamily: 'Tajawal, sans-serif', direction: 'rtl', background: '#fff', color: pdfColors.primary, minWidth: '950px' }}>
        <ReportHeader
          title={<><ClipboardIcon style={{width: 24, height: 24}} /> التقرير الكامل — جميع المنتجات والأسعار</>}
          color={pdfColors.accent}
          subtitle={`${products.length} منتج — ${suppliers.length} مورد — ${totalPlans} خطة — سعر الصرف: 1$ = ${exchangeRate} ﷼`}
          stats={<>
            <MetricCard label="عدد المنتجات" value={products.length} color={pdfColors.accent} />
            <MetricCard label="عدد الموردين" value={suppliers.length} color={pdfColors.green} />
            <MetricCard label="إجمالي الخطط" value={totalPlans} color={pdfColors.blue} />
            <MetricCard label="متوسط التوفير" value={`${avgSavingsPercent}%`} color={pdfColors.orange} />
            {bestSupplier && <MetricCard label="أفضل مورد عام" value={bestSupplier.name} color={pdfColors.green} />}
          </>}
        />

        <div style={{ padding: '10px 24px' }}>
          <SectionTitle color={pdfColors.accent}>
            <CurrencyIcon className="icon-sm" /> جدول الأسعار الشامل — بالريال السعودي
          </SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: `1px solid ${pdfColors.border}`, borderRadius: '8px' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '30px' }}>#</th>
                <th style={{ ...thStyle, textAlign: 'right', minWidth: '140px' }}>المنتج</th>
                <th style={{ ...thStyle, minWidth: '50px' }}>النوع</th>
                <th style={thStyle}>الخطة</th>
                <th style={thStyle}>الضمان</th>
                {suppliers.map((s) => (
                  <th key={s.id} style={{ ...thStyle, background: pdfColors.accent, color: '#fff' }}>{s.name}</th>
                ))}
                <th style={{ ...thStyle, background: pdfColors.green, color: '#fff', minWidth: '100px' }}>أفضل سعر</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, pi) =>
                product.plans.map((plan, planIdx) => {
                  let minP = Infinity, bestName = '';
                  suppliers.forEach((s) => { const p = plan.prices[s.id] || 0; if (p > 0 && p < minP) { minP = p; bestName = s.name; } });
                  return (
                    <tr key={`${product.id}-${plan.id}`} style={{ background: pi % 2 === 0 ? '#f8f9fe' : '#fff' }}>
                      {planIdx === 0 && (
                        <>
                          <td style={{ ...tdStyle, fontWeight: '700', color: '#888' }} rowSpan={product.plans.length}>{pi + 1}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '700', wordBreak: 'break-word', whiteSpace: 'normal' }} rowSpan={product.plans.length}>
                            <div style={{ lineHeight: '1.4' }}>{formatProductName(product)}</div>
                          </td>
                          <td style={{ ...tdStyle, fontSize: '10px' }} rowSpan={product.plans.length}>
                            <Badge color={product.accountType === 'team' ? pdfColors.blue : pdfColors.accent}>
                              {product.accountType === 'team' ? 'فريق' : product.accountType === 'individual' ? 'فردي' : 'عام'}
                            </Badge>
                          </td>
                        </>
                      )}
                      <td style={tdStyle}>
                        <Badge color={pdfColors.accent}>{getDurationLabel(plan.durationId)}</Badge>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {plan.warrantyDays > 0 ? (
                          <span style={{ color: pdfColors.green, fontWeight: '600', fontSize: '11px' }}>{plan.warrantyDays} يوم</span>
                        ) : (
                          <span style={{ color: '#bbb', fontSize: '10px' }}>—</span>
                        )}
                      </td>
                      {suppliers.map((s) => {
                        const usd = plan.prices[s.id] || 0;
                        const isBest = usd > 0 && usd === minP;
                        return (
                          <td key={s.id} style={{ ...tdStyle, fontWeight: isBest ? '700' : '500', color: isBest ? pdfColors.green : '#333', background: isBest ? '#E8FFF3' : undefined }}>
                            {usd > 0 ? `${fmt(usd * exchangeRate)} ر.س` : <span style={{ color: '#bbb', fontSize: '10px' }}>—</span>}
                          </td>
                        );
                      })}
                      <td style={{ ...tdStyle, fontWeight: '700', color: pdfColors.green, fontSize: '11px' }}>
                        {minP < Infinity ? `${bestName} — ${fmt(minP * exchangeRate)} ر.س` : <span style={{ color: '#bbb', fontSize: '10px' }}>—</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <SectionTitle color={pdfColors.green}>
            <StarIcon className="icon-sm" /> ملخص أفضل الموردين حسب المنتج
          </SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {getBestSupplierPerProduct(products).map((bp, idx) => (
              <div key={idx} style={{ background: '#f0faf5', border: `1px solid ${pdfColors.green}30`, borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: pdfColors.muted, marginBottom: '2px' }}>{bp.productName}</div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: pdfColors.green }}>{bp.supplierName}</div>
                <div style={{ fontSize: '9px', color: '#888' }}>الأفضل في {bp.planCount} {bp.planCount === 1 ? 'خطة' : 'خطط'}</div>
              </div>
            ))}
          </div>
        </div>
        <ReportFooter />
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════
  // 2. PRODUCT REPORT — Single product detail
  // ══════════════════════════════════════════════════════════
  const renderProductReport = (product) => {
    if (!product) return null;
    const productAnalytics = getAnalyticsFor([product]);
    const bestSupplier = getBestSupplierPerProduct([product])[0];
    const assignedMethods = (product.activationMethods || [])
      .map((mId) => activationMethods.find((x) => x.id === mId))
      .filter(Boolean);

    const totalAvgSavings = productAnalytics.length > 0
      ? fmtPct(productAnalytics.reduce((s,a) => s+parseFloat(a.savingsPercent),0)/productAnalytics.length) : '0';

    let cheapestOverall = Infinity, cheapestSupplier = '', expensiveOverall = 0, expensiveSupplier = '';
    product.plans.forEach(plan => {
      suppliers.forEach(s => {
        const p = plan.prices[s.id] || 0;
        if (p > 0) {
          if (p < cheapestOverall) { cheapestOverall = p; cheapestSupplier = s.name; }
          if (p > expensiveOverall) { expensiveOverall = p; expensiveSupplier = s.name; }
        }
      });
    });

    return (
      <div style={{ fontFamily: 'Tajawal, sans-serif', direction: 'rtl', background: '#fff', color: pdfColors.primary, width: '750px', lineHeight: '1.4' }}>
        <ReportHeader
          title={<><PackageIcon style={{width: 24, height: 24}} /> تقرير المنتج: {formatProductName(product)}</>}
          color={pdfColors.blue}
          subtitle={`${product.plans.length} خطة اشتراك — ${suppliers.length} مورد — سعر الصرف: 1$ = ${exchangeRate} ﷼`}
          stats={<>
            <MetricCard label="عدد الخطط" value={product.plans.length} color={pdfColors.blue} />
            <MetricCard label="عدد الموردين" value={suppliers.length} color={pdfColors.accent} />
            {bestSupplier && <MetricCard label="أفضل مورد" value={bestSupplier.supplierName} color={pdfColors.green} />}
            <MetricCard label="متوسط التوفير" value={`${totalAvgSavings}%`} color={pdfColors.orange} />
          </>}
        />

        <div style={{ padding: '10px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div style={{ background: pdfColors.light, border: `1px solid ${pdfColors.border}`, borderRadius: '10px', padding: '14px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: pdfColors.accent, margin: '0 0 10px' }}>معلومات المنتج</h3>
              <InfoRow label="اسم المنتج" value={product.name} bold />
              <InfoRow label="نوع الحساب" value={product.accountType === 'team' ? 'فريق' : product.accountType === 'individual' ? 'فردي' : 'عام'} />
              <InfoRow label="عدد الخطط" value={product.plans.length} />
              {product.storeUrl && <InfoRow label="رابط المتجر" value={product.storeUrl} color={pdfColors.blue} />}
              {assignedMethods.length > 0 && <InfoRow label="طرق التفعيل" value={assignedMethods.map(m => m.label).join('، ')} />}
            </div>
            <div style={{ background: pdfColors.light, border: `1px solid ${pdfColors.border}`, borderRadius: '10px', padding: '14px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: pdfColors.green, margin: '0 0 10px' }}>ملخص الأسعار</h3>
              {cheapestOverall < Infinity && (
                <>
                  <InfoRow label="أقل سعر" value={`${fmt(cheapestOverall * exchangeRate)} ر.س (${cheapestSupplier})`} color={pdfColors.green} bold />
                  <InfoRow label="أعلى سعر" value={`${fmt(expensiveOverall * exchangeRate)} ر.س (${expensiveSupplier})`} color={pdfColors.red} />
                  <InfoRow label="فارق التوفير" value={`${fmt((expensiveOverall - cheapestOverall) * exchangeRate)} ر.س`} color={pdfColors.orange} bold />
                </>
              )}
            </div>
          </div>

          {assignedMethods.length > 0 && (
            <>
              <SectionTitle color={pdfColors.accent}>
                <ZapIcon className="icon-sm" /> طرق التفعيل المتاحة
              </SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {assignedMethods.map((m) => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', 
                    padding: '8px 14px', borderRadius: '8px', 
                    background: `${m.color}12`, border: `1px solid ${m.color}25`,
                    color: m.color, fontSize: '12px', fontWeight: '600'
                  }}>
                    <span style={{ fontSize: '14px' }}>{m.icon}</span>
                    <div>
                      <div style={{ lineHeight: '1.2' }}>{m.label}</div>
                      {m.description && <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '1px', fontWeight: '500' }}>{m.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <SectionTitle color={pdfColors.blue}>
            <CurrencyIcon className="icon-sm" /> جدول أسعار الموردين التفصيلي
          </SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: `1px solid ${pdfColors.border}` }}>
            <thead>
              <tr>
                <th style={thStyle}>الخطة</th>
                <th style={thStyle}>الضمان</th>
                {suppliers.map((s) => (
                  <th key={s.id} style={{ ...thStyle, background: pdfColors.blue, color: '#fff' }}>{s.name}</th>
                ))}
                <th style={{ ...thStyle, background: pdfColors.green, color: '#fff' }}>أفضل سعر</th>
              </tr>
            </thead>
            <tbody>
              {product.plans.map((plan, pi) => {
                let minP = Infinity, bestName = '';
                suppliers.forEach((s) => {
                  const p = plan.prices[s.id] || 0;
                  if (p > 0 && p < minP) { minP = p; bestName = s.name; }
                });
                return (
                  <tr key={plan.id} style={{ background: pi % 2 === 0 ? '#f0f2ff' : '#fff' }}>
                    <td style={tdStyle}>
                      <Badge color={pdfColors.blue}>{getDurationLabel(plan.durationId)}</Badge>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {plan.warrantyDays > 0 ? (
                        <span style={{ color: pdfColors.green, fontWeight: '600', fontSize: '11px' }}>{plan.warrantyDays} يوم</span>
                      ) : (
                        <span style={{ color: '#bbb', fontSize: '10px' }}>—</span>
                      )}
                    </td>
                    {suppliers.map((s) => {
                      const usd = plan.prices[s.id] || 0;
                      const isBest = usd > 0 && usd === minP;
                      return (
                        <td key={s.id} style={{ ...tdStyle, fontWeight: isBest ? '800' : '500', color: isBest ? pdfColors.green : '#333', background: isBest ? '#E8FFF3' : undefined }}>
                          {usd > 0 ? `${fmt(usd * exchangeRate)} ر.س` : <span style={{ color: '#bbb', fontSize: '10px' }}>—</span>}
                        </td>
                      );
                    })}
                    <td style={{ ...tdStyle, fontWeight: '700', color: pdfColors.green }}>
                      {minP < Infinity ? `${bestName} — ${fmt(minP * exchangeRate)} ر.س` : <span style={{ color: '#bbb' }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {productAnalytics.length > 0 && (
            <>
              <SectionTitle color={pdfColors.orange}>
                <BarChartIcon className="icon-sm" /> تحليل التوفير لكل خطة
              </SectionTitle>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: `1px solid ${pdfColors.border}` }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, textAlign: 'right' }}>الخطة</th>
                    <th style={thStyle}>الضمان</th>
                    <th style={thStyle}>أفضل مورد</th>
                    <th style={thStyle}>أقل سعر (ر.س)</th>
                    <th style={thStyle}>المتوسط (ر.س)</th>
                    <th style={thStyle}>التوفير (ر.س)</th>
                    <th style={thStyle}>نسبة التوفير</th>
                  </tr>
                </thead>
                <tbody>
                  {productAnalytics.map((a, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fafbff' : '#fff' }}>
                      <td style={{ ...tdStyle, textAlign: 'right' }}><Badge color={pdfColors.blue}>{a.planDuration}</Badge></td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {a.warrantyDays > 0 ? (
                          <span style={{ color: pdfColors.green, fontWeight: '600', fontSize: '11px' }}>{a.warrantyDays} يوم</span>
                        ) : (
                          <span style={{ color: '#bbb', fontSize: '10px' }}>—</span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: '600', color: pdfColors.green }}>{a.cheapest.supplierName}</td>
                      <td style={{ ...tdStyle, fontWeight: '700' }}>{a.cheapest.price > 0 ? `${fmt(a.cheapest.price * exchangeRate)} ر.س` : '—'}</td>
                      <td style={tdStyle}>{a.avgPrice > 0 ? `${fmt(a.avgPrice * exchangeRate)} ر.س` : '—'}</td>
                      <td style={{ ...tdStyle, color: pdfColors.orange, fontWeight: '600' }}>{fmt(a.savings * exchangeRate)} ر.س</td>
                      <td style={tdStyle}>
                        <Badge color={parseFloat(a.savingsPercent) > 10 ? pdfColors.red : pdfColors.orange}>{a.savingsPercent}%</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
        <ReportFooter />
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════
  // 3. SUPPLIER REPORT — One or all suppliers
  // ══════════════════════════════════════════════════════════
  const renderSupplierReport = (supplierFilter) => {
    const targetSuppliers = supplierFilter === 'all' ? suppliers : suppliers.filter((s) => s.id === parseInt(supplierFilter));
    const title = supplierFilter === 'all'
      ? <><BuildingIcon style={{width: 24, height: 24}} /> تقرير جميع الموردين</>
      : <><BuildingIcon style={{width: 24, height: 24}} /> تقرير المورد: {targetSuppliers[0]?.name || ''}</>;

    return (
      <div style={{ fontFamily: 'Tajawal, sans-serif', direction: 'rtl', background: '#fff', color: pdfColors.primary, minWidth: '720px' }}>
        <ReportHeader
          title={title}
          color={pdfColors.green}
          subtitle={`${targetSuppliers.length} مورد — ${products.length} منتج — سعر الصرف: 1$ = ${exchangeRate} ﷼`}
        />

        {targetSuppliers.map((supplier, sIdx) => {
          const supplierPlans = [];
          let totalSpend = 0, planCount = 0, bestCount = 0;
          products.forEach((product) => {
            product.plans.forEach((plan) => {
              const price = plan.prices[supplier.id] || 0;
              if (price > 0) {
                let minP = Infinity;
                suppliers.forEach((s) => { const p = plan.prices[s.id] || 0; if (p > 0 && p < minP) minP = p; });
                const isBest = price === minP;
                supplierPlans.push({ productName: formatProductName(product), duration: getDurationLabel(plan.durationId), price, isBest, warrantyDays: plan.warrantyDays || 0 });
                totalSpend += price;
                planCount++;
                if (isBest) bestCount++;
              }
            });
          });
          const winRate = planCount > 0 ? fmtPct((bestCount / planCount) * 100) : '0';

          return (
            <div key={supplier.id} style={{ padding: '12px 24px', borderBottom: sIdx < targetSuppliers.length - 1 ? `3px solid ${pdfColors.border}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: `linear-gradient(135deg,${pdfColors.green},${pdfColors.green}cc)`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800', flexShrink: 0 }}>
                  {supplier.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '17px', fontWeight: '800', color: pdfColors.green }}>{supplier.name}</div>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                    {[
                      supplier.whatsapp && `واتساب: ${supplier.whatsapp}`,
                      supplier.telegram && `تيليجرام: @${supplier.telegram}`,
                      supplier.g2g && `G2G: ${supplier.g2g}`,
                    ].filter(Boolean).join(' — ') || 'لا توجد معلومات اتصال'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                <MetricCard label="الخطط المتاحة" value={planCount} color={pdfColors.green} />
                <MetricCard label="الأفضل سعراً" value={bestCount} color={pdfColors.accent} />
                <MetricCard label="نسبة الفوز" value={`${winRate}%`} color={pdfColors.blue} />
                <MetricCard label="إجمالي الأسعار" value={`${fmt(totalSpend * exchangeRate)} ر.س`} color={pdfColors.orange} />
              </div>

              {supplierPlans.length === 0 ? (
                <p style={{ color: '#999', fontSize: '12px', textAlign: 'center', padding: '16px 0' }}>لا توجد أسعار مسجّلة لهذا المورد.</p>
              ) : (() => {
                const groupedPlans = [];
                let curGroup = null;
                supplierPlans.forEach(row => {
                  if (!curGroup || curGroup.productName !== row.productName) {
                    curGroup = { productName: row.productName, rows: [] };
                    groupedPlans.push(curGroup);
                  }
                  curGroup.rows.push(row);
                });
                return (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: `1px solid ${pdfColors.border}` }}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, background: pdfColors.green, color: '#fff', textAlign: 'right' }}>المنتج</th>
                        <th style={{ ...thStyle, background: pdfColors.green, color: '#fff' }}>الخطة</th>
                        <th style={{ ...thStyle, background: pdfColors.green, color: '#fff' }}>الضمان</th>
                        <th style={{ ...thStyle, background: pdfColors.green, color: '#fff' }}>السعر (ر.س)</th>
                        <th style={{ ...thStyle, background: pdfColors.green, color: '#fff' }}>الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedPlans.map((g, gIdx) =>
                        g.rows.map((row, ri) => (
                          <tr key={`${gIdx}-${ri}`} style={{ background: gIdx % 2 === 0 ? '#f0faf5' : '#fff', borderTop: ri === 0 ? `2px solid ${pdfColors.green}30` : 'none' }}>
                            {ri === 0 && (
                              <td rowSpan={g.rows.length} style={{ ...tdStyle, textAlign: 'right', fontWeight: '700', fontSize: '12px', verticalAlign: 'middle', borderRight: `3px solid ${pdfColors.green}`, background: gIdx % 2 === 0 ? '#e8f5ef' : '#f5faf7' }}>
                                {row.productName}
                                <div style={{ fontSize: '9px', color: pdfColors.muted, fontWeight: '500', marginTop: '2px' }}>{g.rows.length} خطة</div>
                              </td>
                            )}
                            <td style={tdStyle}><Badge color={pdfColors.green}>{row.duration}</Badge></td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              {row.warrantyDays > 0 ? (
                                <span style={{ color: pdfColors.green, fontWeight: '600', fontSize: '11px' }}>{row.warrantyDays} يوم</span>
                              ) : (
                                <span style={{ color: '#bbb', fontSize: '10px' }}>—</span>
                              )}
                            </td>
                            <td style={{ ...tdStyle, fontWeight: '700' }}>{fmt(row.price * exchangeRate)} ر.س</td>
                            <td style={tdStyle}>
                              {row.isBest
                                ? <Badge color={pdfColors.green} bg="#E8FFF3">★ الأفضل</Badge>
                                : <Badge color="#999" bg="#f5f5f5">عادي</Badge>
                              }
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          );
        })}
        <ReportFooter />
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════
  // 4. COMPARISON REPORT — Side-by-side supplier comparison
  // ══════════════════════════════════════════════════════════
  const renderComparisonReport = () => (
    <div style={{ fontFamily: 'Tajawal, sans-serif', direction: 'rtl', background: '#fff', color: pdfColors.primary, width: '780px' }}>
      <ReportHeader
        title={<><ScaleIcon style={{width: 24, height: 24}} /> مقارنة الموردين — تحليل أفضل الأسعار</>}
        color={pdfColors.green}
        subtitle={`${products.length} منتج — ${suppliers.length} مورد — سعر الصرف: 1$ = ${exchangeRate} ﷼`}
        stats={<>
          <MetricCard label="إجمالي التوفير" value={`${fmt(totalSavings * exchangeRate)} ر.س`} color={pdfColors.gold} />
          <MetricCard label="متوسط نسبة التوفير" value={`${avgSavingsPercent}%`} color={pdfColors.red} />
          <MetricCard label="إجمالي الخطط" value={totalPlans} color={pdfColors.blue} />
        </>}
      />
      <div style={{ padding: '10px 24px' }}>
        <SectionTitle color={pdfColors.green}>
          <ScaleIcon className="icon-sm" /> جدول المقارنة التفصيلي
        </SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: `1px solid ${pdfColors.border}` }}>
          <thead>
            <tr>
              {['المنتج','الخطة','أفضل مورد','السعر ($)','السعر (﷼)','المتوسط ($)','أغلى سعر ($)','التوفير ($)','نسبة التوفير'].map((h) => (
                <th key={h} style={{ ...thStyle, background: pdfColors.green, color: '#fff', textAlign: h === 'المنتج' ? 'right' : 'center', fontSize: '11px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupedAnalytics.map((group, gi) =>
              group.plans.map((a, pi) => (
                <tr key={`${gi}-${pi}`} style={{ background: gi % 2 === 0 ? '#f0faf5' : '#fff', borderTop: pi === 0 ? `2px solid ${pdfColors.green}30` : 'none' }}>
                  {pi === 0 && (
                    <td rowSpan={group.plans.length} style={{ ...tdStyle, textAlign: 'right', fontWeight: '700', fontSize: '12px', verticalAlign: 'middle', borderRight: `3px solid ${pdfColors.green}`, background: gi % 2 === 0 ? '#e8f5ef' : '#f5faf7' }}>
                      {a.productName}
                      <div style={{ fontSize: '9px', color: pdfColors.muted, fontWeight: '500', marginTop: '2px' }}>{group.plans.length} خطة</div>
                    </td>
                  )}
                  <td style={tdStyle}><Badge color={pdfColors.green}>{a.planDuration}</Badge></td>
                  <td style={{ ...tdStyle, fontWeight: '600', color: pdfColors.green }}>{a.cheapest.supplierName !== '-' ? a.cheapest.supplierName : <span style={{ color: '#bbb' }}>—</span>}</td>
                  <td style={{ ...tdStyle, fontWeight: '700' }}>{a.cheapest.price > 0 ? `${fmt(a.cheapest.price * exchangeRate)} ر.س` : '—'}</td>
                  <td style={tdStyle}>{a.avgPrice > 0 ? `${fmt(a.avgPrice * exchangeRate)} ر.س` : '—'}</td>
                  <td style={{ ...tdStyle, color: pdfColors.red }}>{a.expensive.price > 0 ? `${fmt(a.expensive.price * exchangeRate)} ر.س` : '—'}</td>
                  <td style={{ ...tdStyle, color: pdfColors.orange, fontWeight: '600' }}>{fmt(a.savings * exchangeRate)} ر.س</td>
                  <td style={tdStyle}>
                    <Badge color={parseFloat(a.savingsPercent) > 10 ? pdfColors.red : pdfColors.orange}>{a.savingsPercent}%</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <SectionTitle color={pdfColors.accent}>
          <StarIcon className="icon-sm" /> ملخص أداء الموردين
        </SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: `1px solid ${pdfColors.border}` }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, background: pdfColors.accent, color: '#fff', textAlign: 'right' }}>المورد</th>
              <th style={{ ...thStyle, background: pdfColors.accent, color: '#fff' }}>الخطط المتوفرة</th>
              <th style={{ ...thStyle, background: pdfColors.accent, color: '#fff' }}>مرات الأفضل سعراً</th>
              <th style={{ ...thStyle, background: pdfColors.accent, color: '#fff' }}>نسبة الفوز</th>
              <th style={{ ...thStyle, background: pdfColors.accent, color: '#fff' }}>إجمالي الأسعار (ر.س)</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s, si) => {
              let planCount = 0, bestCount = 0, totalSpend = 0;
              products.forEach(product => {
                product.plans.forEach(plan => {
                  const p = plan.prices[s.id] || 0;
                  if (p > 0) {
                    planCount++;
                    totalSpend += p;
                    let minP = Infinity;
                    suppliers.forEach(sup => { const sp = plan.prices[sup.id] || 0; if (sp > 0 && sp < minP) minP = sp; });
                    if (p === minP) bestCount++;
                  }
                });
              });
              const winRate = planCount > 0 ? fmtPct((bestCount / planCount) * 100) : '0';
              return (
                <tr key={s.id} style={{ background: si % 2 === 0 ? '#fafbff' : '#fff' }}>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '700' }}>{s.name}</td>
                  <td style={tdStyle}>{planCount}</td>
                  <td style={{ ...tdStyle, fontWeight: '700', color: pdfColors.green }}>{bestCount}</td>
                  <td style={tdStyle}><Badge color={parseFloat(winRate) >= 50 ? pdfColors.green : pdfColors.orange}>{winRate}%</Badge></td>
                  <td style={{ ...tdStyle, fontWeight: '600' }}>${fmt(totalSpend)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ReportFooter />
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // 5. SUMMARY / EXECUTIVE REPORT
  // ══════════════════════════════════════════════════════════
  const renderSummaryReport = () => {
    const bestPerProduct = getBestSupplierPerProduct(products);
    const overallBest = getOverallBestSupplier();

    const supplierStats = suppliers.map(s => {
      let planCount = 0, bestCount = 0, totalSpend = 0;
      products.forEach(product => {
        product.plans.forEach(plan => {
          const p = plan.prices[s.id] || 0;
          if (p > 0) {
            planCount++; totalSpend += p;
            let minP = Infinity;
            suppliers.forEach(sup => { const sp = plan.prices[sup.id] || 0; if (sp > 0 && sp < minP) minP = sp; });
            if (p === minP) bestCount++;
          }
        });
      });
      return { ...s, planCount, bestCount, totalSpend, winRate: planCount > 0 ? (bestCount / planCount) * 100 : 0 };
    }).sort((a, b) => b.bestCount - a.bestCount);

    return (
      <div style={{ fontFamily: 'Tajawal, sans-serif', direction: 'rtl', background: '#fff', color: pdfColors.primary, width: '720px' }}>
        <ReportHeader
          title={<><TrendingUpIcon style={{width: 24, height: 24}} /> الملخص التنفيذي — تقرير شامل</>}
          color={pdfColors.blue}
          subtitle={`نظرة شاملة على أداء المتجر والموردين — سعر الصرف: 1$ = ${exchangeRate} ﷼`}
          stats={<>
            <MetricCard label="المنتجات" value={products.length} color={pdfColors.accent} />
            <MetricCard label="الموردين" value={suppliers.length} color={pdfColors.green} />
            <MetricCard label="الخطط" value={totalPlans} color={pdfColors.blue} />
            <MetricCard label="إجمالي التوفير" value={`${fmt(totalSavings * exchangeRate)} ر.س`} color={pdfColors.gold} />
            <MetricCard label="متوسط التوفير" value={`${avgSavingsPercent}%`} color={pdfColors.red} />
          </>}
        />

        <div style={{ padding: '10px 24px' }}>
          {overallBest && (
            <div style={{ background: `linear-gradient(135deg, #E8FFF3, #f0faf5)`, border: `2px solid ${pdfColors.green}40`, borderRadius: '12px', padding: '16px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: pdfColors.green, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>★</div>
              <div>
                <div style={{ fontSize: '11px', color: pdfColors.muted, marginBottom: '2px' }}>التوصية — أفضل مورد عام</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: pdfColors.green }}>{overallBest.name}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>الأفضل سعراً في {overallBest.count} من أصل {overallBest.total} خطة</div>
              </div>
            </div>
          )}

          <SectionTitle color={pdfColors.accent}>
            <BuildingIcon className="icon-sm" /> تقييم أداء الموردين
          </SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: `1px solid ${pdfColors.border}`, marginBottom: '16px' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, background: pdfColors.accent, color: '#fff', textAlign: 'right' }}>المورد</th>
                <th style={{ ...thStyle, background: pdfColors.accent, color: '#fff' }}>الخطط</th>
                <th style={{ ...thStyle, background: pdfColors.accent, color: '#fff' }}>مرات الفوز</th>
                <th style={{ ...thStyle, background: pdfColors.accent, color: '#fff' }}>نسبة الفوز</th>
                <th style={{ ...thStyle, background: pdfColors.accent, color: '#fff' }}>إجمالي (ر.س)</th>
                <th style={{ ...thStyle, background: pdfColors.accent, color: '#fff' }}>التقييم</th>
              </tr>
            </thead>
            <tbody>
              {supplierStats.map((s, si) => (
                <tr key={s.id} style={{ background: si % 2 === 0 ? '#fafbff' : '#fff' }}>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '700' }}>{s.name}</td>
                  <td style={tdStyle}>{s.planCount}</td>
                  <td style={{ ...tdStyle, fontWeight: '700', color: pdfColors.green }}>{s.bestCount}</td>
                  <td style={tdStyle}><Badge color={s.winRate >= 50 ? pdfColors.green : s.winRate >= 25 ? pdfColors.orange : pdfColors.red}>{fmtPct(s.winRate)}%</Badge></td>
                  <td style={{ ...tdStyle, fontWeight: '600' }}>${fmt(s.totalSpend)}</td>
                  <td style={tdStyle}>
                    {s.winRate >= 50 ? <Badge color={pdfColors.green}>ممتاز</Badge> : s.winRate >= 25 ? <Badge color={pdfColors.orange}>جيد</Badge> : <Badge color={pdfColors.red}>ضعيف</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {bestPerProduct.length > 0 && (
            <>
              <SectionTitle color={pdfColors.green}>
                <StarIcon className="icon-sm" /> أفضل مورد لكل منتج
              </SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
                {bestPerProduct.map((bp, idx) => (
                  <div key={idx} style={{ background: '#f0faf5', border: `1px solid ${pdfColors.green}30`, borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: pdfColors.muted, marginBottom: '2px' }}>{bp.productName}</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: pdfColors.green }}>{bp.supplierName}</div>
                    <div style={{ fontSize: '10px', color: '#888' }}>الأفضل في {bp.planCount} {bp.planCount === 1 ? 'خطة' : 'خطط'}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          <SectionTitle color={pdfColors.orange}>
            <BarChartIcon className="icon-sm" /> تحليل التوفير لجميع المنتجات
          </SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: `1px solid ${pdfColors.border}` }}>
            <thead>
              <tr>
                {['المنتج','الخطة','أفضل مورد','أقل سعر ($)','أقل سعر (﷼)','المتوسط ($)','التوفير ($)','نسبة التوفير'].map((h) => (
                  <th key={h} style={{ ...thStyle, background: pdfColors.orange, color: '#fff', textAlign: h === 'المنتج' ? 'right' : 'center', fontSize: '11px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedAnalytics.map((group, gi) =>
                group.plans.map((a, pi) => (
                  <tr key={`${gi}-${pi}`} style={{ background: gi % 2 === 0 ? '#fff9f5' : '#fff', borderTop: pi === 0 ? `2px solid ${pdfColors.orange}30` : 'none' }}>
                    {pi === 0 && (
                      <td rowSpan={group.plans.length} style={{ ...tdStyle, textAlign: 'right', fontWeight: '700', fontSize: '12px', verticalAlign: 'middle', borderRight: `3px solid ${pdfColors.orange}`, background: gi % 2 === 0 ? '#fff3ec' : '#fffaf7' }}>
                        {a.productName}
                        <div style={{ fontSize: '9px', color: pdfColors.muted, fontWeight: '500', marginTop: '2px' }}>{group.plans.length} خطة</div>
                      </td>
                    )}
                    <td style={tdStyle}><Badge color={pdfColors.orange}>{a.planDuration}</Badge></td>
                    <td style={{ ...tdStyle, fontWeight: '600', color: pdfColors.green }}>{a.cheapest.supplierName !== '-' ? a.cheapest.supplierName : '—'}</td>
                    <td style={{ ...tdStyle, fontWeight: '700' }}>{a.cheapest.price > 0 ? `${fmt(a.cheapest.price * exchangeRate)} ر.س` : '—'}</td>
                    <td style={tdStyle}>{a.avgPrice > 0 ? `${fmt(a.avgPrice * exchangeRate)} ر.س` : '—'}</td>
                    <td style={{ ...tdStyle, color: pdfColors.orange, fontWeight: '600' }}>{fmt(a.savings * exchangeRate)} ر.س</td>
                    <td style={tdStyle}><Badge color={parseFloat(a.savingsPercent) > 10 ? pdfColors.red : pdfColors.orange}>{a.savingsPercent}%</Badge></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <ReportFooter />
      </div>
    );
  };

  const getIconEmoji = (iconId) => {
    const icon = FEATURE_ICONS.find(i => i.id === iconId);
    return icon ? icon.emoji : '✅';
  };
  const getBadgeLabel = (badgeId) => {
    const b = FEATURE_BADGES.find(x => x.id === badgeId);
    return b ? b.label : '';
  };
  const getBadgeColor = (badgeId) => {
    const b = FEATURE_BADGES.find(x => x.id === badgeId);
    return b ? b.color : pdfColors.accent;
  };

  const [featuresPdfTemplate, setFeaturesPdfTemplate] = useState('professional');
  const [featuresSelectedProductId, setFeaturesSelectedProductId] = useState('');

  const renderFeaturesReport = (product, template = 'professional') => {
    if (!product) return null;
    const showLogo = template === 'logo';
    const isSimple = template === 'simple';
    const headerColor = isSimple ? pdfColors.primary : pdfColors.accent;

    const totalFeatures = product.plans.reduce((s, plan) => s + (plan.features || []).filter(f => !f.isSeparator).length, 0);
    return (
      <div style={{ fontFamily: 'Tajawal, sans-serif', direction: 'rtl', background: '#fff', color: pdfColors.primary, minWidth: '700px', maxWidth: '900px' }}>
        <div style={{ background: `linear-gradient(135deg, ${headerColor} 0%, ${headerColor}bb 100%)`, color: '#fff', padding: '18px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '20px', margin: '0 0 3px', fontWeight: '800' }}>
                {showLogo && '🏪 '}تقرير مزايا المنتج — {formatProductName(product)}
              </h1>
              <p style={{ fontSize: '11px', margin: 0, opacity: 0.85 }}>وصف المنتج وقائمة المزايا لكل خطة</p>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '16px', fontWeight: '800' }}>متجر مفتاح</div>
              <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
                {new Date().toLocaleDateString('ar-SA-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '12px 24px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
            <MetricCard label="عدد الخطط" value={fmtInt(product.plans.length)} color={pdfColors.blue} />
            <MetricCard label="إجمالي المزايا" value={fmtInt(totalFeatures)} color={pdfColors.accent} />
            <MetricCard label="حالة الوصف" value={product.description ? 'مكتمل' : 'ناقص'} color={product.description ? pdfColors.green : pdfColors.orange} />
          </div>

          <div style={{ marginBottom: '20px', border: `1px solid ${pdfColors.border}`, borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ background: `${pdfColors.accent}10`, padding: '10px 16px', borderBottom: `1px solid ${pdfColors.border}` }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: pdfColors.accent }}>معلومات المنتج</span>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '11px', color: pdfColors.muted, fontWeight: '600', minWidth: '90px' }}>مدد الاشتراك</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {product.plans.map((plan, pi) => (
                    <span key={pi} style={{ background: `${pdfColors.blue}15`, color: pdfColors.blue, border: `1px solid ${pdfColors.blue}40`, borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: '600' }}>
                      {getDurationLabel(plan.durationId)}
                    </span>
                  ))}
                </div>
              </div>
              {(product.activationMethods || []).length > 0 && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '11px', color: pdfColors.muted, fontWeight: '600', minWidth: '90px' }}>طرق التفعيل</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(product.activationMethods || []).map(mId => {
                      const m = activationMethods.find(x => x.id === mId);
                      return m ? (
                        <span key={mId} style={{ background: '#f5f7fa', border: `1px solid ${pdfColors.border}`, borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: '500' }}>
                          {m.icon} {m.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              {product.storeUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '11px', color: pdfColors.muted, fontWeight: '600', minWidth: '90px' }}>رابط المتجر</span>
                  <span style={{ fontSize: '11px', color: pdfColors.blue, direction: 'ltr' }}>{product.storeUrl}</span>
                </div>
              )}
              {product.plans.some(plan => Object.values(plan.supplierWarranty || {}).some(v => v > 0)) && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '11px', color: pdfColors.muted, fontWeight: '600', minWidth: '90px', paddingTop: '4px' }}>الضمان</span>
                  <table style={{ borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '3px 10px', background: '#f5f7fa', border: `1px solid ${pdfColors.border}`, fontWeight: '600', textAlign: 'right' }}>المورد</th>
                        {product.plans.map((plan, pi) => (
                          <th key={pi} style={{ padding: '3px 10px', background: '#f5f7fa', border: `1px solid ${pdfColors.border}`, fontWeight: '600', textAlign: 'center' }}>{getDurationLabel(plan.durationId)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {suppliers.map(sup => (
                        <tr key={sup.id}>
                          <td style={{ padding: '3px 10px', border: `1px solid ${pdfColors.border}`, fontWeight: '500' }}>{sup.name}</td>
                          {product.plans.map((plan, pi) => {
                            const days = (plan.supplierWarranty || {})[sup.id] || 0;
                            return (
                              <td key={pi} style={{ padding: '3px 10px', border: `1px solid ${pdfColors.border}`, textAlign: 'center', color: days > 0 ? pdfColors.green : pdfColors.muted, fontWeight: days > 0 ? '600' : '400' }}>
                                {days > 0 ? `${days} يوم` : '—'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {product.description && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: pdfColors.accent, borderBottom: `2px solid ${pdfColors.accent}20`, paddingBottom: '8px', marginBottom: '10px' }}>
                وصف المنتج
              </h2>
              <p style={{ fontSize: '13px', lineHeight: '1.8', color: pdfColors.primary, background: pdfColors.light, padding: '14px 18px', borderRadius: '8px', border: `1px solid ${pdfColors.border}`, margin: 0 }}>
                {product.description}
              </p>
            </div>
          )}

          {product.plans.map((plan, pi) => {
            const features = (plan.features || []).filter(f => !f.isSeparator);
            const bestPrice = Math.min(...Object.values(plan.prices).filter(v => v > 0)) || 0;
            return (
              <div key={pi} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `${pdfColors.blue}08`, padding: '10px 16px', borderRadius: '8px', border: `1px solid ${pdfColors.blue}20`, marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: pdfColors.blue }}>{getDurationLabel(plan.durationId)}</span>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                    {bestPrice > 0 && <span style={{ color: pdfColors.green, fontWeight: '600' }}>أفضل سعر: ${fmt(bestPrice)} ({fmt(bestPrice * exchangeRate)} ر.س)</span>}
                    <span style={{ color: pdfColors.muted }}>{features.length} ميزة</span>
                  </div>
                </div>
                {features.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, width: '40px' }}>#</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>الميزة</th>
                        <th style={{ ...thStyle, width: '80px' }}>التصنيف</th>
                      </tr>
                    </thead>
                    <tbody>
                      {features.map((f, fi) => (
                        <tr key={fi}>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{getIconEmoji(f.icon)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '500' }}>{f.text || '—'}</td>
                          <td style={tdStyle}>
                            {f.badge ? <Badge color={getBadgeColor(f.badge)}>{getBadgeLabel(f.badge)}</Badge> : <span style={{ color: '#ccc' }}>—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ fontSize: '12px', color: pdfColors.muted, textAlign: 'center', padding: '16px' }}>لا توجد مزايا مُضافة لهذه الخطة</p>
                )}
              </div>
            );
          })}

          {product.plans.length >= 2 && (
            <div style={{ marginTop: '24px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: pdfColors.accent, borderBottom: `2px solid ${pdfColors.accent}20`, paddingBottom: '8px', marginBottom: '10px' }}>
                مقارنة المزايا بين الخطط
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>الميزة</th>
                    {product.plans.map((plan, pi) => (
                      <th key={pi} style={thStyle}>{getDurationLabel(plan.durationId)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const allFeatureTexts = [...new Set(product.plans.flatMap(plan => (plan.features || []).filter(f => !f.isSeparator && f.text.trim()).map(f => f.text)))];
                    return allFeatureTexts.map((text, ti) => (
                      <tr key={ti}>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '500' }}>{text}</td>
                        {product.plans.map((plan, pi) => {
                          const has = (plan.features || []).some(f => f.text === text);
                          return <td key={pi} style={{ ...tdStyle, color: has ? pdfColors.green : '#ddd', fontSize: '16px' }}>{has ? '✅' : '—'}</td>;
                        })}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ background: pdfColors.light, padding: '12px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `2px solid ${pdfColors.border}` }}>
          <span style={{ fontSize: '11px', color: pdfColors.muted }}>
            متجر مفتاح — تقرير مزايا المنتج — {new Date().toLocaleDateString('ar-SA-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
          <span style={{ fontSize: '10px', color: '#bbb' }}>miftahdigital.store</span>
        </div>
      </div>
    );
  };

  const addFeaturesPdfFooter = (doc) => {
    const pageCount = doc.getNumberOfPages();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('متجر Miftah — miftahdigital.store', pageW / 2, pageH - 5, { align: 'center' });
      doc.setFontSize(7);
      doc.text(`${i} / ${pageCount}`, pageW - 10, pageH - 5, { align: 'right' });
      doc.setDrawColor(220, 220, 220);
      doc.line(10, pageH - 9, pageW - 10, pageH - 9);
      doc.line(10, 3, pageW - 10, 3);
    }
  };

  const generateFeaturesPDF = async (key, filename) => {
    setGenerating(key);
    try {
      await new Promise(r => setTimeout(r, 250));
      const element = reportRef.current;
      if (!element) return;
      const canvasScale = 2;
      const canvas = await html2canvas(element, { scale: canvasScale, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 8;
      const footerSpace = 12;
      const usableW = pageW - margin * 2;
      const usableH = pageH - margin - footerSpace;
      const scale = usableW / canvas.width;
      const scaledH = canvas.height * scale;
      if (scaledH <= usableH) {
        const imgData = canvas.toDataURL('image/png');
        const xOff = (pageW - canvas.width * scale) / 2;
        doc.addImage(imgData, 'PNG', xOff, margin, canvas.width * scale, scaledH);
      } else {
        sliceCanvasSmartly(canvas, element, doc, margin, usableW, usableH, canvasScale);
      }
      addFeaturesPdfFooter(doc);
      const safeName = filename.replace(/[<>:"/\\|?*]/g, '_').trim() || 'report.pdf';
      doc.save(safeName);
      addNotification({ type: 'success', title: 'تم تصدير تقرير المزايا', description: `تم إنشاء وتحميل "${safeName}"`, category: 'operations', actionTab: 'reports' });
    } catch (e) {
      alert('حدث خطأ أثناء إنشاء التقرير: ' + e.message);
      addNotification({ type: 'error', title: 'فشل تصدير التقرير', description: e.message, category: 'operations', actionTab: 'reports' });
    } finally {
      setGenerating(null);
    }
  };

  const generateAllFeaturesPDFs = async () => {
    const productsWithFeatures = products.filter(p => p.description || p.plans.some(plan => plan.features?.length > 0));
    if (productsWithFeatures.length === 0) return;
    setGenerating('all-features');
    try {
      for (const product of productsWithFeatures) {
        setGenerating(`features-${product.id}`);
        await new Promise(r => setTimeout(r, 300));
        const element = reportRef.current;
        if (!element) continue;
        await new Promise(r => setTimeout(r, 250));
        const canvasScale = 2;
        const canvas = await html2canvas(element, { scale: canvasScale, useCORS: true, backgroundColor: '#ffffff', logging: false });
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 8;
        const footerSpace = 12;
        const usableW = pageW - margin * 2;
        const usableH = pageH - margin - footerSpace;
        const scale = usableW / canvas.width;
        const scaledH = canvas.height * scale;
        if (scaledH <= usableH) {
          const imgData = canvas.toDataURL('image/png');
          const xOff = (pageW - canvas.width * scale) / 2;
          doc.addImage(imgData, 'PNG', xOff, margin, canvas.width * scale, scaledH);
        } else {
          sliceCanvasSmartly(canvas, element, doc, margin, usableW, usableH, canvasScale);
        }
        addFeaturesPdfFooter(doc);
        const safeName = `مزايا_${product.name}_مفتاح.pdf`.replace(/[<>:"/\\|?*]/g, '_').trim();
        doc.save(safeName);
      }
      addNotification({ type: 'success', title: 'تم تصدير جميع تقارير المزايا', description: `تم إنشاء ${productsWithFeatures.length} ملف PDF`, category: 'operations', actionTab: 'reports' });
    } catch (e) {
      alert('حدث خطأ أثناء إنشاء التقارير: ' + e.message);
      addNotification({ type: 'error', title: 'فشل تصدير التقارير', description: e.message, category: 'operations', actionTab: 'reports' });
    } finally {
      setGenerating(null);
    }
  };

  /* ── Final Prices PDF Report ── */
  const renderFinalPricesReport = (productFilter) => {
    const targetProducts = productFilter ? [productFilter] : products;
    const totalPlansCount = targetProducts.reduce((s, p) => s + p.plans.length, 0);
    let setPricesCount = 0;
    let marginSum = 0, marginCount = 0;

    const rows = [];
    targetProducts.forEach(prod => {
      prod.plans.forEach(plan => {
        const key = `${prod.id}_${plan.id}`;
        const savedConfig = pricingData[prod.id] || {};
        const supplierId = savedConfig.primarySupplierId || (() => {
          let minP = Infinity, bestId = null;
          suppliers.forEach(s => { const p = plan.prices[s.id] || 0; if (p > 0 && p < minP) { minP = p; bestId = s.id; } });
          return bestId;
        })();
        const baseSAR = supplierId ? (plan.prices[supplierId] || 0) * exchangeRate : 0;
        const totalCost = rpComputeTotalCost(baseSAR, costs);
        const suggested  = rpComputeSuggested(baseSAR, costs);
        const finalPrice = finalPrices[key];
        const officialSAR = (plan.officialPriceUsd || 0) * exchangeRate;
        const isSet = finalPrice !== undefined && finalPrice > 0;
        const margin = isSet ? ((finalPrice - totalCost) / finalPrice) * 100 : null;
        const statusLabel = isSet ? rpGetStatusLabel(finalPrice, totalCost, suggested) : null;
        const diffOfficial = isSet && officialSAR > 0 ? finalPrice - officialSAR : null;
        if (isSet) { setPricesCount++; if (margin !== null) { marginSum += margin; marginCount++; } }
        rows.push({
          productName: formatProductName(prod),
          planLabel: getDurationLabel(plan.durationId),
          baseSAR, totalCost, suggested, finalPrice, officialSAR, margin, statusLabel, diffOfficial, isSet,
        });
      });
    });

    const avgMargin = marginCount > 0 ? marginSum / marginCount : 0;
    const completeProducts = targetProducts.filter(prod =>
      prod.plans.every(plan => finalPrices[`${prod.id}_${plan.id}`] !== undefined && finalPrices[`${prod.id}_${plan.id}`] > 0)
    ).length;

    const groupedRows = [];
    let curGroup = null;
    rows.forEach(r => {
      if (!curGroup || curGroup.productName !== r.productName) {
        curGroup = { productName: r.productName, rows: [] };
        groupedRows.push(curGroup);
      }
      curGroup.rows.push(r);
    });

    return (
      <div style={{ fontFamily: 'Tajawal, sans-serif', direction: 'rtl', background: '#fff', color: pdfColors.primary, minWidth: '900px' }}>
        <div style={{ background: `linear-gradient(135deg, ${pdfColors.accent} 0%, ${pdfColors.accent}bb 100%)`, color: '#fff', padding: '18px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '20px', margin: '0 0 3px 0', fontWeight: '800' }}>
              💰 تقرير الأسعار النهائية{productFilter ? ` — ${formatProductName(productFilter)}` : ''}
            </h1>
            <p style={{ fontSize: '11px', margin: 0, opacity: 0.85 }}>
              {setPricesCount} خطة مسعّرة من {totalPlansCount} — سعر الصرف: 1$ = {exchangeRate} ﷼
            </p>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '16px', fontWeight: '800' }}>متجر مفتاح 🗝️</div>
            <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
              {new Date().toLocaleDateString('ar-SA-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        <div style={{ padding: '10px 28px', background: '#fff', borderBottom: `2px solid ${pdfColors.border}`, display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <MetricCard label="خطط مسعّرة" value={`${setPricesCount}/${totalPlansCount}`} color={pdfColors.accent} />
          <MetricCard label="متوسط هامش الربح" value={`${fmtPct(avgMargin)}%`} color={avgMargin >= 0 ? pdfColors.green : pdfColors.red} />
          <MetricCard label="منتجات مكتملة" value={`${completeProducts}/${targetProducts.length}`} color={pdfColors.blue} />
          <MetricCard label="خطط غير مسعّرة" value={totalPlansCount - setPricesCount} color={totalPlansCount - setPricesCount > 0 ? pdfColors.orange : pdfColors.green} />
        </div>

        <div style={{ padding: '10px 24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: pdfColors.accent, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: `2px solid ${pdfColors.accent}20`, paddingBottom: '6px' }}>
            <CurrencyIcon style={{ width: 18, height: 18 }} /> جدول الأسعار النهائية التفصيلي
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: `1px solid ${pdfColors.border}` }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: 'right', background: '#f5f5ff', minWidth: '110px' }}>المنتج</th>
                <th style={{ ...thStyle, background: '#f5f5ff' }}>الخطة</th>
                <th style={{ ...thStyle, background: '#f5f5ff' }}>سعر المورد</th>
                <th style={{ ...thStyle, background: '#f5f5ff' }}>التكلفة الإجمالية</th>
                <th style={{ ...thStyle, background: '#f5f5ff' }}>السعر المقترح</th>
                <th style={{ ...thStyle, background: pdfColors.accent, color: '#fff', minWidth: '100px' }}>سعر البيع النهائي</th>
                <th style={{ ...thStyle, background: pdfColors.blue, color: '#fff', minWidth: '90px' }}>السعر الرسمي</th>
                <th style={{ ...thStyle, background: '#f5f5ff' }}>الهامش</th>
                <th style={{ ...thStyle, background: '#f5f5ff' }}>التقييم</th>
                <th style={{ ...thStyle, background: '#f5f5ff' }}>الفرق عن الرسمي</th>
              </tr>
            </thead>
            <tbody>
              {groupedRows.map((group, gi) =>
                group.rows.map((row, ri) => (
                  <tr key={`${gi}-${ri}`} style={{ background: gi % 2 === 0 ? '#f8f8ff' : '#fff' }}>
                    {ri === 0 && (
                      <td rowSpan={group.rows.length} style={{ ...tdStyle, textAlign: 'right', fontWeight: '700', fontSize: '12px', verticalAlign: 'middle', borderRight: `3px solid ${pdfColors.accent}` }}>
                        {group.productName}
                        <div style={{ fontSize: '9px', color: pdfColors.muted, fontWeight: '500', marginTop: '2px' }}>{group.rows.length} خطة</div>
                      </td>
                    )}
                    <td style={tdStyle}><span style={{ background: `${pdfColors.accent}15`, color: pdfColors.accent, padding: '2px 8px', borderRadius: '8px', fontWeight: '600' }}>{row.planLabel}</span></td>
                    <td style={tdStyle}>{row.baseSAR > 0 ? `${fmt(row.baseSAR)} ر.س` : <span style={{ color: '#bbb' }}>—</span>}</td>
                    <td style={tdStyle}>{row.totalCost > 0 ? `${fmt(row.totalCost)} ر.س` : <span style={{ color: '#bbb' }}>—</span>}</td>
                    <td style={tdStyle}>{row.suggested > 0 ? `${fmt(row.suggested)} ر.س` : <span style={{ color: '#bbb' }}>—</span>}</td>
                    <td style={{ ...tdStyle, fontWeight: '800', fontSize: '13px', background: row.isSet ? `${pdfColors.accent}12` : 'transparent', color: row.isSet ? pdfColors.accent : '#bbb' }}>
                      {row.isSet ? `${fmt(row.finalPrice)} ر.س` : '—'}
                    </td>
                    <td style={{ ...tdStyle, fontStyle: 'italic', color: pdfColors.blue }}>
                      {row.officialSAR > 0 ? (
                        <div>
                          <div style={{ fontWeight: '600' }}>{fmt(row.officialSAR)} ر.س</div>
                          <div style={{ fontSize: '9px', color: pdfColors.muted, fontStyle: 'normal' }}>مقارنة</div>
                        </div>
                      ) : <span style={{ color: '#bbb', fontStyle: 'normal' }}>—</span>}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: '700', color: row.margin !== null ? (row.margin >= 0 ? pdfColors.green : pdfColors.red) : '#bbb' }}>
                      {row.margin !== null ? `${fmtPct(row.margin)}%` : '—'}
                    </td>
                    <td style={{ ...tdStyle }}>
                      {row.statusLabel ? (
                        <span style={{ background: `${rpStatusColor(row.statusLabel)}18`, color: rpStatusColor(row.statusLabel), padding: '2px 8px', borderRadius: '8px', fontWeight: '600', fontSize: '10px' }}>
                          {row.statusLabel}
                        </span>
                      ) : <span style={{ color: '#bbb', fontSize: '10px' }}>غير محدد</span>}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: '600' }}>
                      {row.diffOfficial !== null ? (
                        <span style={{ color: row.diffOfficial > 0 ? pdfColors.green : row.diffOfficial < 0 ? pdfColors.red : '#888' }}>
                          {row.diffOfficial > 0 ? '+' : ''}{fmt(row.diffOfficial)} ر.س
                        </span>
                      ) : <span style={{ color: '#bbb' }}>—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {rows.some(r => !r.isSet) && (
            <div style={{ marginTop: '14px', padding: '10px 16px', background: '#FFF9EC', border: `1px solid ${pdfColors.orange}30`, borderRadius: '8px', fontSize: '11px', color: pdfColors.orange, fontWeight: '600' }}>
              ⚠️ {rows.filter(r => !r.isSet).length} خطة لم تُسعَّر بعد — يرجى تحديد أسعار البيع لها من صفحة إدارة التسعير &rarr; الأسعار النهائية
            </div>
          )}
        </div>
        <ReportFooter />
      </div>
    );
  };

  const renderHiddenContent = () => {
    if (generating === 'full')       return renderFullReport();
    if (generating === 'comparison') return renderComparisonReport();
    if (generating === 'summary')    return renderSummaryReport();
    if (generating === 'final-prices-all') return renderFinalPricesReport(null);
    if (generating?.startsWith('final-prices-prod-')) {
      const pid = parseInt(generating.replace('final-prices-prod-', ''));
      return renderFinalPricesReport(products.find(p => p.id === pid) || null);
    }
    if (generating?.startsWith('all-products-')) {
      const pid = parseInt(generating.replace('all-products-', ''));
      return renderProductReport(products.find((p) => p.id === pid));
    }
    if (generating?.startsWith('product-')) {
      const pid = parseInt(generating.replace('product-', ''));
      return renderProductReport(products.find((p) => p.id === pid));
    }
    if (generating?.startsWith('supplier-')) {
      const sid = generating.replace('supplier-', '');
      return renderSupplierReport(sid);
    }
    if (generating?.startsWith('features-')) {
      const pid = parseInt(generating.replace('features-', ''));
      return renderFeaturesReport(products.find((p) => p.id === pid), featuresPdfTemplate);
    }
    return null;
  };

  const selectedProduct = products.find((p) => p.id === parseInt(selectedProductId));

  return (
    <div className="reports-page" dir="rtl">
      <div className="reports-page-header">
        <div className="reports-page-header-icon">
          <BarChartIcon className="icon-xl" />
        </div>
        <div>
          <h2 className="reports-title">التقارير وتصدير PDF</h2>
          <p className="reports-subtitle">إنشاء تقارير احترافية وتحليل بيانات المنتجات والموردين</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <div className="stat-icon"><PackageIcon /></div>
          <div className="stat-value">{products.length}</div>
          <div className="stat-label">عدد المنتجات</div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-icon"><BuildingIcon /></div>
          <div className="stat-value">{suppliers.length}</div>
          <div className="stat-label">عدد الموردين</div>
        </div>
        <div className="stat-card stat-purple">
          <div className="stat-icon"><ClipboardIcon /></div>
          <div className="stat-value">{totalPlans}</div>
          <div className="stat-label">إجمالي الخطط</div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-icon"><CurrencyIcon /></div>
          <div className="stat-value">{avgSavingsPercent}%</div>
          <div className="stat-label">متوسط التوفير</div>
        </div>
      </div>

      <div className="report-section-tabs">
        {[
          { id: 'global',   label: <span className="flex-row gap-2 align-center"><GlobeIcon className="icon-sm" /> تقارير عامة</span> },
          { id: 'product',  label: <span className="flex-row gap-2 align-center"><PackageIcon className="icon-sm" /> تقرير منتج</span> },
          { id: 'supplier', label: <span className="flex-row gap-2 align-center"><BuildingIcon className="icon-sm" /> تقرير مورد</span> },
          { id: 'features',     label: <span className="flex-row gap-2 align-center"><FileTextIcon className="icon-sm" /> تقرير المزايا</span> },
          { id: 'final-prices', label: <span className="flex-row gap-2 align-center"><CurrencyIcon className="icon-sm" /> الأسعار النهائية</span> },
          { id: 'stats',        label: <span className="flex-row gap-2 align-center"><BarChartIcon className="icon-sm" /> الإحصائيات</span> },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`report-section-tab ${activeSection === tab.id ? 'report-section-tab-active' : ''}`}
            onClick={() => setActiveSection(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSection === 'global' && (
        <div className="report-cards">
          <div className="report-card">
            <div className="report-card-header blue-header">
              <span className="report-icon"><ClipboardIcon /></span><h3>التقرير الكامل</h3>
            </div>
            <p>جميع المنتجات وخططها مع أسعار كل مورد بالدولار والريال وأفضل الموردين</p>
            <button className="btn-generate" onClick={() => generatePDF('full', 'تقرير_كامل_مفتاح.pdf', true)} disabled={!!generating}>
              {generating === 'full' ? <><span className="spinner" /> جاري الإنشاء...</> : <><DownloadIcon className="icon-sm" /> تحميل PDF</>}
            </button>
          </div>
          <div className="report-card">
            <div className="report-card-header green-header">
              <span className="report-icon"><ScaleIcon /></span><h3>مقارنة الموردين</h3>
            </div>
            <p>أفضل سعر لكل خطة مع نسبة التوفير وتقييم أداء كل مورد ونسبة فوزه</p>
            <button className="btn-generate green-btn" onClick={() => generatePDF('comparison', 'مقارنة_الموردين_مفتاح.pdf')} disabled={!!generating}>
              {generating === 'comparison' ? <><span className="spinner" /> جاري الإنشاء...</> : <><DownloadIcon className="icon-sm" /> تحميل PDF</>}
            </button>
          </div>
          <div className="report-card">
            <div className="report-card-header purple-header">
              <span className="report-icon"><TrendingUpIcon /></span><h3>الملخص التنفيذي</h3>
            </div>
            <p>تقرير شامل مع توصيات وتقييم الموردين وتحليل التوفير لكل منتج وخطة</p>
            <button className="btn-generate purple-btn" onClick={() => generatePDF('summary', 'الملخص_التنفيذي_مفتاح.pdf')} disabled={!!generating}>
              {generating === 'summary' ? <><span className="spinner" /> جاري الإنشاء...</> : <><DownloadIcon className="icon-sm" /> تحميل PDF</>}
            </button>
          </div>
        </div>
      )}

      {activeSection === 'product' && (
        <div className="individual-report-panel">
          <div className="individual-report-header">
            <span className="individual-icon"><PackageIcon /></span>
            <div>
              <h3>تقرير منتج منفرد</h3>
              <p>اختر منتجاً لتصدير تقرير شامل بجميع خططه وأسعار الموردين وتحليل التوفير</p>
            </div>
          </div>
          <div className="individual-select-row">
            <select
              className="individual-select"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              dir="rtl"
            >
              <option value="">— اختر منتجاً —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{formatProductName(p)} ({p.plans.length} خطة)</option>
              ))}
            </select>
            {selectedProductId && (
              <button
                className="btn-generate"
                disabled={!!generating}
                onClick={() => {
                  const p = products.find((p) => p.id === parseInt(selectedProductId));
                  if (p) generatePDF(`product-${p.id}`, `تقرير_${p.name}_مفتاح.pdf`);
                }}
              >
                {generating?.startsWith('product-') ? <><span className="spinner" /> جاري الإنشاء...</> : <><DownloadIcon className="icon-sm" /> تصدير PDF</>}
              </button>
            )}
          </div>

          {selectedProduct && (
            <div className="ppc-preview-card">
              <div className="ppc-name">{formatProductName(selectedProduct)}</div>
              <div className="ppc-meta">
                <span className="flex-row gap-1 align-center"><ClipboardIcon className="icon-xs" /> {selectedProduct.plans.length} خطة</span>
                <span className="flex-row gap-1 align-center"><BuildingIcon className="icon-xs" /> {suppliers.length} مورد</span>
                {selectedProduct.activationMethods?.length > 0 && (
                  <span className="flex-row gap-1 align-center"><ZapIcon className="icon-xs" /> {selectedProduct.activationMethods.length} طرق تفعيل</span>
                )}
              </div>
              {selectedProduct.storeUrl && (
                <div className="ppc-url">
                  <GlobeIcon className="icon-xs" />
                  <span dir="ltr">{selectedProduct.storeUrl}</span>
                </div>
              )}
              <div className="ppc-plans">
                {selectedProduct.plans.map((plan) => {
                  let minP = Infinity, bestName = '';
                  suppliers.forEach((s) => { const p = plan.prices[s.id] || 0; if (p > 0 && p < minP) { minP = p; bestName = s.name; } });
                  return (
                    <div key={plan.id} className="ppc-plan-row">
                      <span className="ppc-duration">{getDurationLabel(plan.durationId)}</span>
                      {minP < Infinity ? (
                        <span className="ppc-best">أفضل: {bestName} — ${fmt(minP)}</span>
                      ) : (
                        <span className="ppc-empty">لا توجد أسعار</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bulk-export-divider">
            <div className="bulk-export-line"></div>
            <span className="bulk-export-text">أو</span>
            <div className="bulk-export-line"></div>
          </div>

          <div className="bulk-export-card">
            <div className="bulk-export-info">
              <h4>تصدير جميع المنتجات</h4>
              <p>تصدير تقرير لكل منتج في ملف PDF منفصل ({products.length} ملف)</p>
            </div>
            <button
              className="btn-generate bulk"
              disabled={!!generating || products.length === 0}
              onClick={generateAllProductPDFs}
            >
              {generating?.startsWith('all-products') ? (
                <><span className="spinner" /> جاري التصدير ({products.findIndex(p => `all-products-${p.id}` === generating) + 1}/{products.length})...</>
              ) : (
                <><DownloadIcon className="icon-sm" /> تصدير الكل ({products.length} ملف)</>
              )}
            </button>
          </div>
        </div>
      )}

      {activeSection === 'supplier' && (
        <div className="individual-report-panel">
          <div className="individual-report-header">
            <span className="individual-icon"><BuildingIcon /></span>
            <div>
              <h3>تقرير مورد منفرد</h3>
              <p>اختر مورداً واحداً أو صدّر تقريراً لجميع الموردين دفعة واحدة</p>
            </div>
          </div>
          <div className="individual-select-row">
            <select
              className="individual-select"
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              dir="rtl"
            >
              <option value="all">جميع الموردين</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button
              className="btn-generate green-btn"
              disabled={!!generating}
              onClick={() => {
                const name = selectedSupplierId === 'all' ? 'جميع_الموردين' : suppliers.find((s) => s.id === parseInt(selectedSupplierId))?.name || 'مورد';
                generatePDF(`supplier-${selectedSupplierId}`, `تقرير_${name}_مفتاح.pdf`, selectedSupplierId === 'all');
              }}
            >
              {generating?.startsWith('supplier-') ? <><span className="spinner" /> جاري الإنشاء...</> : <><DownloadIcon className="icon-sm" /> تصدير PDF</>}
            </button>
          </div>

          <div className="supplier-cards-preview">
            {suppliers.map((s) => {
              let planCount = 0, bestCount = 0;
              products.forEach((product) => {
                product.plans.forEach((plan) => {
                  const p = plan.prices[s.id] || 0;
                  if (p > 0) {
                    planCount++;
                    let minP = Infinity;
                    suppliers.forEach((sup) => { const sp = plan.prices[sup.id] || 0; if (sp > 0 && sp < minP) minP = sp; });
                    if (p === minP) bestCount++;
                  }
                });
              });
              const isSelected = selectedSupplierId === 'all' || selectedSupplierId === String(s.id);
              return (
                <div
                  key={s.id}
                  className={`scp-card ${isSelected ? 'scp-card-active' : ''}`}
                  onClick={() => setSelectedSupplierId(String(s.id))}
                >
                  <div className="scp-avatar">{s.name.charAt(0)}</div>
                  <div className="scp-name">{s.name}</div>
                  <div className="scp-stats">
                    <span className="flex-row gap-1 align-center"><ClipboardIcon className="icon-xs" /> {planCount} خطة</span>
                    <span className="flex-row gap-1 align-center"><StarIcon className="icon-xs" /> {bestCount} الأفضل</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSection === 'features' && (
        <div className="individual-report-panel">
          <div className="individual-report-header">
            <span className="individual-icon"><FileTextIcon /></span>
            <div>
              <h3>تقرير مزايا المنتج</h3>
              <p>اختر منتجاً لتصدير تقرير مزاياه مع وصفه وقائمة المزايا لكل خطة — أو صدّر جميع المنتجات دفعة واحدة</p>
            </div>
          </div>
          <div className="individual-select-row">
            <select
              className="individual-select"
              value={featuresSelectedProductId}
              onChange={(e) => setFeaturesSelectedProductId(e.target.value)}
              dir="rtl"
            >
              <option value="">— اختر منتجاً —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {formatProductName(p)} — {p.description ? '✓ وصف' : '⚠️ بدون وصف'} — {p.plans.reduce((s, plan) => s + (plan.features || []).filter(f => !f.isSeparator).length, 0)} ميزة
                </option>
              ))}
            </select>
            <select
              className="individual-select"
              value={featuresPdfTemplate}
              onChange={(e) => setFeaturesPdfTemplate(e.target.value)}
              dir="rtl"
              style={{ maxWidth: '160px' }}
            >
              <option value="simple">بسيط</option>
              <option value="professional">احترافي</option>
              <option value="logo">مع لوجو</option>
            </select>
            {featuresSelectedProductId && (
              <button
                className="btn-generate"
                disabled={!!generating}
                onClick={() => {
                  const p = products.find(pr => pr.id === parseInt(featuresSelectedProductId));
                  if (p) generateFeaturesPDF(`features-${p.id}`, `مزايا_${p.name}_مفتاح.pdf`);
                }}
              >
                {generating?.startsWith('features-') ? <><span className="spinner" /> جاري الإنشاء...</> : <><DownloadIcon className="icon-sm" /> تصدير PDF</>}
              </button>
            )}
            <button
              className="btn-generate green-btn"
              disabled={!!generating}
              onClick={generateAllFeaturesPDFs}
            >
              {generating === 'all-features' ? <><span className="spinner" /> جاري التصدير...</> : <><DownloadIcon className="icon-sm" /> تصدير الكل</>}
            </button>
          </div>

          {featuresSelectedProductId && (() => {
            const previewProduct = products.find(p => p.id === parseInt(featuresSelectedProductId));
            if (!previewProduct) return null;
            return (
              <div className="features-pdf-preview-wrapper">
                <div className="features-pdf-preview-label">معاينة شكل التقرير</div>
                <div className="features-pdf-preview-scroll">
                  {renderFeaturesReport(previewProduct, featuresPdfTemplate)}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {activeSection === 'final-prices' && (() => {
        const totalFpPlans = products.reduce((s, p) => s + p.plans.length, 0);
        const setPrices = Object.keys(finalPrices).filter(k => finalPrices[k] > 0).length;
        const completeProds = products.filter(p => p.plans.every(pl => finalPrices[`${p.id}_${pl.id}`] > 0)).length;
        let mgSum = 0, mgCnt = 0;
        products.forEach(prod => {
          prod.plans.forEach(plan => {
            const key = `${prod.id}_${plan.id}`;
            const fp = finalPrices[key];
            if (!fp) return;
            const savedConfig = pricingData[prod.id] || {};
            const supplierId = savedConfig.primarySupplierId || (() => {
              let minP = Infinity, bestId = null;
              suppliers.forEach(s => { const p = plan.prices[s.id] || 0; if (p > 0 && p < minP) { minP = p; bestId = s.id; } });
              return bestId;
            })();
            const baseSAR = supplierId ? (plan.prices[supplierId] || 0) * exchangeRate : 0;
            const tc = rpComputeTotalCost(baseSAR, costs);
            if (fp > 0) { mgSum += ((fp - tc) / fp) * 100; mgCnt++; }
          });
        });
        const avgMargin = mgCnt > 0 ? mgSum / mgCnt : 0;
        const selectedFpProduct = products.find(p => p.id === parseInt(finalPricesProductId));

        return (
          <div className="individual-report-panel">
            <div className="individual-report-header">
              <span className="individual-icon"><CurrencyIcon /></span>
              <div>
                <h3>تقرير الأسعار النهائية</h3>
                <p>أسعار البيع المحفوظة من جدول التسعير النهائي مع السعر الرسمي للمقارنة — قابل للتصدير كملف PDF</p>
              </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: '16px' }}>
              <div className="stat-card stat-purple">
                <div className="stat-icon"><CurrencyIcon /></div>
                <div className="stat-value">{setPrices}/{totalFpPlans}</div>
                <div className="stat-label">خطط مسعّرة</div>
              </div>
              <div className={`stat-card ${avgMargin >= 0 ? 'stat-green' : 'stat-orange'}`}>
                <div className="stat-icon"><TrendingUpIcon /></div>
                <div className="stat-value">{fmtPct(avgMargin)}%</div>
                <div className="stat-label">متوسط هامش الربح</div>
              </div>
              <div className="stat-card stat-blue">
                <div className="stat-icon"><CheckCircleIcon /></div>
                <div className="stat-value">{completeProds}/{products.length}</div>
                <div className="stat-label">منتجات مكتملة</div>
              </div>
              <div className={`stat-card ${totalFpPlans - setPrices > 0 ? 'stat-orange' : 'stat-green'}`}>
                <div className="stat-icon"><ClipboardIcon /></div>
                <div className="stat-value">{totalFpPlans - setPrices}</div>
                <div className="stat-label">خطط غير مسعّرة</div>
              </div>
            </div>

            {setPrices === 0 && (
              <div style={{ padding: '14px 18px', background: '#FFF9EC', border: '1px solid #E68A0030', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', color: '#B86800', fontWeight: '600' }}>
                ⚠️ لا توجد أسعار نهائية محفوظة بعد. انتقل إلى صفحة <strong>إدارة التسعير ← الأسعار النهائية</strong>، أدخل أسعار البيع واضغط "حفظ"، ثم عُد هنا لتصدير التقرير.
              </div>
            )}

            <div className="individual-select-row">
              <select className="individual-select" value={finalPricesProductId} onChange={e => setFinalPricesProductId(e.target.value)} dir="rtl">
                <option value="">— جميع المنتجات —</option>
                {products.map(p => {
                  const pSet = p.plans.filter(pl => finalPrices[`${p.id}_${pl.id}`] > 0).length;
                  return <option key={p.id} value={p.id}>{formatProductName(p)} ({pSet}/{p.plans.length} مسعّر)</option>;
                })}
              </select>
              <button
                className="btn-generate"
                disabled={!!generating || setPrices === 0}
                onClick={() => {
                  if (finalPricesProductId) {
                    generatePDF(`final-prices-prod-${finalPricesProductId}`, `أسعار_نهائية_${selectedFpProduct?.name || 'منتج'}_مفتاح.pdf`, true);
                  } else {
                    generatePDF('final-prices-all', 'أسعار_نهائية_كاملة_مفتاح.pdf', true);
                  }
                }}
              >
                {generating?.startsWith('final-prices') ? <><span className="spinner" /> جاري الإنشاء...</> : <><DownloadIcon className="icon-sm" /> تصدير PDF</>}
              </button>
            </div>

            {setPrices > 0 && (
              <div className="fpm-accordion-list" style={{ marginTop: '16px' }}>
                {(() => {
                  const targetProds = selectedFpProduct ? [selectedFpProduct] : products;
                  return targetProds.map(prod => {
                    const setPricesCount = prod.plans.filter(pl => finalPrices[`${prod.id}_${pl.id}`] > 0).length;
                    const allSet = setPricesCount === prod.plans.length && prod.plans.length > 0;
                    const noneSet = setPricesCount === 0;
                    const isExpanded = fpExpandedIds.has(prod.id);
                    const toggleFp = () => setFpExpandedIds(prev => {
                      const next = new Set(prev);
                      next.has(prod.id) ? next.delete(prod.id) : next.add(prod.id);
                      return next;
                    });
                    return (
                      <div key={prod.id} className={`fpm-accordion-item ${isExpanded ? 'fpm-accordion-open' : ''}`}>
                        <button className="fpm-accordion-header" onClick={toggleFp} type="button">
                          <div className="fpm-acc-left">
                            <div className={`fpm-acc-chevron ${isExpanded ? 'open' : ''}`}>
                              <ChevronDownIcon className="icon-sm" />
                            </div>
                            <div className="fpm-acc-product-info">
                              <span className="fpm-acc-product-name">{formatProductName(prod)}</span>
                              <div className="fpm-acc-meta">
                                <span className="fpm-acc-plans-pill">{prod.plans.length} خطة</span>
                                <span className={`fpm-acc-status-pill ${allSet ? 'fpm-acc-status-done' : noneSet ? 'fpm-acc-status-none' : 'fpm-acc-status-partial'}`}>
                                  {setPricesCount}/{prod.plans.length} مسعّر{allSet ? ' ✓' : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>

                        <div className="fpm-accordion-body">
                          <div className="fpm-plans-header fp-report-grid">
                            <span className="fpm-plans-col-head fpm-ph-duration">الخطة</span>
                            <span className="fpm-plans-col-head fpm-ph-price">سعر المورد</span>
                            <span className="fpm-plans-col-head fpm-ph-price">السعر الرسمي</span>
                            <span className="fpm-plans-col-head fpm-ph-price">التكلفة</span>
                            <span className="fpm-plans-col-head fpm-ph-price fp-report-ph-final">سعر البيع النهائي</span>
                            <span className="fpm-plans-col-head fpm-ph-margin">الهامش</span>
                            <span className="fpm-plans-col-head fpm-ph-status">التقييم</span>
                          </div>

                          {prod.plans.map(plan => {
                            const key = `${prod.id}_${plan.id}`;
                            const savedConfig = pricingData[prod.id] || {};
                            const supplierId = savedConfig.primarySupplierId || (() => {
                              let minP = Infinity, bestId = null;
                              suppliers.forEach(s => { const p = plan.prices[s.id] || 0; if (p > 0 && p < minP) { minP = p; bestId = s.id; } });
                              return bestId;
                            })();
                            const baseSAR = supplierId ? (plan.prices[supplierId] || 0) * exchangeRate : 0;
                            const tc = rpComputeTotalCost(baseSAR, costs);
                            const sg = rpComputeSuggested(baseSAR, costs);
                            const fp = finalPrices[key];
                            const officialSAR = (plan.officialPriceUsd || 0) * exchangeRate;
                            const isSet = fp !== undefined && fp > 0;
                            const margin = isSet ? ((fp - tc) / fp) * 100 : null;
                            const statusLabel = isSet ? rpGetStatusLabel(fp, tc, sg) : null;
                            const diffFromOfficial = officialSAR > 0 && isSet ? fp - officialSAR : null;
                            return (
                              <div key={key} className="fpm-plan-row fp-report-grid">
                                <div className="fpm-plan-col fpm-plan-col-duration">
                                  <span className="fpm-plan-badge">{getDurationLabel(plan.durationId)}</span>
                                </div>
                                <div className="fpm-plan-col fpm-plan-col-price">
                                  <span className="fpm-plan-val">{baseSAR > 0 ? `${fmt(baseSAR)} ر.س` : '—'}</span>
                                </div>
                                <div className="fpm-plan-col fpm-plan-col-price">
                                  {officialSAR > 0 ? (
                                    <div className="fpm-official-wrap">
                                      <span className="fpm-plan-val fpm-official-val">{fmt(officialSAR)} ر.س</span>
                                      {diffFromOfficial !== null && (
                                        <span className={`fpm-official-diff ${diffFromOfficial > 0 ? 'above' : diffFromOfficial < 0 ? 'below' : 'equal'}`}>
                                          {diffFromOfficial > 0 ? `+${fmt(diffFromOfficial)}` : fmt(diffFromOfficial)}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="fpm-empty-dash">—</span>
                                  )}
                                </div>
                                <div className="fpm-plan-col fpm-plan-col-price">
                                  <span className="fpm-plan-val">{tc > 0 ? `${fmt(tc)} ر.س` : '—'}</span>
                                </div>
                                <div className="fpm-plan-col fpm-plan-col-price">
                                  {isSet
                                    ? <span className="fp-report-val-final">{fmt(fp)} ر.س</span>
                                    : <span className="fpm-status-pending">بعد الحفظ</span>}
                                </div>
                                <div className="fpm-plan-col fpm-plan-col-margin">
                                  {margin !== null
                                    ? <span className={`po-margin-badge ${margin >= 0 ? 'positive' : 'negative'}`}>{fmtPct(margin)}%</span>
                                    : <span className="fpm-empty-dash">—</span>}
                                </div>
                                <div className="fpm-plan-col fpm-plan-col-status">
                                  {statusLabel
                                    ? <span className={`po-status-badge po-status-${statusLabel === 'مثالي' ? 'success' : statusLabel === 'يحتاج رفع' ? 'warning' : statusLabel === 'تحت التكلفة' ? 'danger' : 'info'}`}>{statusLabel}</span>
                                    : <span className="fpm-empty-dash">—</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        );
      })()}

      {activeSection === 'stats' && (() => {
        const catCounts = {};
        products.forEach(p => {
          const cid = p.categoryId || '__none__';
          catCounts[cid] = (catCounts[cid] || 0) + 1;
        });
        const catDonutData = Object.entries(catCounts).map(([cid, count]) => {
          const cat = categories.find(c => c.id === cid);
          return { label: cat ? `${cat.icon} ${cat.name}` : '📦 غير مصنف', value: count, color: cat ? cat.color : '#9CA3AF' };
        }).sort((a, b) => b.value - a.value);

        const accMap = { individual: 0, team: 0, none: 0 };
        products.forEach(p => { accMap[p.accountType || 'none']++; });
        const accDonutData = [
          { label: '👤 فردي', value: accMap.individual, color: '#5E4FDE' },
          { label: '👥 فريق', value: accMap.team, color: '#11BA65' },
          { label: '📦 غير محدد', value: accMap.none, color: '#9CA3AF' },
        ].filter(d => d.value > 0);

        const planCountData = products.map(p => ({
          label: p.name,
          value: p.plans.length,
          display: `${p.plans.length} خطة`,
          color: '#1A51F4',
        })).sort((a, b) => b.value - a.value).slice(0, 8);

        const supplierAvgData = suppliers.map(s => {
          let total = 0, cnt = 0;
          products.forEach(p => p.plans.forEach(pl => { const pr = pl.prices[s.id] || 0; if (pr > 0) { total += pr; cnt++; } }));
          return { label: s.name, value: cnt > 0 ? total / cnt : 0, display: cnt > 0 ? `${fmt((total / cnt) * exchangeRate)} ر.س` : '—', color: '#F7784A' };
        }).filter(d => d.value > 0).sort((a, b) => a.value - b.value);

        const productBestPriceData = products.map(p => {
          let best = Infinity;
          p.plans.forEach(pl => suppliers.forEach(s => { const pr = pl.prices[s.id] || 0; if (pr > 0) best = Math.min(best, pr); }));
          return { label: p.name, value: best < Infinity ? best : 0, display: best < Infinity ? `${fmt(best * exchangeRate)} ر.س` : '—', color: '#11BA65' };
        }).filter(d => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 8);

        const savingsData = analytics.filter(a => a.savings > 0)
          .sort((a, b) => b.savings - a.savings).slice(0, 8)
          .map(a => ({ label: `${a.productName} — ${a.planDuration}`, value: a.savings, display: `${fmt(a.savings * exchangeRate)} ر.س`, color: '#EC4899' }));

        return (
          <div className="stats-section">
            <div className="stats-section-header">
              <div className="stats-section-title"><BarChartIcon className="icon-sm" /> الإحصائيات البصرية</div>
              <div className="stats-section-subtitle">تحليلات فورية مرئية لجميع بياناتك — {products.length} منتج — {suppliers.length} مورد</div>
            </div>

            <div className="stats-donuts-row">
              {catDonutData.length > 0 && (
                <div className="stats-chart-card">
                  <div className="stats-chart-title">توزيع المنتجات حسب الفئة</div>
                  <div className="stats-donut-wrap">
                    <DonutChartVisual data={catDonutData} size={170} thickness={36} label={products.length} sublabel="منتج" />
                    <div className="stats-legend">
                      {catDonutData.map((d, i) => (
                        <div key={i} className="stats-legend-item">
                          <span className="stats-legend-dot" style={{ background: d.color }} />
                          <span className="stats-legend-label">{d.label}</span>
                          <span className="stats-legend-count">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {accDonutData.length > 0 && (
                <div className="stats-chart-card">
                  <div className="stats-chart-title">توزيع أنواع الحسابات</div>
                  <div className="stats-donut-wrap">
                    <DonutChartVisual data={accDonutData} size={170} thickness={36} label={products.length} sublabel="منتج" />
                    <div className="stats-legend">
                      {accDonutData.map((d, i) => (
                        <div key={i} className="stats-legend-item">
                          <span className="stats-legend-dot" style={{ background: d.color }} />
                          <span className="stats-legend-label">{d.label}</span>
                          <span className="stats-legend-count">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {planCountData.length > 0 && (
                <div className="stats-chart-card">
                  <div className="stats-chart-title">عدد الخطط لكل منتج</div>
                  <HBarChartVisual data={planCountData} />
                </div>
              )}
            </div>

            <div className="stats-bars-row">
              {supplierAvgData.length > 0 && (
                <div className="stats-chart-card stats-chart-half">
                  <div className="stats-chart-title">متوسط سعر الشراء لكل مورد</div>
                  <div className="stats-chart-subtitle">المتوسط ($) عبر جميع الخطط</div>
                  <HBarChartVisual data={supplierAvgData} />
                </div>
              )}
              {productBestPriceData.length > 0 && (
                <div className="stats-chart-card stats-chart-half">
                  <div className="stats-chart-title">أفضل سعر لكل منتج</div>
                  <div className="stats-chart-subtitle">أدنى سعر متاح عبر جميع الموردين ($)</div>
                  <HBarChartVisual data={productBestPriceData} />
                </div>
              )}
            </div>

            {savingsData.length > 0 && (
              <div className="stats-chart-card stats-chart-full">
                <div className="stats-chart-title">التوفير المحتمل لكل خطة</div>
                <div className="stats-chart-subtitle">الفرق بين أغلى مورد وأرخصه ($) — أعلى 8 فرص</div>
                <HBarChartVisual data={savingsData} />
              </div>
            )}

            {products.length === 0 && (
              <div className="stats-empty-msg">لا توجد بيانات كافية لعرض الإحصائيات. أضف منتجات وأسعاراً لترى الرسوم البيانية هنا.</div>
            )}
          </div>
        );
      })()}

      {activeSection === 'global' && <div className="analytics-preview">
        <div className="analytics-header">
          <h3 className="flex-row align-center gap-2"><BarChartIcon className="icon-sm" /> ملخص التحليلات</h3>
          <div className="analytics-actions">
            <button className="analytics-toggle-btn" onClick={expandAll} title="توسيع الكل">
              <span className="toggle-icon">▼</span> توسيع الكل
            </button>
            <button className="analytics-toggle-btn" onClick={collapseAll} title="طي الكل">
              <span className="toggle-icon">▲</span> طي الكل
            </button>
          </div>
        </div>
        <div className="table-wrapper">
          <table className="analytics-table grouped-table">
            <thead>
              <tr>
                <th className="th-product">المنتج</th><th>الخطة</th><th>الضمان</th><th>أفضل مورد</th>
                <th>أقل سعر (ر.س)</th>
                <th>المتوسط</th><th>التوفير</th><th>نسبة التوفير</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                return groupedAnalytics.map((group, gi) => {
                const isExpanded = expandedProducts[group.productName];
                const bestPlan = group.plans.reduce((best, a) => parseFloat(a.savingsPercent) > parseFloat(best.savingsPercent) ? a : best, group.plans[0]);
                const totalGroupSavings = group.plans.reduce((s, a) => s + a.savings, 0);
                return (
                  <React.Fragment key={gi}>
                    <tr className={`product-group-row ${isExpanded ? 'group-expanded' : ''}`} onClick={() => toggleProduct(group.productName)}>
                      <td className="td-product-name-cell">
                        <div className="td-group-name">
                          <span className={`group-chevron ${!isExpanded ? 'chevron-collapsed' : ''}`}>
                            <ChevronDownIcon className="icon-xs" />
                          </span>
                          <span className="product-name-text">{group.productName}</span>
                          <span className="group-plan-count">{group.plans.length} خطة</span>
                        </div>
                      </td>
                      {!isExpanded ? (
                        <td colSpan={7} className="td-group-summary">
                          <div className="collapsed-summary-row">
                            <div className="collapsed-summary-cell cs-supplier">
                              <span className="collapsed-label">أفضل مورد</span>
                              <span className="collapsed-value">{bestPlan.cheapest.supplierName}</span>
                            </div>
                            <div className="collapsed-summary-divider"></div>
                            <div className="collapsed-summary-cell cs-price">
                              <span className="collapsed-label">أقل سعر</span>
                              <span className="collapsed-value">{fmt(bestPlan.cheapest.price * exchangeRate)}<span className="cv-unit"> ر.س</span></span>
                            </div>
                            <div className="collapsed-summary-divider"></div>
                            <div className="collapsed-summary-cell cs-savings">
                              <span className="collapsed-label">إجمالي التوفير</span>
                              <span className="collapsed-value">{fmt(totalGroupSavings * exchangeRate)}<span className="cv-unit"> ر.س</span></span>
                            </div>
                            <div className="collapsed-summary-divider"></div>
                            <div className="collapsed-summary-cell cs-pct">
                              <span className="collapsed-label">نسبة التوفير</span>
                              <span className="collapsed-value">{bestPlan.savingsPercent}<span className="cv-unit">%</span></span>
                            </div>
                          </div>
                        </td>
                      ) : (
                        <td colSpan={7} className="td-group-summary"></td>
                      )}
                    </tr>
                    {isExpanded && group.plans.map((a, pi) => (
                      <tr key={pi} className="plan-sub-row">
                        <td className="td-plan-indent"></td>
                        <td><span className="plan-badge">{a.planDuration}</span></td>
                        <td className="td-warranty">{a.warrantyDays > 0 ? <span className="warranty-badge-sm">{a.warrantyDays} يوم</span> : <span className="price-not-available" style={{opacity: 0.5}}>—</span>}</td>
                        <td className="td-best-supplier">{a.cheapest.supplierName !== '-' ? a.cheapest.supplierName : <span className="price-not-available">لا يوجد</span>}</td>
                        <td className="td-price td-sar">{a.cheapest.price > 0 ? <span className="price-cell">{fmt(a.cheapest.price * exchangeRate)}<span className="price-unit-sm"> ر.س</span></span> : <span className="price-not-available" style={{opacity: 0.5}}>—</span>}</td>
                        <td className="td-price td-avg">{a.avgPrice > 0 ? <span className="price-cell">{fmt(a.avgPrice * exchangeRate)}<span className="price-unit-sm"> ر.س</span></span> : <span className="price-not-available" style={{opacity: 0.5}}>—</span>}</td>
                        <td className="td-savings"><span className="savings-pill">{fmt(a.savings * exchangeRate)}<span className="price-unit-sm"> ر.س</span></span></td>
                        <td className="td-savings-pct"><span className="pct-badge">{a.savingsPercent}%</span></td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              });})()}
            </tbody>
          </table>
        </div>
      </div>}

      {generating && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
          <div ref={reportRef}>{renderHiddenContent()}</div>
        </div>
      )}
    </div>
  );
}

export default ReportsExport;
