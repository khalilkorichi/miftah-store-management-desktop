import React, { useState } from 'react';
import { CheckSquareIcon, BookOpenIcon, ActivityIcon, CalendarIcon, ShieldCheckIcon, EditIcon } from '../Icons';
import TaskManager from './TaskManager';
import ActivationGuidesManager from './ActivationGuidesManager';
import RenewalReminders from './RenewalReminders';
import WarrantyManager from './WarrantyManager';
import NotesManager from './NotesManager';

const SUB_TABS = [
  { id: 'tasks', label: 'المهام', Icon: CheckSquareIcon },
  { id: 'notes', label: 'الملاحظات', Icon: EditIcon },
  { id: 'guides', label: 'أدلة التفعيل', Icon: BookOpenIcon },
  { id: 'renewals', label: 'تذكيرات التجديد', Icon: CalendarIcon },
  { id: 'warranty', label: 'الضمان', Icon: ShieldCheckIcon },
];

export default function OperationsHub({
  tasks, setTasks,
  notes, setNotes,
  activationGuides, setActivationGuides,
  renewalReminders, setRenewalReminders,
  warrantyOrders, setWarrantyOrders,
  products, durations, suppliers, exchangeRate,
}) {
  const [activeSubTab, setActiveSubTab] = useState('tasks');

  return (
    <div className="ops-hub">
      <div className="ops-hub-header">
        <div className="ops-hub-header-icon">
          <ActivityIcon className="icon-md" />
        </div>
        <div>
          <h1 className="ops-hub-title">قسم العمليات</h1>
          <p className="ops-hub-subtitle">إدارة المهام اليومية والملاحظات وأدلة تفعيل المنتجات وتذكيرات التجديد وسجلات الضمان</p>
        </div>
      </div>

      <div className="ops-subtab-bar">
        {SUB_TABS.map(tab => (
          <button
            key={tab.id}
            className={`ops-subtab-btn ${activeSubTab === tab.id ? 'ops-subtab-active' : ''}`}
            onClick={() => setActiveSubTab(tab.id)}
          >
            <tab.Icon className="icon-sm" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="ops-hub-content">
        {activeSubTab === 'tasks' && (
          <TaskManager tasks={tasks} setTasks={setTasks} />
        )}
        {activeSubTab === 'notes' && (
          <NotesManager notes={notes} setNotes={setNotes} />
        )}
        {activeSubTab === 'guides' && (
          <ActivationGuidesManager
            guides={activationGuides}
            setGuides={setActivationGuides}
            products={products}
            durations={durations}
          />
        )}
        {activeSubTab === 'renewals' && (
          <RenewalReminders
            renewals={renewalReminders}
            setRenewals={setRenewalReminders}
            products={products}
            suppliers={suppliers}
            exchangeRate={exchangeRate}
          />
        )}
        {activeSubTab === 'warranty' && (
          <WarrantyManager
            warranties={warrantyOrders}
            setWarranties={setWarrantyOrders}
            products={products}
            suppliers={suppliers}
            durations={durations}
          />
        )}
      </div>
    </div>
  );
}
