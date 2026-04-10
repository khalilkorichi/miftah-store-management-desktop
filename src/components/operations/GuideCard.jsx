import React, { useState } from 'react';
import {
  ChevronDownIcon, ChevronUpIcon, EditIcon, TrashIcon,
  CopyIcon, CheckIcon, TagIcon, BookOpenIcon
} from '../Icons';

function useCopy(text) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    const promise = navigator.clipboard?.writeText(text);
    if (promise && typeof promise.then === 'function') {
      promise.then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
    }
  };
  return [copied, copy];
}

function buildCopyText(guide) {
  const steps = Array.isArray(guide.steps) ? guide.steps : [];
  const lines = [`📋 ${guide.title || ''}`, ''];
  steps.forEach((s, i) => { lines.push(`${i + 1}. ${s.text || ''}`); });
  return lines.join('\n');
}

export default function GuideCard({ guide, productName, planLabel, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const steps = Array.isArray(guide.steps) ? guide.steps : [];
  const [copied, copy] = useCopy(buildCopyText(guide));

  const customTagsList = guide.customTags
    ? guide.customTags.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  return (
    <div className="guide-card">
      <div className="guide-card-header" onClick={() => setExpanded(v => !v)}>
        <div className="guide-card-left">
          <span className="guide-card-icon"><BookOpenIcon className="icon-sm" /></span>
          <div className="guide-card-info">
            <span className="guide-card-title">{guide.title}</span>
            <div className="guide-card-tags">
              {productName && (
                <span className="guide-tag guide-tag-product">
                  <TagIcon className="icon-xs" /> {productName}
                </span>
              )}
              {planLabel && (
                <span className="guide-tag guide-tag-plan">
                  {planLabel}
                </span>
              )}
              {customTagsList.map(tag => (
                <span key={tag} className="guide-tag guide-tag-custom">{tag}</span>
              ))}
              <span className="guide-steps-count">{steps.length} خطوة</span>
            </div>
          </div>
        </div>
        <div className="guide-card-actions" onClick={e => e.stopPropagation()}>
          <button
            className={`ops-btn ops-btn-copy ${copied ? 'ops-btn-copied' : ''}`}
            onClick={copy}
            title="نسخ الدليل"
          >
            {copied ? <><CheckIcon className="icon-sm" /> تم النسخ</> : <><CopyIcon className="icon-sm" /> نسخ</>}
          </button>
          <button className="task-action-btn" onClick={() => onEdit(guide)} title="تعديل">
            <EditIcon className="icon-sm" />
          </button>
          <button className="task-action-btn task-delete-btn" onClick={() => onDelete(guide.id)} title="حذف">
            <TrashIcon className="icon-sm" />
          </button>
          <button className="task-expand-btn" onClick={() => setExpanded(v => !v)} aria-label="توسيع">
            {expanded ? <ChevronUpIcon className="icon-sm" /> : <ChevronDownIcon className="icon-sm" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="guide-card-body">
          <ol className="guide-steps-ol">
            {steps.map((step, i) => (
              <li key={step.id} className="guide-step-item">
                <span className="guide-step-num-display">{i + 1}</span>
                <span className="guide-step-text">{step.text}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
