import { createSideListTab } from './common.js';
import { t } from '../../i18n.js';

export default createSideListTab({
  tabId: 'checklist',
  getTitle: () => t('nav.checklist'),
  icon: '✅',
  fields: [
    { key: 'task', labelKey: 'field.task', type: 'text', required: true },
    { key: 'dueDate', labelKey: 'field.dueDate', type: 'date' },
    { key: 'assignedTo', labelKey: 'field.assignedTo', type: 'text' },
    { key: 'done', labelKey: 'field.done', type: 'checkbox' },
  ],
});
