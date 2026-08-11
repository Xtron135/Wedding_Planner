import { createSideListTab } from './common.js';
import { t } from '../../i18n.js';

export default createSideListTab({
  tabId: 'guests',
  getTitle: () => t('nav.guests'),
  icon: '👥',
  fields: [
    { key: 'name', labelKey: 'field.name', type: 'text', required: true },
    { key: 'phone', labelKey: 'field.phone', type: 'text' },
    { key: 'pax', labelKey: 'field.pax', type: 'number' },
    {
      key: 'rsvp', labelKey: 'field.rsvp', type: 'select',
      options: [
        { value: 'not_answered', labelKey: 'option.rsvp.notAnswered' },
        { value: 'attending', labelKey: 'option.rsvp.hadir' },
        { value: 'not_attending', labelKey: 'option.rsvp.takHadir' },
      ],
    },
    { key: 'tableNo', labelKey: 'field.tableNo', type: 'text' },
  ],
});
