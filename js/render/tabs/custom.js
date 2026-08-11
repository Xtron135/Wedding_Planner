import { createSideListTab } from './common.js';

export function createCustomTab(tabDef) {
  return createSideListTab({
    tabId: tabDef.id,
    title: tabDef.label,
    icon: tabDef.icon || '📌',
    fields: [
      { key: 'title', label: 'Perkara', type: 'text', required: true },
      { key: 'notes', label: 'Catatan', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Belum Mula', 'Sedang Jalan', 'Siap'] },
    ],
  });
}
