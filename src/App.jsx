import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DEFAULT_EXCHANGE_RATE,
  DEFAULT_SUPPLIERS,
  DEFAULT_PRODUCTS,
  DEFAULT_DURATIONS,
  DEFAULT_ACTIVATION_METHODS,
  DEFAULT_COSTS,
  DEFAULT_BUNDLES,
  DEFAULT_COUPONS,
  DEFAULT_PRICING_DATA,
  DEFAULT_CATEGORIES,
} from './data/initialData';
import ProductTable from './components/ProductTable';
import ImportSallaModal from './components/ImportSallaModal';
import ExchangeRateBar from './components/ExchangeRateBar';
import SettingsPage from './components/SettingsPage';
import ReportsExport from './components/ReportsExport';
import PricingDashboard from './components/pricing/PricingDashboard';
import BundleManager from './components/bundles/BundleManager';
import { useToast } from './components/Toast';
import Dashboard from './components/Dashboard';
import ProductFeatures from './components/ProductFeatures';
import {
  PackageIcon, DollarSignIcon, GiftIcon, BarChartIcon, SettingsIcon,
  SunIcon, MoonIcon, CheckCircleIcon, HomeIcon, FileTextIcon
} from './components/Icons';

const STORAGE_KEY = 'miftah_store_data';
const DATA_VERSION = 2;
const SAVE_DEBOUNCE_MS = 500;
const TAB_LIST = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: HomeIcon },
  { id: 'products', label: 'المنتجات والأسعار', icon: PackageIcon },
  { id: 'pricing', label: 'إدارة التسعير', icon: DollarSignIcon },
  { id: 'bundles', label: 'الحزم والمجموعات', icon: GiftIcon },
  { id: 'features', label: 'وصف المنتجات', icon: FileTextIcon },
  { id: 'reports', label: 'التقارير', icon: BarChartIcon },
  { id: 'settings', label: 'الإعدادات', icon: SettingsIcon },
];

function migrateData(data) {
  if (!data || !data.products) return data;
  // Check if old format (products have 'prices' directly instead of 'plans')
  const needsMigration = data.products.some((p) => p.prices && !p.plans);
  if (!needsMigration) {
    const productsNeedFeatures = data.products.some(p => p.description === undefined || (p.plans || []).some(plan => (plan.features || []).some(f => f.order === undefined)));
    const productsNeedCategory = data.products.some(p => !('categoryId' in p));
    const productsNeedSupplierWarranty = data.products.some(p => (p.plans || []).some(plan => !plan.supplierWarranty));
    if (productsNeedFeatures || productsNeedCategory || productsNeedSupplierWarranty) {
      data = { ...data, products: data.products.map(p => ({
        ...p,
        description: p.description || '',
        descriptionStyles: p.descriptionStyles || {},
        categoryId: 'categoryId' in p ? p.categoryId : null,
        plans: (p.plans || []).map(plan => ({
          ...plan,
          supplierWarranty: plan.supplierWarranty || {},
          features: (plan.features || []).map((f, i) => ({ ...f, order: f.order !== undefined ? f.order : i + 1 })),
        })),
      })) };
    }
    return data;
  }

  const migratedProducts = data.products.map((product) => {
    if (product.plans) return {
      ...product,
      description: product.description || '',
      descriptionStyles: product.descriptionStyles || {},
      plans: product.plans.map(plan => ({ ...plan, features: plan.features || [] })),
    };
    return {
      id: product.id,
      name: product.name,
      description: '',
      descriptionStyles: {},
      plans: [
        {
          id: 1,
          durationId: 'month_1',
          prices: product.prices || {},
          features: [],
        },
      ],
    };
  });

  return {
    ...data,
    products: migratedProducts,
    durations: data.durations || DEFAULT_DURATIONS,
    costs: data.costs || DEFAULT_COSTS,
    bundles: data.bundles || DEFAULT_BUNDLES,
    coupons: data.coupons || DEFAULT_COUPONS,
    pricingData: data.pricingData || DEFAULT_PRICING_DATA,
  };
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return migrateData(data);
    }
  } catch (e) {
    console.error('Error loading data:', e);
    const backup = localStorage.getItem(STORAGE_KEY + '_last_good');
    if (backup) {
      try { return JSON.parse(backup); } catch (_) {}
    }
  }
  return null;
}

