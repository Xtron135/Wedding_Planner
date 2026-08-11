import { createSideListTab } from './common.js';

export default createSideListTab({
  tabId: 'guests',
  title: 'Senarai Tetamu',
  icon: '👥',
  fields: [
    { key: 'name', label: 'Nama', type: 'text', required: true },
    { key: 'phone', label: 'No. Telefon', type: 'text' },
    { key: 'pax', label: 'Bilangan Pax', type: 'number' },
    { key: 'rsvp', label: 'RSVP', type: 'select', options: ['Belum Jawab', 'Hadir', 'Tak Hadir'] },
    { key: 'tableNo', label: 'No. Meja', type: 'text' },
  ],
});
