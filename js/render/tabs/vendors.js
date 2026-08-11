import { createSideListTab } from './common.js';

export default createSideListTab({
  tabId: 'vendors',
  title: 'Vendor & Kontraktor',
  icon: '🚚',
  fields: [
    { key: 'name', label: 'Nama Vendor', type: 'text', required: true },
    { key: 'category', label: 'Kategori', type: 'text' },
    { key: 'contact', label: 'Kontak', type: 'text' },
    { key: 'price', label: 'Harga (RM)', type: 'number' },
    { key: 'deposit', label: 'Deposit (RM)', type: 'number' },
    { key: 'status', label: 'Status', type: 'select', options: ['Dirujuk', 'Ditempah', 'Dibayar Penuh'] },
  ],
});
