import { createSideListTab } from './common.js';

export default createSideListTab({
  tabId: 'budget',
  title: 'Bajet & Perbelanjaan',
  icon: '💰',
  fields: [
    { key: 'item', label: 'Perkara', type: 'text', required: true },
    { key: 'category', label: 'Kategori', type: 'text' },
    { key: 'estimated', label: 'Anggaran (RM)', type: 'number' },
    { key: 'actual', label: 'Sebenar (RM)', type: 'number' },
    { key: 'paid', label: 'Dah Bayar?', type: 'checkbox' },
  ],
});