let _saveTimer = null;
function saveData(data) {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    try {
      const payload = { ...data, _version: DATA_VERSION, _savedAt: Date.now() };
      const serialized = JSON.stringify(payload);
      const sizeKB = (serialized.length * 2) / 1024;
      if (sizeKB > 4096) {
        console.warn('Storage approaching limit:', Math.round(sizeKB) + 'KB');
      }
      localStorage.setItem(STORAGE_KEY, serialized);
      localStorage.setItem(STORAGE_KEY + '_last_good', serialized);
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        Object.keys(localStorage).forEach(k => {
          if (k !== STORAGE_KEY && k.startsWith(STORAGE_KEY)) localStorage.removeItem(k);
        });
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && !k.startsWith(STORAGE_KEY)) { localStorage.removeItem(k); break; }
        }
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, _version: DATA_VERSION, _savedAt: Date.now() }));
        } catch (_) {
          console.error('Cannot save — storage full');
        }
      } else {
        console.error('Error saving data:', e);
      }
    }
  }, SAVE_DEBOUNCE_MS);
}

function App() {
  const savedData = loadData();
  const [products, setProducts] = useState(savedData?.products || DEFAULT_PRODUCTS);
  const [suppliers, setSuppliers] = useState(savedData?.suppliers || DEFAULT_SUPPLIERS);
  const [exchangeRate, setExchangeRate] = useState(savedData?.exchangeRate || DEFAULT_EXCHANGE_RATE);
  const [durations, setDurations] = useState(savedData?.durations || DEFAULT_DURATIONS);
  const [activationMethods, setActivationMethods] = useState(savedData?.activationMethods || DEFAULT_ACTIVATION_METHODS);
  const [costs, setCosts] = useState(savedData?.costs || DEFAULT_COSTS);
  const [bundles, setBundles] = useState(savedData?.bundles || DEFAULT_BUNDLES);
  const [coupons, setCoupons] = useState(savedData?.coupons || DEFAULT_COUPONS);
  const [pricingData, setPricingData] = useState(savedData?.pricingData || DEFAULT_PRICING_DATA);
  const [categories, setCategories] = useState(savedData?.categories || DEFAULT_CATEGORIES);
  const [customLogo, setCustomLogo] = useState(savedData?.customLogo || null);
  const [appSettings, setAppSettings] = useState(savedData?.appSettings || {
    accentColor: 'purple',
    fontSize: 'medium',
    compactMode: false,
    borderRadius: 'rounded',
  });
  
  // Custom hook logic for hash-based routing
  const getInitialTab = () => {
    const hash = window.location.hash.replace('#', '');
    const validTabs = ['dashboard', 'products', 'pricing', 'bundles', 'features', 'reports', 'settings'];
    return validTabs.includes(hash) ? hash : 'dashboard';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [darkMode, setDarkMode] = useState(savedData?.darkMode ?? true);
  const [saveIndicator, setSaveIndicator] = useState(false);
  const toast = useToast();
  const tabNavRef = useRef(null);

  // Save data whenever it changes
  useEffect(() => {
    saveData({ products, suppliers, exchangeRate, durations, activationMethods, darkMode, costs, bundles, coupons, pricingData, customLogo, appSettings, categories });
    setSaveIndicator(true);
    const timer = setTimeout(() => setSaveIndicator(false), 1500);
    return () => clearTimeout(timer);
  }, [products, suppliers, exchangeRate, durations, activationMethods, darkMode, costs, bundles, coupons, pricingData, customLogo, appSettings, categories]);

  // Apply dark mode class
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Apply appearance settings
  useEffect(() => {
    const root = document.documentElement;
    const fontSizes = { small: '13px', medium: '14px', large: '16px' };
    const radii = { sharp: '4px', rounded: '14px', pill: '24px' };
    root.style.setProperty('--base-font-size', fontSizes[appSettings.fontSize] || '14px');
    root.style.setProperty('--radius-lg', radii[appSettings.borderRadius] || '14px');
    root.setAttribute('data-compact', appSettings.compactMode ? 'true' : 'false');
    const accentColors = {
      purple: { main: '#5E4FDE', hover: '#4a3cc7' },
      blue: { main: '#3B82F6', hover: '#2563eb' },
      green: { main: '#10B981', hover: '#059669' },
      red: { main: '#EF4444', hover: '#dc2626' },
      orange: { main: '#F97316', hover: '#ea580c' },
      pink: { main: '#EC4899', hover: '#db2777' },
    };
    const accent = accentColors[appSettings.accentColor] || accentColors.purple;
    root.style.setProperty('--accent-blue', accent.main);
    root.style.setProperty('--accent-blue-hover', accent.hover);
  }, [appSettings]);

  // Sync active tab with URL hash for browser navigation support
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validTabs = ['dashboard', 'products', 'pricing', 'bundles', 'features', 'reports', 'settings'];
      if (validTabs.includes(hash)) {
        setPageTransition(true);
        setTimeout(() => {
          setActiveTab(hash);
          window.scrollTo(0, 0);
          setTimeout(() => setPageTransition(false), 30);
        }, 150);
      } else if (!window.location.hash) {
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // Set initial hash if not present to maintain consistency
    if (!window.location.hash && window.history.replaceState) {
      window.history.replaceState(null, '', '#dashboard');
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [pageTransition, setPageTransition] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleTabChange = useCallback((tab) => {
    setPageTransition(true);
    setTimeout(() => {
      window.location.hash = tab;
      setActiveTab(tab);
      window.scrollTo(0, 0);
      setTimeout(() => setPageTransition(false), 30);
    }, 150);
  }, []);

  // Keyboard navigation for tabs (RTL-aware: ArrowRight = prev, ArrowLeft = next)
  const handleTabKeyDown = useCallback((e) => {
    const currentIndex = TAB_LIST.findIndex((t) => t.id === activeTab);
    let newIndex = currentIndex;

    if (e.key === 'ArrowLeft') {
      // In RTL, ArrowLeft goes to next tab
      newIndex = (currentIndex + 1) % TAB_LIST.length;
    } else if (e.key === 'ArrowRight') {
      // In RTL, ArrowRight goes to prev tab
      newIndex = (currentIndex - 1 + TAB_LIST.length) % TAB_LIST.length;
    } else if (e.key === 'Home') {
      newIndex = 0;
    } else if (e.key === 'End') {
      newIndex = TAB_LIST.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const newTab = TAB_LIST[newIndex].id;
    handleTabChange(newTab);
    // Focus the new tab button
    const buttons = tabNavRef.current?.querySelectorAll('[role="tab"]');
    buttons?.[newIndex]?.focus();
  }, [activeTab, handleTabChange]);

  // === Price Management ===
  const handleUpdatePrice = useCallback((productId, planId, supplierId, newPrice) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          plans: p.plans.map((plan) =>
            plan.id === planId
              ? { ...plan, prices: { ...plan.prices, [supplierId]: parseFloat(newPrice) || 0 } }
              : plan
          ),
        };
      })
    );
  }, []);

  // === Product Management ===
  const handleAddProduct = useCallback((name, customPlans, activationMethods = [], accountType = 'none', storeUrl = '', categoryId = null) => {
    const newId = Math.max(0, ...products.map((p) => p.id)) + 1;
    let plans;
    if (customPlans && customPlans.length > 0) {
      plans = customPlans.map((plan) => {
        const prices = {};
        suppliers.forEach((s) => {
          prices[s.id] = plan.prices?.[s.id] ?? 0;
        });
        return { ...plan, prices };
      });
    } else {
      const prices = {};
      suppliers.forEach((s) => { prices[s.id] = 0; });
      plans = [{ id: 1, durationId: 'month_1', prices }];
    }
    const newProduct = { id: newId, name, plans, activationMethods, accountType, categoryId };
    if (storeUrl) newProduct.storeUrl = storeUrl;
    setProducts((prev) => [...prev, newProduct]);
    toast(`تمت إضافة المنتج "${name}" بنجاح`, 'success');
  }, [products, suppliers, toast]);

  const handleAddCategory = useCallback((cat) => {
    setCategories((prev) => [...prev, cat]);
  }, []);

  const handleDeleteCategory = useCallback((catId) => {
    const inUse = products.some((p) => p.categoryId === catId);
    if (inUse) {
      toast('لا يمكن حذف الفئة — هي مستخدمة في منتجات حالية', 'error');
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== catId));
  }, [products, toast]);

  const handleDeleteProduct = useCallback((productId) => {
    const product = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    if (product) toast(`تم حذف المنتج "${product.name}"`, 'error');
  }, [products, toast]);

  const handleUpdateProductName = useCallback((productId, newName) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, name: newName } : p))
    );
  }, [toast]);

  const handleUpdateProductUrl = useCallback((productId, url) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, storeUrl: url } : p))
    );
  }, []);

  const handleDuplicateProduct = useCallback((productId) => {
    setProducts((prev) => {
      const productToDuplicate = prev.find((p) => p.id === productId);
      if (!productToDuplicate) return prev;
      
      const newId = prev.length > 0 ? Math.max(...prev.map((p) => p.id)) + 1 : 1;
      const duplicatedProduct = JSON.parse(JSON.stringify(productToDuplicate));
      
      duplicatedProduct.id = newId;
      duplicatedProduct.name = `${productToDuplicate.name} (نسخة)`;
      
      toast(`تم تكرار المنتج "${productToDuplicate.name}" بنجاح كمنتج جديد`, 'success');
      return [...prev, duplicatedProduct];
    });
  }, [toast]);

  const handleUpdateProductAccountType = useCallback((productId, accountType) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, accountType } : p))
    );
  }, []);

  const handleImportProducts = useCallback((importedProducts) => {
    setProducts((prev) => {
      let maxId = prev.length > 0 ? Math.max(...prev.map((p) => p.id)) : 0;
      const newProducts = importedProducts.map((p) => {
        maxId += 1;
        return { ...p, id: maxId };
      });
      return [...prev, ...newProducts];
    });
    toast(`تم استيراد ${importedProducts.length} منتج بنجاح من سلة`, 'success');
  }, [toast]);

  // === Plan Management ===
  const handleAddPlan = useCallback((productId, durationId) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const newPlanId = Math.max(0, ...p.plans.map((pl) => pl.id)) + 1;
        const prices = {};
        suppliers.forEach((s) => { prices[s.id] = 0; });
        return {
          ...p,
          plans: [...p.plans, { id: newPlanId, durationId, prices }],
        };
      })
    );
  }, [suppliers]);

  const handleDeletePlan = useCallback((productId, planId) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        if (p.plans.length <= 1) return p; // keep at least 1 plan
        return { ...p, plans: p.plans.filter((pl) => pl.id !== planId) };
      })
    );
  }, []);

  const handleUpdatePlanDuration = useCallback((productId, planId, newDurationId) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          plans: p.plans.map((pl) =>
            pl.id === planId ? { ...pl, durationId: newDurationId } : pl
          ),
        };
      })
    );
  }, []);

  // === Supplier Management ===
  const handleUpdateSupplier = useCallback((supplierId, field, value) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === supplierId ? { ...s, [field]: value } : s))
    );
  }, []);

  const handleDeleteSupplier = useCallback((supplierId) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        plans: p.plans.map((plan) => {
          const newPrices = { ...plan.prices };
          delete newPrices[supplierId];
          return { ...plan, prices: newPrices };
        }),
      }))
    );
  }, []);

  const handleAddSupplier = useCallback((supplierData) => {
    const newId = Math.max(0, ...suppliers.map((s) => s.id)) + 1;
    const newSupplier = {
      id: newId,
      name: supplierData?.name || `مورد ${newId}`,
      whatsapp: supplierData?.whatsapp || '',
      telegram: supplierData?.telegram || '',
      g2g: supplierData?.g2g || '',
    };
    setSuppliers((prev) => [...prev, newSupplier]);
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        plans: p.plans.map((plan) => ({
          ...plan,
          prices: { ...plan.prices, [newId]: 0 },
        })),
      }))
    );
    toast(`تمت إضافة المورد "${newSupplier.name}" بنجاح`, 'success');
  }, [suppliers, toast]);

  // === Duration Management ===
  const handleAddDuration = useCallback((label, months) => {
    const newId = `month_${months}_${Date.now()}`;
    setDurations((prev) => [...prev, { id: newId, label, months }]);
  }, []);

  const handleDeleteDuration = useCallback((durationId) => {
    // Don't delete if it's in use
    const inUse = products.some((p) => p.plans.some((pl) => pl.durationId === durationId));
    if (inUse) {
      alert('لا يمكن حذف هذه المدة لأنها مستخدمة في خطط حالية');
      return;
    }
    setDurations((prev) => prev.filter((d) => d.id !== durationId));
  }, [products]);

  // === Activation Methods Management ===
  const handleToggleProductMethod = useCallback((productId, methodId) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const current = p.activationMethods || [];
        const updated = current.includes(methodId)
          ? current.filter((m) => m !== methodId)
          : [...current, methodId];
        return { ...p, activationMethods: updated };
      })
    );
  }, []);

  // === Official Price Management ===
  const handleUpdateOfficialPrice = useCallback((productId, planId, newUsdPrice) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          plans: p.plans.map((plan) =>
            plan.id === planId
              ? { ...plan, officialPriceUsd: parseFloat(newUsdPrice) || 0 }
              : plan
          ),
        };
      })
    );
  }, []);

  const handleUpdateWarranty = useCallback((productId, planId, days) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          plans: p.plans.map((plan) =>
            plan.id === planId
              ? { ...plan, warrantyDays: Math.max(0, parseInt(days) || 0) }
              : plan
          ),
        };
      })
    );
  }, []);

  const handleUpdateSupplierWarranty = useCallback((productId, planId, supplierId, days) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          plans: p.plans.map((plan) =>
            plan.id === planId
              ? {
                  ...plan,
                  supplierWarranty: {
                    ...(plan.supplierWarranty || {}),
                    [supplierId]: Math.max(0, parseInt(days) || 0),
                  },
                }
              : plan
          ),
        };
      })
    );
  }, []);

  // === Competitors Management ===
  const handleAddCompetitor = useCallback((productId, name, url) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const current = p.competitors || [];
        const newId = Math.max(0, ...current.map((c) => c.id)) + 1;
        return { ...p, competitors: [...current, { id: newId, name, url }] };
      })
    );
  }, []);

  const handleUpdateCompetitor = useCallback((productId, compId, field, value) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const current = p.competitors || [];
        return {
          ...p,
          competitors: current.map((c) =>
            c.id === compId ? { ...c, [field]: value } : c
          ),
        };
      })
    );
  }, []);

  const handleDeleteCompetitor = useCallback((productId, compId) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const current = p.competitors || [];
        return { ...p, competitors: current.filter((c) => c.id !== compId) };
      })
    );
  }, []);

  const handleAddActivationMethodType = useCallback((newMethod) => {
    setActivationMethods((prev) => [...prev, newMethod]);
  }, []);

  const handleDeleteActivationMethodType = useCallback((methodId) => {
    setActivationMethods((prev) => prev.filter((m) => m.id !== methodId));
    // Also remove from all products
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        activationMethods: (p.activationMethods || []).filter((m) => m !== methodId),
      }))
    );
  }, []);

  // === Data Management ===
  const handleResetData = useCallback(() => {
    setProducts(DEFAULT_PRODUCTS);
    setSuppliers(DEFAULT_SUPPLIERS);
    setExchangeRate(DEFAULT_EXCHANGE_RATE);
    setDurations(DEFAULT_DURATIONS);
  }, []);

  const handleImportData = useCallback((data) => {
    const migrated = migrateData(data);
    if (migrated.products) setProducts(migrated.products);
    if (migrated.suppliers) setSuppliers(migrated.suppliers);
    if (migrated.exchangeRate) setExchangeRate(migrated.exchangeRate);
    if (migrated.durations) setDurations(migrated.durations);
    if (migrated.costs) setCosts(migrated.costs);
    if (migrated.bundles) setBundles(migrated.bundles);
    if (migrated.coupons) setCoupons(migrated.coupons);
    if (migrated.pricingData) setPricingData(migrated.pricingData);
  }, []);

  const handleExportJson = useCallback(() => {
    const data = { products, suppliers, exchangeRate, durations, activationMethods, costs, bundles, coupons, pricingData };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'miftah_store_data.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [products, suppliers, exchangeRate, durations]);

  return (
    <div className="app-container" dir="rtl">
      {/* Skip to Content Link */}
      <a href="#main-content" className="skip-to-content">
        تخطي إلى المحتوى الرئيسي
      </a>

      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-right">
            <div className="logo">
              {customLogo ? (
                <img src={customLogo} alt="متجر مفتاح" className="logo-img custom-logo-img" />
              ) : (
                <>
                  <img src="/logo.png" alt="متجر مفتاح" className="logo-img" />
                </>
              )}
            </div>
          </div>
          <div className="header-left">
            {saveIndicator && (
              <span className="save-indicator" role="status" aria-live="polite">
                <CheckCircleIcon className="icon-sm" /> تم الحفظ
              </span>
            )}
            <button
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
              aria-label={darkMode ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
            >
              {darkMode ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="tab-nav-wrapper">
        <nav className="tab-nav" ref={tabNavRef} role="tablist" aria-label="التنقل الرئيسي">
          {TAB_LIST.map((tab) => {
            let alertCount = 0;
            if (tab.id === 'dashboard') {
              products.forEach(p => {
                const hasPrice = p.plans.some(plan => Object.values(plan.prices).some(v => v > 0));
                const hasOfficialPrice = p.plans.some(plan => plan.officialPriceUsd > 0);
                if (!hasPrice || !hasOfficialPrice) alertCount++;
              });
            }
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
                onKeyDown={handleTabKeyDown}
              >
                <span className="tab-icon"><tab.icon /></span>
                {tab.label}
                {alertCount > 0 && <span className="tab-badge">{alertCount}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Exchange Rate Bar - always visible */}
      <ExchangeRateBar
        exchangeRate={exchangeRate}
        onRateChange={setExchangeRate}
      />

      {/* Main Content */}
      <main className={`main-content ${pageTransition ? 'page-exit' : 'page-enter'}`} id="main-content">
        {activeTab === 'dashboard' && (
          <div role="tabpanel" id="panel-dashboard" aria-labelledby="tab-dashboard">
          <Dashboard
            products={products}
            suppliers={suppliers}
            durations={durations}
            exchangeRate={exchangeRate}
            bundles={bundles}
            costs={costs}
            pricingData={pricingData}
            coupons={coupons}
            activationMethods={activationMethods}
            onNavigate={handleTabChange}
          />
          </div>
        )}
        {activeTab === 'products' && (
          <div role="tabpanel" id="panel-products" aria-labelledby="tab-products">
          <ProductTable
            products={products}
            suppliers={suppliers}
            durations={durations}
            exchangeRate={exchangeRate}
            activationMethods={activationMethods}
            categories={categories}
            onUpdatePrice={handleUpdatePrice}
            onAddProduct={handleAddProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateProductName={handleUpdateProductName}
            onUpdateProductUrl={handleUpdateProductUrl}
            onUpdateProductAccountType={handleUpdateProductAccountType}
            onDuplicateProduct={handleDuplicateProduct}
            onAddPlan={handleAddPlan}
            onDeletePlan={handleDeletePlan}
            onUpdatePlanDuration={handleUpdatePlanDuration}
            onUpdateSupplier={handleUpdateSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            onAddSupplier={handleAddSupplier}
            onToggleProductMethod={handleToggleProductMethod}
            onAddActivationMethodType={handleAddActivationMethodType}
            onDeleteActivationMethodType={handleDeleteActivationMethodType}
            onUpdateOfficialPrice={handleUpdateOfficialPrice}
            onUpdateWarranty={handleUpdateWarranty}
            onUpdateSupplierWarranty={handleUpdateSupplierWarranty}
            onAddCompetitor={handleAddCompetitor}
            onUpdateCompetitor={handleUpdateCompetitor}
            onDeleteCompetitor={handleDeleteCompetitor}
            onImportProducts={handleImportProducts}
            onAddCategory={handleAddCategory}
          />
          </div>
        )}
        {activeTab === 'reports' && (
          <div role="tabpanel" id="panel-reports" aria-labelledby="tab-reports">
          <ReportsExport
            products={products}
            suppliers={suppliers}
            durations={durations}
            exchangeRate={exchangeRate}
            activationMethods={activationMethods}
            categories={categories}
          />
          </div>
        )}
        {activeTab === 'pricing' && (
          <div role="tabpanel" id="panel-pricing" aria-labelledby="tab-pricing">
          <PricingDashboard
            products={products}
            suppliers={suppliers}
            durations={durations}
            exchangeRate={exchangeRate}
            costs={costs}
            setCosts={setCosts}
            pricingData={pricingData}
            setPricingData={setPricingData}
            coupons={coupons}
            setCoupons={setCoupons}
          />
          </div>
        )}
        {activeTab === 'bundles' && (
          <div role="tabpanel" id="panel-bundles" aria-labelledby="tab-bundles">
          <BundleManager
            bundles={bundles}
            setBundles={setBundles}
            products={products}
            suppliers={suppliers}
            exchangeRate={exchangeRate}
            pricingData={pricingData}
            costs={costs}
          />
          </div>
        )}
        {activeTab === 'features' && (
          <div role="tabpanel" id="panel-features" aria-labelledby="tab-features">
          <ProductFeatures
            products={products}
            setProducts={setProducts}
            durations={durations}
            suppliers={suppliers}
            exchangeRate={exchangeRate}
            activationMethods={activationMethods}
          />
          </div>
        )}
        {activeTab === 'settings' && (
          <div role="tabpanel" id="panel-settings" aria-labelledby="tab-settings">
          <SettingsPage
            exchangeRate={exchangeRate}
            onRateChange={setExchangeRate}
            onResetData={handleResetData}
            onExportJson={handleExportJson}
            onImportData={handleImportData}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
            durations={durations}
            onAddDuration={handleAddDuration}
            onDeleteDuration={handleDeleteDuration}
            products={products}
            suppliers={suppliers}
            bundles={bundles}
            customLogo={customLogo}
            onLogoChange={setCustomLogo}
            appSettings={appSettings}
            onAppSettingsChange={setAppSettings}
          />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-brand">
            {customLogo ? (
              <img src={customLogo} alt="" className="footer-logo custom-logo-img" />
            ) : (
              <img src="/logo.png" alt="" className="footer-logo" />
            )}
            <span>متجر مفتاح</span>
          </div>
          <p className="footer-copy">© {new Date().getFullYear()} متجر مفتاح — إدارة المنتجات والأسعار الرقمية</p>
          <div className="footer-stats">
            <span>{products.length} منتج</span>
            <span className="footer-dot">·</span>
            <span>{suppliers.length} مورد</span>
            <span className="footer-dot">·</span>
            <span>{bundles.length} حزمة</span>
          </div>
        </div>
      </footer>

      {showBackToTop && (
        <button className="back-to-top" onClick={scrollToTop} title="العودة للأعلى" aria-label="العودة للأعلى">
          ↑
        </button>
      )}
    </div>
  );
}

export default App;
