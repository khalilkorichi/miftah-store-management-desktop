import React, { useRef, useState } from 'react';
import { UploadIcon, XIcon, CheckCircleIcon } from './Icons';
import MarkdownRenderer from './MarkdownRenderer';

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)/);
  if (!match) return { meta: {}, content: text.trim() };
  const yamlStr = match[1];
  const content = match[2].trim();
  const meta = {};
  yamlStr.split('\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx < 0) return;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim();
    if (key === 'tags') {
      const inner = val.replace(/^\[/, '').replace(/\]$/, '');
      meta.tags = inner.split(',').map(t => t.trim()).filter(Boolean);
    } else if (key === 'priority') {
      meta.priority = parseInt(val) || 5;
    } else {
      meta[key] = val.replace(/^['"]|['"]$/g, '');
    }
  });
  return { meta, content };
}

export default function SkillUploader({ onUpload, existingNames = [] }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.md')) {
      setError('الرجاء اختيار ملف بصيغة .md');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target.result;
        const { meta, content } = parseFrontmatter(text);
        setPreview({
          id: `skill_${Date.now()}`,
          name: meta.name || file.name.replace(/\.md$/, ''),
          description: meta.description || '',
          tags: meta.tags || [],
          priority: meta.priority || 5,
          icon: meta.icon || '⚡',
          color: meta.color || '#5E4FDE',
          type: 'custom',
          enabled: true,
          content,
          resources: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        setError('');
      } catch {
        setError('خطأ في قراءة الملف');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const isDuplicate = preview && existingNames.includes(preview.name);

  const handleConfirm = () => {
    if (!preview) return;
    if (isDuplicate && !confirm(`مهارة "${preview.name}" موجودة مسبقاً. هل تريد استبدالها؟`)) return;
    onUpload(preview);
    setPreview(null);
  };

  return (
    <div className="skill-uploader">
      <input type="file" ref={fileRef} accept=".md" onChange={handleFile} style={{ display: 'none' }} />
      <button className="skills-lib-btn skills-lib-btn-upload" onClick={() => fileRef.current?.click()}>
        <UploadIcon className="icon-xs" /> رفع مهارة (.md)
      </button>
      {error && <p className="skill-upload-error">{error}</p>}
      {preview && (
        <div className="skill-upload-preview-overlay">
          <div className="skill-upload-preview">
            <div className="skill-upload-preview-header">
              <span>معاينة: <strong>{preview.name}</strong></span>
              <button className="skill-upload-close" onClick={() => setPreview(null)}>
                <XIcon className="icon-xs" />
              </button>
            </div>
            {isDuplicate && (
              <div className="skill-upload-warn">
                ⚠️ مهارة بهذا الاسم موجودة مسبقاً — سيتم استبدالها عند التأكيد
              </div>
            )}
            <div className="skill-upload-preview-tags">
              {(preview.tags || []).map(t => <span key={t} className="skill-tag">{t}</span>)}
            </div>
            <div className="skill-upload-preview-content">
              <MarkdownRenderer content={preview.content || ''} />
            </div>
            <div className="skill-upload-preview-actions">
              <button className="skill-action-btn skill-action-save" onClick={handleConfirm}>
                <CheckCircleIcon className="icon-xs" /> تأكيد وحفظ
              </button>
              <button className="skill-action-btn" onClick={() => setPreview(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
