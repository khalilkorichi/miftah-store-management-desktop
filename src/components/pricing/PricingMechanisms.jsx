import React, { useState } from 'react';
import { TargetIcon, SearchIcon, CalculatorIcon, DiamondIcon, AwardIcon, LightbulbIcon, ScaleIcon, AlertTriangleIcon, PlusIcon, FileTextIcon } from '../Icons';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

const fmt = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function PricingMechanisms({ products, suppliers, costs, pricingData, setPricingData, exchangeRate }) {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [competitors, setCompetitors] = useState([]);
  const [compName, setCompName] = useState('');
  const [compPrice, setCompPrice] = useState('');
  const [psmData, setPsmData] = useState([]);
  const [psmInputs, setPsmInputs] = useState({ tooCheap: '', cheap: '', expensive: '', tooExpensive: '' });

  const product = products.find(p => p.id === parseInt(selectedProductId));
  
  const getSupplierPrice = (prod) => {
    if (!prod || !prod.plans || prod.plans.length === 0) return 0;
    const plan = prod.plans[0];
    const savedConfig = pricingData[prod.id] || {};
    const supplierId = savedConfig.primarySupplierId || suppliers[0]?.id;
    return (plan.prices[supplierId] || 0) * exchangeRate;
  };

  const baseCost = getSupplierPrice(product);

  const getSuggestedCostPlusPrice = (marginPercent) => {
    const marginDec = marginPercent / 100;
    let fixedCosts = 0;
    let percentCostsTotal = 0;
    costs.filter(c => c.active).forEach(c => {
      if (c.type === 'fixed') fixedCosts += c.value;
      else if (c.type === 'percentage') percentCostsTotal += c.value / 100;
    });
    const denominator = 1 - marginDec - percentCostsTotal;
    if (denominator <= 0) return 0;
    return (baseCost + fixedCosts) / denominator;
  };

  const [targetMargin, setTargetMargin] = useState(20);
  const suggestedCpPrice = getSuggestedCostPlusPrice(targetMargin);

  const [perceivedValue, setPerceivedValue] = useState(100);
  const [valueRatio, setValueRatio] = useState(20);
  const suggestedVbPrice = perceivedValue * (valueRatio / 100);

  const addCompetitor = () => {
    if (compName && compPrice) {
      setCompetitors([...competitors, { name: compName, price: parseFloat(compPrice) }]);
      setCompName(''); setCompPrice('');
    }
  };

  const addPsmData = () => {
    const tc = parseFloat(psmInputs.tooCheap);
    const c = parseFloat(psmInputs.cheap);
    const e = parseFloat(psmInputs.expensive);
    const te = parseFloat(psmInputs.tooExpensive);
    if (!isNaN(tc) && !isNaN(c) && !isNaN(e) && !isNaN(te)) {
      setPsmData([...psmData, { tooCheap: tc, cheap: c, expensive: e, tooExpensive: te }]);
      setPsmInputs({ tooCheap: '', cheap: '', expensive: '', tooExpensive: '' });
    }
  };

  const applyPsychological = (price, rule) => {
    if (!price) return 0;
    const p = Math.floor(price);
    if (rule === '99') return p + 0.99;
    if (rule === '9') return Math.floor(price / 10) * 10 + 9;
    return price;
  };

  const [psyRule, setPsyRule] = useState('none');

  const generatePsmChartData = () => {
    if (psmData.length === 0) return [];
    const allPrices = psmData.flatMap(d => Object.values(d));
    const minP = Math.min(...allPrices);
    const maxP = Math.max(...allPrices);
    const step = (maxP - minP) / 20 || 1;
    const chartData = [];
    for (let p = minP; p <= maxP; p += step) {
      const price = Math.round(p);
      const tooCheapCount = psmData.filter(d => price <= d.tooCheap).length;
      const cheapCount = psmData.filter(d => price <= d.cheap).length;
      const expensiveCount = psmData.filter(d => price >= d.expensive).length;
      const tooExpCount = psmData.filter(d => price >= d.tooExpensive).length;
      const total = psmData.length || 1;
      chartData.push({
        price,
        'رخيص جداً': (tooCheapCount / total) * 100,
        'رخيص': (cheapCount / total) * 100,
        'غالٍ': (expensiveCount / total) * 100,
        'غالٍ جداً': (tooExpCount / total) * 100,
      });
    }
    return chartData;
  };

  const mechanisms = [
    { id: 'costplus', num: '01', title: 'التسعير المعتمد على التكلفة', subtitle: 'Cost-Plus Pricing', icon: <CalculatorIcon className="icon-sm" />, color: '#5E4FDE' },
    { id: 'value', num: '02', title: 'التسعير بالقيمة', subtitle: 'Value-Based Pricing', icon: <DiamondIcon className="icon-sm" />, color: '#11BA65' },
    { id: 'competitive', num: '03', title: 'التسعير التنافسي', subtitle: 'Competitive Pricing', icon: <AwardIcon className="icon-sm" />, color: '#1A51F4' },
    { id: 'psychological', num: '04', title: 'التسعير النفسي', subtitle: 'Psychological Pricing', icon: <LightbulbIcon className="icon-sm" />, color: '#F7784A' },
    { id: 'psm', num: '05', title: 'مقياس حساسية السعر', subtitle: 'Van Westendorp PSM', icon: <ScaleIcon className="icon-sm" />, color: '#F94B60' },
  ];

  return (
    <div className="pm-container">
      {/* Product Selector */}
      <div className="pm-selector-card">
        <div className="pm-selector-icon flex-row align-center justify-center"><TargetIcon className="icon-lg" /></div>
        <div className="pm-selector-content">
          <h3>اختر المنتج لتطبيق آليات التسعير</h3>
          <p>حدد المنتج المطلوب ثم استخدم آليات التسعير المختلفة لتحديد السعر الأمثل</p>
        </div>
        <select 
          className="pm-product-select"
          value={selectedProductId} 
          onChange={(e) => setSelectedProductId(e.target.value)}
        >
          <option value="">-- اختر منتج --</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {!product ? (
        <div className="unified-empty">
          <div className="unified-empty-icon"><SearchIcon className="icon-xl" /></div>
          <h4>يرجى اختيار منتج للبدء بالتسعير</h4>
          <p>اختر منتجاً من القائمة أعلاه لعرض آليات التسعير المتاحة</p>
        </div>
      ) : (
        <div className="pm-mechanisms-grid">
          
          {/* Cost-Plus */}
          <div className="pm-card">
            <div className="pm-card-header" style={{'--card-accent': '#5E4FDE'}}>
              <span className="pm-card-num">01</span>
              <span className="pm-card-icon flex-row align-center justify-center"><CalculatorIcon className="icon-sm" /></span>
              <div>
                <h3>التسعير المعتمد على التكلفة</h3>
                <span className="pm-card-subtitle">Cost-Plus Pricing</span>
              </div>
            </div>
            <div className="pm-card-body">
              <p className="pm-desc">نضمن لك تغطية جميع تكاليفك وتحقيق هامش الربح الذي تريده.</p>
              <div className="pm-info-box">
                <div className="pm-info-row">
                  <span>سعر التكلفة الأساسي (المورد)</span>
                  <strong>{fmt(baseCost)} ر.س</strong>
                </div>
              </div>
              <div className="pm-field">
                <label>هامش الربح المطلوب (%)</label>
                <input 
                  type="number" 
                  value={targetMargin} 
                  onChange={(e) => setTargetMargin(e.target.value)}
                />
              </div>
              <div className="pm-result">
                <span>السعر المقترح</span>
                <strong>{fmt(suggestedCpPrice)} ر.س</strong>
              </div>
            </div>
          </div>

          {/* Value-Based */}
          <div className="pm-card">
            <div className="pm-card-header" style={{'--card-accent': '#11BA65'}}>
              <span className="pm-card-num">02</span>
              <span className="pm-card-icon flex-row align-center justify-center"><DiamondIcon className="icon-sm" /></span>
              <div>
                <h3>التسعير بالقيمة</h3>
                <span className="pm-card-subtitle">Value-Based Pricing</span>
              </div>
            </div>
            <div className="pm-card-body">
              <p className="pm-desc">يقترح سعراً يعكس القيمة التي يدركها العميل.</p>
              <div className="pm-fields-row">
                <div className="pm-field">
                  <label>القيمة المدركة للعميل (ر.س)</label>
                  <input type="number" value={perceivedValue} onChange={e=>setPerceivedValue(e.target.value)} />
                </div>
                <div className="pm-field">
                  <label>نسبة السعر من القيمة (%)</label>
                  <input type="number" value={valueRatio} onChange={e=>setValueRatio(e.target.value)} />
                </div>
              </div>
              <div className="pm-result">
                <span>السعر المقترح</span>
                <strong>{fmt(suggestedVbPrice)} ر.س</strong>
              </div>
              {suggestedVbPrice < getSuggestedCostPlusPrice(0) && (
                <div className="pm-warning">
                  <span className="flex-row align-center justify-center"><AlertTriangleIcon className="icon-sm" /></span>
                  السعر المقترح لا يغطي تكاليفك!
                </div>
              )}
            </div>
          </div>

          {/* Competitive */}
          <div className="pm-card">
            <div className="pm-card-header" style={{'--card-accent': '#1A51F4'}}>
              <span className="pm-card-num">03</span>
              <span className="pm-card-icon flex-row align-center justify-center"><AwardIcon className="icon-sm" /></span>
              <div>
                <h3>التسعير التنافسي</h3>
                <span className="pm-card-subtitle">Competitive Pricing</span>
              </div>
            </div>
            <div className="pm-card-body">
              <div className="pm-comp-form">
                <input type="text" placeholder="اسم المنافس" value={compName} onChange={e=>setCompName(e.target.value)} />
                <input type="number" placeholder="سعر المنافس (ر.س)" value={compPrice} onChange={e=>setCompPrice(e.target.value)} />
                <button onClick={addCompetitor} className="pm-add-comp-btn">
                  <span className="flex-row align-center justify-center"><PlusIcon className="icon-sm" /></span> إضافة
                </button>
              </div>
              {competitors.length > 0 && (
                <div className="pm-chart-wrap">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={competitors}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'var(--bg-card)', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '12px',
                          fontFamily: 'var(--font-family)'
                        }} 
                      />
                      <Bar dataKey="price" fill="#5E4FDE" name="السعر" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Psychological */}
          <div className="pm-card">
            <div className="pm-card-header" style={{'--card-accent': '#F7784A'}}>
              <span className="pm-card-num">04</span>
              <span className="pm-card-icon flex-row align-center justify-center"><LightbulbIcon className="icon-sm" /></span>
              <div>
                <h3>التسعير النفسي</h3>
                <span className="pm-card-subtitle">Psychological Pricing</span>
              </div>
            </div>
            <div className="pm-card-body">
              <div className="pm-field">
                <label>تطبيق قاعدة على السعر المحسوب</label>
                <select value={psyRule} onChange={e=>setPsyRule(e.target.value)}>
                  <option value="none">بدون تلاعب نفسي</option>
                  <option value="99">أن ينتهي بـ .99 (Charm Pricing)</option>
                  <option value="9">أن ينتهي بـ 9 صحيح (مثال: 49)</option>
                </select>
              </div>
              {psyRule !== 'none' && (
                <div className="pm-result">
                  <span>Cost-Plus بعد التعديل</span>
                  <strong>{fmt(applyPsychological(suggestedCpPrice, psyRule))} ر.س</strong>
                </div>
              )}
            </div>
          </div>

          {/* Van Westendorp PSM */}
          <div className="pm-card pm-card-full">
            <div className="pm-card-header" style={{'--card-accent': '#F94B60'}}>
              <span className="pm-card-num">05</span>
              <span className="pm-card-icon flex-row align-center justify-center"><ScaleIcon className="icon-sm" /></span>
              <div>
                <h3>مقياس حساسية السعر</h3>
                <span className="pm-card-subtitle">Van Westendorp PSM</span>
              </div>
            </div>
            <div className="pm-card-body">
              <p className="pm-desc">أدخل نتائج استبيان العملاء لتحديد النطاق الآمن للسعر.</p>
              <div className="pm-psm-form">
                <div className="pm-field">
                  <label>رخيص جداً</label>
                  <input type="number" value={psmInputs.tooCheap} onChange={(e)=>setPsmInputs({...psmInputs, tooCheap:e.target.value})} />
                </div>
                <div className="pm-field">
                  <label>رخيص</label>
                  <input type="number" value={psmInputs.cheap} onChange={(e)=>setPsmInputs({...psmInputs, cheap:e.target.value})} />
                </div>
                <div className="pm-field">
                  <label>غالٍ</label>
                  <input type="number" value={psmInputs.expensive} onChange={(e)=>setPsmInputs({...psmInputs, expensive:e.target.value})} />
                </div>
                <div className="pm-field">
                  <label>غالٍ جداً</label>
                  <input type="number" value={psmInputs.tooExpensive} onChange={(e)=>setPsmInputs({...psmInputs, tooExpensive:e.target.value})} />
                </div>
                <button onClick={addPsmData} className="pm-add-comp-btn" style={{alignSelf: 'flex-end'}}>
                  <span className="flex-row align-center justify-center"><PlusIcon className="icon-sm" /></span> إضافة الرد
                </button>
              </div>
              <div className="pm-psm-count flex-row align-center gap-2">
                <span className="flex-row align-center justify-center"><FileTextIcon className="icon-sm" /></span>
                عدد الردود المدخلة: <strong>{psmData.length}</strong>
              </div>
              {psmData.length > 0 && (
                <div className="pm-chart-wrap" style={{height: '350px'}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={generatePsmChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="price" stroke="var(--text-muted)" fontSize={12} label={{ value: 'السعر', position: 'insideBottomRight', offset: -5 }} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} label={{ value: 'النسبة تراكمية %', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        formatter={(val) => fmtPct(val) + '%'} 
                        contentStyle={{ 
                          background: 'var(--bg-card)', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '12px',
                          fontFamily: 'var(--font-family)'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="رخيص جداً" stroke="#11BA65" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="رخيص" stroke="#82ca9d" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="غالٍ" stroke="#ffc658" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="غالٍ جداً" stroke="#F44336" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default PricingMechanisms;
