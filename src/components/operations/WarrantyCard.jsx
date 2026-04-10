import React from 'react';
import {
  ShieldCheckIcon, EditIcon, TrashIcon, CheckCircleIcon,
  AlertTriangleIcon, ClockIcon, UserIcon, TagIcon, MessageCircleIcon, SendIcon
} from '../Icons';

export function getWarrantyEndDate(warranty) {
  if (warranty.warrantyType === 'subscription') {
    return warranty.subscriptionEndDate || null;
  }
  if (warranty.warrantyType === 'days' && warranty.purchaseDate && warranty.warrantyDays > 0) {
    const [y, m, d] = warranty.purchaseDate.split('-').map(Number);
    const end = new Date(Date.UTC(y, m - 1, d + Number(warranty.warrantyDays)));
    return end.toISOString().split('T')[0];
  }
  return null;
}

export function getWarrantyStatus(warranty) {
  const endDate = getWarrantyEndDate(warranty);
  if (!endDate) return { status: 'unknown', diffDays: null };
  const n = new Date();
  const todayMs = Date.UTC(n.getFullYear(), n.getMonth(), n.getDate());
  const [y, mo, d] = endDate.split('-').map(Number);
  const endMs = Date.UTC(y, mo - 1, d);
  const diffDays = Math.round((endMs - todayMs) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { status: 'expired', diffDays };
  if (diffDays === 0) return { status: 'today', diffDays };
  if (diffDays <= 7) return { status: 'soon', diffDays };
  return { status: 'active', diffDays };
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('ar-SA', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return dateStr; }
}

export default function WarrantyCard({
  warranty, productName, supplier, durations, products, onEdit, onDelete,
}) {
  const { status, diffDays } = getWarrantyStatus(warranty);

  const getPlanLabel = () => {
    if (!warranty.planId || !products) return null;
    const product = products.find(p => String(p.id) === String(warranty.productId));
    if (!product) return null;
    const plan = (product.plans || []).find(pl => pl.id === warranty.planId);
    if (!plan) return null;
    const dur = (durations || []).find(d => d.id === plan.durationId);
    return dur?.label || plan.durationId;
  };

  const planLabel = getPlanLabel();
  const endDate = getWarrantyEndDate(warranty);

  function cardClass() {
    if (status === 'expired') return 'warranty-card warranty-card-expired';
    if (status === 'today') return 'warranty-card warranty-card-today';
    if (status === 'soon') return 'warranty-card warranty-card-soon';
    return 'warranty-card';
  }

  function renderBadge() {
    if (status === 'expired') return (
      <span className="warranty-days-badge warranty-badge-expired">
        <AlertTriangleIcon className="icon-xs" />
        منتهٍ منذ {Math.abs(diffDays)} يوم
      </span>
    );
    if (status === 'today') return (
      <span className="warranty-days-badge warranty-badge-today">
        <ClockIcon className="icon-xs" />
        ينتهي اليوم!
      </span>
    );
    if (status === 'soon') return (
      <span className="warranty-days-badge warranty-badge-soon">
        <ClockIcon className="icon-xs" />
        {diffDays === 1 ? 'ينتهي غداً' : `ينتهي خلال ${diffDays} أيام`}
      </span>
    );
    return (
      <span className="warranty-days-badge warranty-badge-active">
        <CheckCircleIcon className="icon-xs" />
        {diffDays} يوم متبقي
      </span>
    );
  }

  return (
    <div className={cardClass()}>
      <div className="warranty-card-shield">
        <ShieldCheckIcon className="icon-md" />
      </div>

      <div className="warranty-card-body">
        <div className="warranty-card-row-top">
          <div className="warranty-card-customer">
            <UserIcon className="icon-xs" />
            <span className="warranty-customer-name">{warranty.customerName}</span>
            {warranty.customerWhatsapp && (
              <a
                href={`https://wa.me/${warranty.customerWhatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="warranty-wa-btn"
                title="واتساب العميل"
              >
                <MessageCircleIcon className="icon-xs" />
              </a>
            )}
          </div>
          <div className="warranty-card-badges">
            {renderBadge()}
          </div>
        </div>

        <div className="warranty-card-meta">
          <div className="warranty-meta-item">
            <TagIcon className="icon-xs" />
            <span>{productName || 'منتج غير معروف'}</span>
            {planLabel && (
              <span className="warranty-plan-badge">{planLabel}</span>
            )}
          </div>
          {supplier && (
            <div className="warranty-meta-item">
              <ShieldCheckIcon className="icon-xs" />
              <span>{supplier.name}</span>
              {supplier.whatsapp && (
                <a
                  href={`https://wa.me/${supplier.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="warranty-contact-btn warranty-contact-wa"
                  title="واتساب المورد"
                >
                  <MessageCircleIcon className="icon-xs" />
                </a>
              )}
              {supplier.telegram && (
                <a
                  href={`https://t.me/${supplier.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="warranty-contact-btn warranty-contact-tg"
                  title="تيليجرام المورد"
                >
                  <SendIcon className="icon-xs" />
                </a>
              )}
            </div>
          )}
          {endDate && (
            <div className="warranty-meta-item">
              <ClockIcon className="icon-xs" />
              <span>ينتهي: {formatDate(endDate)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="warranty-card-actions">
        <button className="task-action-btn" onClick={() => onEdit(warranty)} title="تعديل">
          <EditIcon className="icon-sm" />
        </button>
        <button className="task-action-btn task-delete-btn" onClick={() => onDelete(warranty.id)} title="حذف">
          <TrashIcon className="icon-sm" />
        </button>
      </div>
    </div>
  );
}
