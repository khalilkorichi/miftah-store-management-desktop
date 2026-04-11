import React, { useState, useEffect } from 'react';
import { PackageIcon, EditIcon, DollarSignIcon, SaveIcon, StarIcon, CheckIcon } from '../Icons';
import { useNotifications } from '../NotificationContext';

const fmt = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function BundleBuilder({ bundles, setBundles, products, getSupplierPrice, setActiveSubTab, bundleToEdit, setBundleToEdit }) {
  const [bundleName, setBundleName] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (bundleToEdit) {
      setBundleName(bundleToEdit.name || '');
      setSelectedProducts(bundleToEdit.productIds || []);
    } else {
      setBundleName('');
      setSelectedProducts([]);
    }
  }, [bundleToEdit]);

  const handleToggleProduct = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const handleCreateOrUpdateBundle = (e) => {
    e.preventDefault();
    if (!bundleName.trim() || selectedProducts.length < 2) {
      alert("الرجاء إدخال اسم الحزمة واختيار منتجين على الأقل.");
      return;
    }

    const totalBaseCost = selectedProducts.reduce((sum, pId) => {
      const p = products.find(prod => prod.id === pId);
      return sum + getSupplierPrice(p);
    }, 0);

    if (bundleToEdit) {
      const updatedBundles = bundles.map(b => 
        b.id === bundleToEdit.id 
          ? { ...b, name: bundleName, productIds: selectedProducts, totalSupplierCost: totalBaseCost }
          : b
      );
      setBundles(updatedBundles);
      setBundleToEdit(null);
      setActiveSubTab('overview');
      addNotification({ type: 'info', title: 'تم تعديل حزمة', description: `تم تحديث "${bundleName}"`, category: 'bundles', actionTab: 'bundles' });
    } else {
      const newBundle = {
        id: `bundle_${Date.now()}`,
        name: bundleName,
        productIds: selectedProducts,
        sellingPrice: 0,
        totalSupplierCost: totalBaseCost,
        createdAt: new Date().toISOString()
      };
      setBundles([...bundles, newBundle]);
      setBundleName('');
      setSelectedProducts([]);
      setActiveSubTab('pricing');
      addNotification({ type: 'success', title: 'تم إنشاء حزمة جديدة', description: `"${bundleName}" تحتوي على ${selectedProducts.length} منتجات`, category: 'bundles', actionTab: 'bundles', playSound: true });
    }
  };

  const handleCancelEdit = () => {
    setBundleToEdit(null);
    setActiveSubTab('overview');
  };

  const totalCost = selectedProducts.reduce((sum, pId) => {
    const p = products.find(prod => prod.id === pId);
    return sum + getSupplierPrice(p);
  }, 0);

  return (
    <div className="bb-container">
      <div className="bb-card">
        <div className="cpn-card-header">
          <span className="cpn-card-icon flex-row align-center justify-center">{bundleToEdit ? <EditIcon className="icon-lg" /> : <PackageIcon className="icon-lg" />}</span>
          <div>
            <h3>{bundleToEdit ? 'تعديل الحزمة' : 'تكوين وتجميع حزمة جديدة'}</h3>
            <p>{bundleToEdit ? 'قم بتعديل المنتجات المدرجة ضمن هذه الحزمة' : 'اختر المنتجات التي ترغب في دمجها معاً كحزمة واحدة للعميل'}</p>
          </div>
        </div>
        
        <form onSubmit={handleCreateOrUpdateBundle}>
          {/* Bundle Name */}
          <div className="bb-name-section">
            <div className="cpn-field">
              <label>اسم الحزمة</label>
              <input 
                type="text" 
                value={bundleName} 
                onChange={e=>setBundleName(e.target.value)} 
                placeholder="مثال: الباقة الذهبية الشاملة" 
                required 
              />
            </div>
          </div>
          
          {/* Product Selector */}
          <div className="bb-products-section">
            <div className="bb-products-label">
              <span className="flex-row align-center justify-center"><PackageIcon className="icon-sm" /></span>
              <span>اختر المنتجات (منتجين على الأقل)</span>
              <span className="bb-selected-count">{selectedProducts.length} محدد</span>
            </div>
            <div className="bb-products-grid">
              {products.map(p => {
                const isSelected = selectedProducts.includes(p.id);
                return (
                  <div 
                    key={p.id} 
                    className={`bb-product-card ${isSelected ? 'bb-selected' : ''}`}
                    onClick={() => handleToggleProduct(p.id)}
                  >
                    <div className="bb-check flex-row align-center justify-center">
                      {isSelected ? <CheckIcon className="icon-xs" /> : null}
                    </div>
                    <div className="bb-product-info">
                      <h4>{p.name}</h4>
                      <span>{fmt(getSupplierPrice(p))} ر.س</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary & Submit */}
          <div className="bb-footer" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            {selectedProducts.length >= 2 && (
              <div className="bb-cost-summary">
                <span className="flex-row align-center justify-center"><DollarSignIcon className="icon-sm" /></span>
                <span>إجمالي تكلفة المورد للحزمة: <strong>{fmt(totalCost)} ر.س</strong></span>
              </div>
            )}
            <div style={{ marginRight: 'auto', display: 'flex', gap: '10px' }}>
              {bundleToEdit && (
                <button type="button" className="cm-cancel-btn" onClick={handleCancelEdit} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  إلغاء التعديل
                </button>
              )}
              <button type="submit" className="cpn-submit-btn flex-row align-center gap-2">
                {bundleToEdit ? <SaveIcon className="icon-sm" /> : <StarIcon className="icon-sm" />}
                {bundleToEdit ? 'حفظ التعديلات' : 'حفظ وتكوين الحزمة'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BundleBuilder;
