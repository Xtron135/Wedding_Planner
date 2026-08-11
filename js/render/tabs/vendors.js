import { createSideListTab } from './common.js';
import { t } from '../../i18n.js';

export default createSideListTab({
  tabId: 'vendors',
  getTitle: () => t('nav.vendors'),
  icon: '🚚',
  fields: [
    { key: 'name', labelKey: 'field.vendorName', type: 'text', required: true },
    { key: 'category', labelKey: 'field.category', type: 'text' },
    { key: 'contact', labelKey: 'field.contact', type: 'text' },
    { key: 'price', labelKey: 'field.price', type: 'number' },
    { key: 'deposit', labelKey: 'field.deposit', type: 'number' },
    {
      key: 'status', labelKey: 'field.status', type: 'select',
      options: [
        { value: 'referred', labelKey: 'option.vendorStatus.referred' },
        { value: 'booked', labelKey: 'option.vendorStatus.booked' },
        { value: 'paid_full', labelKey: 'option.vendorStatus.paidFull' },
      ],
    },
  ],
});
