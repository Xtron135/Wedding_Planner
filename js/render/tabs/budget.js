import { createSideListTab } from './common.js';
import { t } from '../../i18n.js';

export default createSideListTab({
  tabId: 'budget',
  getTitle: () => t('nav.budget'),
  icon: '💰',
  fields: [
    { key: 'item', labelKey: 'field.item', type: 'text', required: true },
    { key: 'category', labelKey: 'field.category', type: 'text' },
    { key: 'estimated', labelKey: 'field.estimated', type: 'number' },
    { key: 'actual', labelKey: 'field.actual', type: 'number' },
    {
      key: 'paid', labelKey: 'field.paid', type: 'select', defaultValue: 'belum',
      options: [
        { value: 'belum', labelKey: 'option.paidStatus.belum' },
        { value: 'sudah', labelKey: 'option.paidStatus.sudah' },
      ],
    },
  ],
});
