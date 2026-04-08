import React, { useState, useMemo } from 'react';
import AddProductModal from './AddProductModal';
import AddSupplierModal from './AddSupplierModal';
import ActivationMethodsModal from './ActivationMethodsModal';
import ImportSallaModal from './ImportSallaModal';
import ConfirmModal from './ConfirmModal';
import CompetitorsModal from './CompetitorsModal';
import ProductDetailModal from './ProductDetailModal';
import {
  MessageCircleIcon, SendIcon, ShoppingCartIcon, EditIcon, XIcon,
  TagIcon, ChevronDownIcon, ChevronLeftIcon, TrashIcon, PlusCircleIcon,
  EyeIcon, StarIcon, PackageIcon, SearchIcon, PlusIcon, SettingsIcon,
  UserIcon, UsersIcon, CopyIcon, UploadIcon, ShieldCheckIcon,
  FilterIcon, GitBranchIcon, SortIcon, ClipboardIcon
} from './Icons';

function PasteBtn({ onPaste, className = '' }) {
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) onPaste(text.trim());
    } catch {
      // clipboard access denied
    }
  };
  return (
    <button type="button" className={`paste-btn ${className}`} onClick={handlePaste} title="لصق من الحافظة">
      <ClipboardIcon className="icon-xs" />
    </button>
  );
}

const fmtNum = (val) => {
  if (val === null || val === undefined) return '0';
  return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

function SupplierManagerPanel({ suppliers, editingSupplierField, editSupplierValue, setEditSupplierValue, handleStartEditSupplier, handleSaveSupplier, onDeleteSupplier, onAddSupplier, requestConfirm, setShowAddSupplier }) {
  const [isOpen, setIsOpen] = useState(false);

  const renderContactLink = (supplier, type, icon, label, color) => {
    const isEditing = editingSupplierField === `${supplier.id}-${type}`;
    const value = supplier[type];

    if (isEditing) {
      const placeholder = type === 'whatsapp' ? 'رقم الهاتف' : type === 'telegram' ? 'اليوزرنيم' : 'رابط G2G';
      return (
        <input
          key={type}
          type="text"
          value={editSupplierValue}
          onChange={(e) => setEditSupplierValue(e.target.value)}
          onBlur={() => handleSaveSupplier(supplier.id, type)}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveSupplier(supplier.id, type)}
          placeholder={placeholder}
          autoFocus
          className="contact-input"
          dir="ltr"
        />
      );
    }

    if (value) {
      const safeUrl = type === 'whatsapp' ? `https://wa.me/${value.replace(/[^0-9]/g, '')}` : type === 'telegram' ? `https://t.me/${value.replace('@', '')}` : (/^https?:\/\//i.test(value) ? value : `https://${value}`);
      return (
        <div key={type} className={`supplier-contact-link ${type}`} style={{ '--chip-color': color }} title={`${label}: ${value}`}>
          <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="contact-link-inner">
            <span className="chip-icon">{icon}</span>
            <span>{label}</span>
          </a>
          <div className="supplier-contact-actions">
            <button className="chip-copy-btn" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(safeUrl); const btn = e.currentTarget; btn.classList.add('copied'); setTimeout(() => btn.classList.remove('copied'), 1200); }} title="نسخ الرابط">
              <CopyIcon className="icon-sm" />
            </button>
            <button className="chip-edit-btn" onClick={(e) => { e.stopPropagation(); handleStartEditSupplier(supplier.id, type, value); }} title="تعديل">
              <EditIcon className="icon-sm" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <button key={type} className="supplier-contact-link empty" onClick={() => handleStartEditSupplier(supplier.id, type, '')}>
        <span className="chip-icon">{icon}</span>
        <span>+ {label}</span>
      </button>
    );
  };

  return (
    <div className="supplier-manager-panel">
      <button className="supplier-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
        <UsersIcon className="icon-sm" />
        <span>إدارة الموردين ({suppliers.length})</span>
        {isOpen ? <ChevronDownIcon className="icon-sm" /> : <ChevronLeftIcon className="icon-sm" />}
      </button>
      {isOpen && (
        <div className="supplier-panel-content">
          <div className="supplier-cards-grid">
            {suppliers.map((supplier) => {
              const isEditingName = editingSupplierField === `${supplier.id}-name`;
              return (
                <div key={supplier.id} className="supplier-mini-card">
                  <div className="supplier-mini-header">
                    {isEditingName ? (
                      <input type="text" value={editSupplierValue} onChange={(e) => setEditSupplierValue(e.target.value)} onBlur={() => handleSaveSupplier(supplier.id, 'name')} onKeyDown={(e) => e.key === 'Enter' && handleSaveSupplier(supplier.id, 'name')} autoFocus className="inline-edit-input" />
                    ) : (
                      <span className="supplier-mini-name" onClick={() => handleStartEditSupplier(supplier.id, 'name', supplier.name)} title="انقر للتعديل">{supplier.name}</span>
                    )}
                    <button className="btn-icon-danger" onClick={() => requestConfirm('حذف المورد', `هل أنت متأكد من رغبتك في حذف المورد "${supplier.name}"؟`, () => onDeleteSupplier(supplier.id))} title="حذف المورد">
                      <XIcon className="icon-sm" />
                    </button>
                  </div>
                  <div className="supplier-mini-contacts">
                    {renderContactLink(supplier, 'whatsapp', <MessageCircleIcon className="icon-sm" />, 'واتساب', '#25d366')}
                    {renderContactLink(supplier, 'telegram', <SendIcon className="icon-sm" />, 'تيليجرام', '#0088cc')}
                    {renderContactLink(supplier, 'g2g', <ShoppingCartIcon className="icon-sm" />, 'G2G', '#ff6600')}
                  </div>
                </div>
              );
            })}
          </div>
          <button className="btn-add-supplier-panel" onClick={() => setShowAddSupplier(true)}>
            <PlusIcon className="icon-sm" /> إضافة مورد جديد
          </button>
        </div>
      )}
    </div>
  );
}

