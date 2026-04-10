import React, { useState, useCallback } from 'react';
import { PlusIcon } from './Icons';
import SkillCard from './SkillCard';
import SkillEditor from './SkillEditor';
import SkillUploader from './SkillUploader';
import { loadSkills, saveSkills } from '../data/builtinSkills';

export default function SkillsTab() {
  const [skills, setSkills] = useState(() => loadSkills());
  const [selectedSkill, setSelectedSkill] = useState(null);

  const persist = useCallback((updated) => {
    setSkills(updated);
    saveSkills(updated);
  }, []);

  const handleToggle = (id) => {
    persist(skills.map(s => s.id === id ? { ...s, enabled: !s.enabled, updatedAt: Date.now() } : s));
  };

  const handleSelect = (skill) => {
    setSelectedSkill(skill);
  };

  const handleNew = () => {
    setSelectedSkill({ __new: true, id: '__new__' });
  };

  const handleSave = (updated) => {
    persist(skills.map(s => s.id === updated.id ? updated : s));
    setSelectedSkill(updated);
  };

  const handleCreate = (newSkill) => {
    const updated = [...skills, newSkill];
    persist(updated);
    setSelectedSkill(newSkill);
  };

  const handleDelete = (id) => {
    const updated = skills.filter(s => s.id !== id);
    persist(updated);
    setSelectedSkill(null);
  };

  const handleUpload = (skill) => {
    const existing = skills.find(s => s.name === skill.name);
    if (existing) {
      const updated = skills.map(s => s.name === skill.name ? { ...s, ...skill, id: s.id } : s);
      persist(updated);
      setSelectedSkill({ ...existing, ...skill, id: existing.id });
    } else {
      const updated = [...skills, skill];
      persist(updated);
      setSelectedSkill(skill);
    }
  };

  const enabledCount = skills.filter(s => s.enabled).length;
  const customCount = skills.filter(s => s.type === 'custom').length;

  return (
    <div className="skills-tab">
      <div className="skills-lib">
        <div className="skills-summary-card">
          <div className="skills-summary-stat">
            <span className="skills-summary-num">{skills.length}</span>
            <span className="skills-summary-label">إجمالي</span>
          </div>
          <div className="skills-summary-stat">
            <span className="skills-summary-num skills-num-green">{enabledCount}</span>
            <span className="skills-summary-label">مفعّلة</span>
          </div>
          <div className="skills-summary-stat">
            <span className="skills-summary-num skills-num-blue">{customCount}</span>
            <span className="skills-summary-label">مخصصة</span>
          </div>
        </div>

        <div className="skills-lib-actions">
          <button className="skills-lib-btn skills-lib-btn-new" onClick={handleNew}>
            <PlusIcon className="icon-xs" /> مهارة جديدة
          </button>
          <SkillUploader
            onUpload={handleUpload}
            existingNames={skills.map(s => s.name)}
          />
        </div>

        <div className="skills-list">
          {skills.map(skill => (
            <SkillCard
              key={skill.id}
              skill={skill}
              isSelected={selectedSkill?.id === skill.id}
              onSelect={handleSelect}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </div>

      <div className="skills-editor-panel">
        <SkillEditor
          skill={selectedSkill}
          onSave={handleSave}
          onDelete={handleDelete}
          onCreate={handleCreate}
        />
      </div>
    </div>
  );
}
