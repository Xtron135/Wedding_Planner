import { createSideListTab } from './common.js';

export default createSideListTab({
  tabId: 'checklist',
  title: 'Checklist Tugasan',
  icon: '✅',
  fields: [
    { key: 'task', label: 'Tugasan', type: 'text', required: true },
    { key: 'dueDate', label: 'Tarikh Akhir', type: 'date' },
    { key: 'assignedTo', label: 'PIC', type: 'text' },
    { key: 'done', label: 'Siap?', type: 'checkbox' },
  ],
});