function ProductCard({
  product, index, suppliers, durations, exchangeRate, activationMethods,
  editingCell, setEditingCell, editValue, setEditValue,
  editingName, setEditingName, editNameValue, setEditNameValue,
  onUpdatePrice, onDeleteProduct, onDuplicateProduct, onUpdateProductName,
  onUpdateProductAccountType, onAddPlan, onDeletePlan, onUpdatePlanDuration,
  onToggleProductMethod, onUpdateOfficialPrice, onUpdateWarranty, requestConfirm,
  setActivationModalProduct, setCompetitorsModalProduct, setDetailModalProduct,
  getDurationLabel, getAvailableDurations,
  onAddBranch, parentProduct, allProducts
}) {
  const [addingPlan, setAddingPlan] = useState(false);

  const isBranch = !!product.parentId;
  const branchCount = allProducts ? allProducts.filter(p => p.parentId === product.id).length : 0;

  const assignedMethods = (product.activationMethods || [])
    .map((mId) => activationMethods.find((x) => x.id === mId))
    .filter(Boolean);

  const handleCycleAccountType = () => {
    const current = product.accountType || 'none';
    const next = current === 'none' ? 'individual' : current === 'individual' ? 'team' : 'none';
    if (onUpdateProductAccountType) onUpdateProductAccountType(product.id, next);
  };

  const handleStartEditName = () => {
    setEditingName(product.id);
    setEditNameValue(product.name);
  };

  const handleSaveName = () => {
    if (editNameValue.trim()) {
      onUpdateProductName(product.id, editNameValue.trim());
    }
    setEditingName(null);
  };

  const findBestPriceForPlan = (plan) => {
    let min = Infinity;
    let bestSupplierId = null;
    for (const [sid, price] of Object.entries(plan.prices)) {
      if (price > 0 && price < min) {
        min = price;
        bestSupplierId = parseInt(sid);
      }
    }
    return bestSupplierId;
  };

  const availableDurations = getAvailableDurations(product);

  return (
    <div className={`product-card ${isBranch ? 'product-card--branch' : ''}`}>
      {isBranch && parentProduct && (
        <div className="product-branch-indicator">
          <GitBranchIcon className="icon-xs" />
          <span>فرع من: <strong>{parentProduct.name}</strong></span>
        </div>
      )}
      <div className="product-card-header">
        <div className="product-card-title-row">
          <span className="product-card-index">{isBranch ? '↳' : index + 1}</span>
          <div className="product-card-name-area">
            {editingName === product.id ? (
              <div className="inline-edit-with-paste">
                <input
                  type="text"
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  autoFocus
                  className="inline-edit-input product-card-name-input"
                  dir="rtl"
                />
                <PasteBtn onPaste={(t) => setEditNameValue(t)} />
              </div>
            ) : (
              <h3 className="product-card-name" onClick={handleStartEditName} title="انقر للتعديل">
                {product.name}
              </h3>
            )}
            <div className={`account-type-badge type-${product.accountType || 'none'}`} onClick={handleCycleAccountType} title={`نوع الحساب: ${product.accountType === 'individual' ? 'فردي' : product.accountType === 'team' ? 'فريق' : 'غير محدد'} (انقر للتغيير)`}>
              {(product.accountType || 'none') === 'none' && <UserIcon className="icon-xs" style={{ opacity: 0.5 }} />}
              {product.accountType === 'individual' && <><UserIcon className="icon-xs" /> <span>فردي</span></>}
              {product.accountType === 'team' && <><UsersIcon className="icon-xs" /> <span>فريق</span></>}
            </div>
            {branchCount > 0 && (
              <span className="product-branch-count" title={`${branchCount} فرع`}>
                <GitBranchIcon className="icon-xs" /> {branchCount}
              </span>
            )}
          </div>
        </div>

        <div className="product-card-actions-top">
          <button className="btn-card-action branch" onClick={() => onAddBranch?.(product.id)} title="إضافة فرع لهذا المنتج">
            <GitBranchIcon className="icon-sm" />
          </button>
          <button className="btn-card-action" onClick={() => onDuplicateProduct(product.id)} title="تكرار المنتج">
            <CopyIcon className="icon-sm" />
          </button>
          <button className="btn-card-action danger" onClick={() => requestConfirm('حذف منتج', `هل أنت متأكد من رغبتك في حذف المنتج "${product.name}"؟ سيتم حذف جميع خططه أيضاً.`, () => onDeleteProduct(product.id))} title="حذف المنتج">
            <TrashIcon className="icon-sm" />
          </button>
        </div>
      </div>

      <div className="product-card-meta">
        {assignedMethods.length > 0 && (
          <div className="product-card-methods">
            {assignedMethods.map((m) => (
              <span key={m.id} className="act-chip" style={{ '--act-color': m.color }} title={m.description || m.label}>
                {m.icon} {m.label}
              </span>
            ))}
          </div>
        )}
        <div className="product-card-quick-actions">
          <button className="btn-chip-action" onClick={() => setActivationModalProduct({ id: product.id })} title="إدارة طرق التفعيل">
            {assignedMethods.length === 0 ? <><PlusCircleIcon className="icon-xs" /> طريقة تفعيل</> : <><SettingsIcon className="icon-xs" /> التفعيل</>}
          </button>
          <button className="btn-chip-action competitors" onClick={() => setCompetitorsModalProduct(product)} title="مراقبة المنافسين">
            <EyeIcon className="icon-xs" /> المنافسين {product.competitors?.length > 0 ? `(${product.competitors.length})` : ''}
          </button>
        </div>
      </div>

      <div className="product-card-plans">
        <div className="plans-header-row">
          <span className="plans-label">
            <TagIcon className="icon-sm" /> الخطط ({product.plans.length})
          </span>
          <button className="btn-toggle-plans" onClick={() => setDetailModalProduct(product)}>
            عرض التفاصيل
            <ChevronLeftIcon className="icon-sm" />
          </button>
        </div>

        <div className="plans-summary">
          {product.plans.map((plan) => {
            const bestSupplierId = findBestPriceForPlan(plan);
            const bestPrice = bestSupplierId ? plan.prices[bestSupplierId] : null;
            return (
              <div key={plan.id} className="plan-summary-chip">
                <span className="plan-chip-duration">{getDurationLabel(plan.durationId)}</span>
                {bestPrice ? (
                  <span className="plan-chip-price best">{fmtNum(bestPrice * (exchangeRate || 1))} ر.س</span>
                ) : (
                  <span className="plan-chip-price empty">غير مسعّر</span>
                )}
                {(plan.warrantyDays > 0) && (
                  <span className="plan-chip-warranty" title={`ضمان ${plan.warrantyDays} يوم`}>
                    <ShieldCheckIcon className="icon-xs" /> {plan.warrantyDays}
                  </span>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

function ProductTable({
  products, suppliers, durations, exchangeRate, activationMethods = [],
  categories = [], onAddCategory,
  onUpdatePrice, onAddProduct, onDeleteProduct, onDuplicateProduct,
  onUpdateProductName, onUpdateProductUrl, onUpdateProductAccountType, onAddPlan, onDeletePlan,
  onUpdatePlanDuration, onUpdateSupplier, onDeleteSupplier, onAddSupplier,
  onToggleProductMethod, onAddActivationMethodType, onDeleteActivationMethodType,
  onUpdateOfficialPrice, onUpdateWarranty, onUpdateSupplierWarranty, onAddCompetitor, onUpdateCompetitor, onDeleteCompetitor,
  onImportProducts,
  onUpdateSupplierActivationMethod, onAddBranch, onUpdateSupplierPlanLink,
}) {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editingName, setEditingName] = useState(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [editingSupplierField, setEditingSupplierField] = useState(null);
  const [editSupplierValue, setEditSupplierValue] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [competitorsModalProduct, setCompetitorsModalProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [detailModalProductId, setDetailModalProductId] = useState(null);
  const [activationModalProductId, setActivationModalProductId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | main | branches
  const [sortBy, setSortBy] = useState('default'); // default | name_asc | name_desc | price_asc | price_desc

  const detailModalProduct = detailModalProductId ? products.find(p => p.id === detailModalProductId) || null : null;
  const activationModalProduct = activationModalProductId ? products.find(p => p.id === activationModalProductId) || null : null;

  const getProductLowestPrice = (p) => {
    let min = Infinity;
    for (const plan of p.plans || []) {
      for (const price of Object.values(plan.prices || {})) {
        if (price > 0 && price < min) min = price;
      }
    }
    return min === Infinity ? null : min;
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (searchQuery.trim()) {
      result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (filterType === 'main') result = result.filter(p => !p.parentId);
    else if (filterType === 'branches') result = result.filter(p => !!p.parentId);
    if (filterSupplier) {
      result = result.filter(p =>
        p.plans?.some(plan => (plan.prices?.[parseInt(filterSupplier)] || 0) > 0)
      );
    }
    if (filterCategory) {
      result = result.filter(p => p.categoryId === filterCategory);
    }
    if (sortBy === 'name_asc') result.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    else if (sortBy === 'name_desc') result.sort((a, b) => b.name.localeCompare(a.name, 'ar'));
    else if (sortBy === 'price_asc') {
      result.sort((a, b) => {
        const pa = getProductLowestPrice(a) ?? Infinity;
        const pb = getProductLowestPrice(b) ?? Infinity;
        return pa - pb;
      });
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => {
        const pa = getProductLowestPrice(a) ?? -Infinity;
        const pb = getProductLowestPrice(b) ?? -Infinity;
        return pb - pa;
      });
    }
    return result;
  }, [products, searchQuery, filterSupplier, filterCategory, filterType, sortBy]);

  const activeFiltersCount = [filterSupplier, filterCategory, filterType !== 'all', sortBy !== 'default'].filter(Boolean).length;

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const requestConfirm = (title, message, onConfirm) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm: () => { onConfirm(); setConfirmDialog((prev) => ({ ...prev, isOpen: false })); } });
  };
  const closeConfirm = () => setConfirmDialog((prev) => ({ ...prev, isOpen: false }));

  const getDurationLabel = (durationId) => {
    const dur = durations.find((d) => d.id === durationId);
    return dur ? dur.label : durationId;
  };

  const getAvailableDurations = (product) => {
    const usedIds = product.plans.map((p) => p.durationId);
    return durations.filter((d) => !usedIds.includes(d.id));
  };

  const handleStartEditSupplier = (supplierId, field, currentVal) => {
    setEditingSupplierField(`${supplierId}-${field}`);
    setEditSupplierValue(currentVal);
  };

  const handleSaveSupplier = (supplierId, field) => {
    onUpdateSupplier(supplierId, field, editSupplierValue);
    setEditingSupplierField(null);
  };

  return (
    <div className="product-cards-container">
      <div className="cards-toolbar">
        <div className="toolbar-actions">
          <button className="btn-add-product" onClick={() => setShowAddProduct(true)}>
            <PlusIcon className="icon-sm" /> إضافة منتج
          </button>
          <button className="btn-import-salla" onClick={() => setShowImport(true)}>
            <UploadIcon className="icon-sm" /> استيراد من سلة
          </button>
        </div>
        <div className="toolbar-search">
          <div className="search-input-wrap">
            <SearchIcon className="search-icon icon-sm" />
            <input type="text" className="search-bar" placeholder="بحث عن منتج..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>
                <XIcon className="icon-xs" />
              </button>
            )}
          </div>
          <button
            className={`btn-filter-toggle ${showFilters ? 'active' : ''} ${activeFiltersCount > 0 ? 'has-filters' : ''}`}
            onClick={() => setShowFilters(v => !v)}
            title="فلترة وترتيب"
          >
            <FilterIcon className="icon-sm" />
            {activeFiltersCount > 0 && <span className="filter-badge">{activeFiltersCount}</span>}
          </button>
        </div>
      </div>

      {/* ── Advanced Filter Panel ── */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-panel-row">
            <div className="filter-group">
              <label className="filter-label">نوع المنتج</label>
              <div className="filter-chips">
                {[['all','الكل'],['main','رئيسية'],['branches','فروع']].map(([v,l]) => (
                  <button key={v} className={`filter-chip ${filterType === v ? 'active' : ''}`} onClick={() => setFilterType(v)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <label className="filter-label">الترتيب</label>
              <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="default">الافتراضي</option>
                <option value="name_asc">الاسم أ → ي</option>
                <option value="name_desc">الاسم ي → أ</option>
                <option value="price_asc">السعر: الأقل أولاً</option>
                <option value="price_desc">السعر: الأعلى أولاً</option>
              </select>
            </div>
          </div>
          <div className="filter-panel-row">
            <div className="filter-group">
              <label className="filter-label">تصفية حسب المورد</label>
              <select className="filter-select" value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)}>
                <option value="">جميع الموردين</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            {categories.length > 0 && (
              <div className="filter-group">
                <label className="filter-label">الفئة</label>
                <select className="filter-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                  <option value="">جميع الفئات</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
            )}
            {activeFiltersCount > 0 && (
              <button className="filter-reset-btn" onClick={() => { setFilterSupplier(''); setFilterCategory(''); setFilterType('all'); setSortBy('default'); }}>
                <XIcon className="icon-xs" /> إعادة تعيين
              </button>
            )}
          </div>
          <div className="filter-panel-summary">
            {filteredProducts.length} منتج {filteredProducts.length !== products.length ? `من أصل ${products.length}` : ''}
          </div>
        </div>
      )}

      <SupplierManagerPanel
        suppliers={suppliers}
        editingSupplierField={editingSupplierField}
        editSupplierValue={editSupplierValue}
        setEditSupplierValue={setEditSupplierValue}
        handleStartEditSupplier={handleStartEditSupplier}
        handleSaveSupplier={handleSaveSupplier}
        onDeleteSupplier={onDeleteSupplier}
        onAddSupplier={onAddSupplier}
        requestConfirm={requestConfirm}
        setShowAddSupplier={setShowAddSupplier}
      />

      {filteredProducts.length > 0 ? (
        <div className="products-grid">
          {filteredProducts.map((product, index) => {
            const parentProduct = product.parentId ? products.find(p => p.id === product.parentId) : null;
            return (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                suppliers={suppliers}
                durations={durations}
                exchangeRate={exchangeRate}
                activationMethods={activationMethods}
                editingCell={editingCell}
                setEditingCell={setEditingCell}
                editValue={editValue}
                setEditValue={setEditValue}
                editingName={editingName}
                setEditingName={setEditingName}
                editNameValue={editNameValue}
                setEditNameValue={setEditNameValue}
                onUpdatePrice={onUpdatePrice}
                onDeleteProduct={onDeleteProduct}
                onDuplicateProduct={onDuplicateProduct}
                onUpdateProductName={onUpdateProductName}
                onUpdateProductAccountType={onUpdateProductAccountType}
                onAddPlan={onAddPlan}
                onDeletePlan={onDeletePlan}
                onUpdatePlanDuration={onUpdatePlanDuration}
                onToggleProductMethod={onToggleProductMethod}
                onUpdateOfficialPrice={onUpdateOfficialPrice}
                onUpdateWarranty={onUpdateWarranty}
                requestConfirm={requestConfirm}
                setActivationModalProduct={(p) => setActivationModalProductId(p ? p.id : null)}
                setCompetitorsModalProduct={setCompetitorsModalProduct}
                setDetailModalProduct={(p) => setDetailModalProductId(p ? p.id : null)}
                getDurationLabel={getDurationLabel}
                getAvailableDurations={getAvailableDurations}
                onAddBranch={onAddBranch}
                parentProduct={parentProduct}
                allProducts={products}
              />
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <PackageIcon className="empty-icon icon-xl" />
          <p>{searchQuery || activeFiltersCount > 0 ? 'لا توجد نتائج مطابقة للفلتر المحدد' : 'لا توجد منتجات حالياً. أضف منتجاً جديداً للبدء!'}</p>
          {activeFiltersCount > 0 && (
            <button className="filter-reset-btn" style={{ margin: '12px auto 0', display: 'flex' }} onClick={() => { setFilterSupplier(''); setFilterCategory(''); setFilterType('all'); setSortBy('default'); }}>
              <XIcon className="icon-xs" /> إزالة الفلاتر
            </button>
          )}
        </div>
      )}

      <AddProductModal isOpen={showAddProduct} onClose={() => setShowAddProduct(false)} onConfirm={(productData) => onAddProduct(productData.name, productData.plans, productData.activationMethods, productData.accountType || 'none', productData.storeUrl || '', productData.categoryId || null)} durations={durations} suppliers={suppliers} allMethods={activationMethods} categories={categories} onCreateCategory={onAddCategory} />
      <AddSupplierModal isOpen={showAddSupplier} onClose={() => setShowAddSupplier(false)} onConfirm={(supplierData) => onAddSupplier(supplierData)} />
      <ActivationMethodsModal isOpen={!!activationModalProduct} product={activationModalProduct} onClose={() => setActivationModalProductId(null)} allMethods={activationMethods} onToggleMethod={onToggleProductMethod} onAddMethodType={onAddActivationMethodType} onDeleteMethodType={onDeleteActivationMethodType} />
      <CompetitorsModal isOpen={!!competitorsModalProduct} product={competitorsModalProduct} onClose={() => setCompetitorsModalProduct(null)} onAddCompetitor={onAddCompetitor} onUpdateCompetitor={onUpdateCompetitor} onDeleteCompetitor={onDeleteCompetitor} />
      <ConfirmModal isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={closeConfirm} />
      <ImportSallaModal isOpen={showImport} onClose={() => setShowImport(false)} onImport={(importedProducts) => { onImportProducts(importedProducts); setShowImport(false); }} existingProducts={products} durations={durations} suppliers={suppliers} />
      <ProductDetailModal
        isOpen={!!detailModalProduct}
        product={detailModalProduct}
        suppliers={suppliers}
        durations={durations}
        exchangeRate={exchangeRate}
        activationMethods={activationMethods}
        onClose={() => setDetailModalProductId(null)}
        onUpdatePrice={onUpdatePrice}
        onUpdateOfficialPrice={onUpdateOfficialPrice}
        onUpdateWarranty={onUpdateWarranty}
        onUpdateSupplierWarranty={onUpdateSupplierWarranty}
        onUpdateProductUrl={onUpdateProductUrl}
        onAddPlan={onAddPlan}
        onDeletePlan={onDeletePlan}
        getDurationLabel={getDurationLabel}
        getAvailableDurations={getAvailableDurations}
        requestConfirm={requestConfirm}
        onUpdateSupplierActivationMethod={onUpdateSupplierActivationMethod}
        onUpdateSupplierPlanLink={onUpdateSupplierPlanLink}
      />
    </div>
  );
}

export default ProductTable;
