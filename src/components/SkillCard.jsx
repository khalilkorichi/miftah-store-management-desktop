import React from 'react';

export default function SkillCard({ skill, isSelected, onSelect, onToggle }) {
  const color = skill.color || '#5E4FDE';

  return (
    <div
      className={`skill-card ${isSelected ? 'skill-card-selected' : ''} ${!skill.enabled ? 'skill-card-disabled' : ''}`}
      style={{ '--skill-accent': color }}
      onClick={() => onSelect(skill)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect(skill)}
    >
      <div className="skill-card-header">
        <div
          className="skill-card-icon"
          style={{ background: color + '22', color }}
        >
          {skill.icon || '⚡'}
        </div>
        <div className="skill-card-meta">
          <span className="skill-card-name" title={skill.name}>{skill.name}</span>
          <div className="skill-card-meta-footer">
            <span className={`skill-card-type-badge ${skill.type === 'builtin' ? 'skill-type-builtin' : 'skill-type-custom'}`}>
              {skill.type === 'builtin' ? 'مدمجة' : 'مخصصة'}
            </span>
            <span className="skill-card-priority" style={{ color, background: color + '18', borderColor: color + '35' }}>
              P{skill.priority || 5}
            </span>
          </div>
        </div>
        <button
          className={`skill-toggle ${skill.enabled ? 'skill-toggle-on' : 'skill-toggle-off'}`}
          style={skill.enabled ? { background: color, boxShadow: `0 0 0 3px ${color}33` } : {}}
          onClick={e => { e.stopPropagation(); onToggle(skill.id); }}
          title={skill.enabled ? 'تعطيل المهارة' : 'تفعيل المهارة'}
          aria-label={skill.enabled ? 'تعطيل' : 'تفعيل'}
        >
          <span className="skill-toggle-knob" />
        </button>
      </div>
      {skill.description && (
        <p className="skill-card-desc">{skill.description}</p>
      )}
      <div className="skill-card-tags">
        {(skill.tags || []).slice(0, 5).map(tag => (
          <span key={tag} className="skill-tag">{tag}</span>
        ))}
        {(skill.tags || []).length > 5 && (
          <span className="skill-tag skill-tag-more">+{(skill.tags || []).length - 5}</span>
        )}
      </div>
    </div>
  );
}
