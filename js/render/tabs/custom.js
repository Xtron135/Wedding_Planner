import { createSideListTab } from './common.js';
import { t } from '../../i18n.js';

export function createCustomTab(tabDef) {
  return createSideListTab({
    tabId: tabDef.id,
    getTitle: () => tabDef.label,
    icon: tabDef.icon || '📌',
    fields: [
      { key: 'title', labelKey: 'field.title', type: 'text', required: true },
      { key: 'notes', labelKey: 'field.notes', type: 'text' },
      {
        key: 'status', labelKey: 'field.status', type: 'select',
        options: [
          { value: 'not_started', labelKey: 'option.customStatus.notStarted' },
          { value: 'in_progress', labelKey: 'option.customStatus.inProgress' },
          { value: 'done', labelKey: 'option.customStatus.done' },
        ],
      },
    ],
  });
}
