import { LANGUAGES, getLang, setLang, t } from '../i18n.js';
import { PRESETS, getThemeId, setThemeId, getCustomPrimary, setCustomPrimary, isDarkMode, setDarkMode } from '../theme.js';
import { Store } from '../store.js';
import { showToast } from '../toast.js';

let modalEl = null;
let activeSection = 'display';

export function openSettingsModal(onChange) {
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'settingsModal';
    modalEl.className = 'modal fade';
    modalEl.tabIndex = -1;
    document.body.appendChild(modalEl);
  }
  activeSection = 'display';
  paint(onChange);
  const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
}

function paint(onChange) {
  modalEl.innerHTML = `
    <div class="modal-dialog modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">⚙️ ${t('settings.title')}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <ul class="nav nav-tabs mb-3">
            <li class="nav-item"><button type="button" class="nav-link ${activeSection === 'display' ? 'active' : ''}" data-section="display">${t('settings.tabDisplay')}</button></li>
            <li class="nav-item"><button type="button" class="nav-link ${activeSection === 'wedding' ? 'active' : ''}" data-section="wedding">${t('settings.tabWedding')}</button></li>
          </ul>
          <div id="settingsSectionBody"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary btn-sm" data-bs-dismiss="modal">${t('settings.close')}</button>
        </div>
      </div>
    </div>
  `;
  modalEl.querySelectorAll('[data-section]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeSection = btn.dataset.section;
      paint(onChange);
    });
  });
  if (activeSection === 'wedding') paintWeddingSection(onChange);
  else paintDisplaySection(onChange);
}

function paintDisplaySection(onChange) {
  const body = modalEl.querySelector('#settingsSectionBody');
  const activePresetId = getCustomPrimary() ? null : getThemeId();
  body.innerHTML = `
    <div class="mb-3">
      <label class="form-label small fw-bold">${t('settings.language')}</label>
      <select class="form-select" id="langSelect">
        ${LANGUAGES.map(l => `<option value="${l.id}" ${l.id === getLang() ? 'selected' : ''}>${l.label}</option>`).join('')}
      </select>
    </div>
    <div class="mb-3">
      <label class="form-label small fw-bold d-block">${t('settings.theme')}</label>
      <div class="d-flex gap-2 flex-wrap align-items-center">
        ${PRESETS.map(p => `<button type="button" class="theme-swatch ${p.id === activePresetId ? 'active' : ''}" data-theme="${p.id}" style="background:${p.primary}" title="${p.name}"></button>`).join('')}
        <input type="color" id="customColor" value="${getCustomPrimary() || '#c17b8a'}" class="form-control form-control-color" title="Custom color">
      </div>
    </div>
    <div class="form-check form-switch">
      <input class="form-check-input" type="checkbox" role="switch" id="darkModeSwitch" ${isDarkMode() ? 'checked' : ''}>
      <label class="form-check-label" for="darkModeSwitch">${t('settings.darkMode')}</label>
    </div>
  `;
  body.querySelector('#langSelect').addEventListener('change', (e) => {
    setLang(e.target.value);
    if (onChange) onChange();
    paint(onChange);
  });
  body.querySelectorAll('[data-theme]').forEach(btn => {
    btn.addEventListener('click', () => {
      setCustomPrimary('');
      setThemeId(btn.dataset.theme);
      if (onChange) onChange();
      paintDisplaySection(onChange);
    });
  });
  body.querySelector('#customColor').addEventListener('input', (e) => {
    setCustomPrimary(e.target.value);
    if (onChange) onChange();
  });
  body.querySelector('#darkModeSwitch').addEventListener('change', (e) => {
    setDarkMode(e.target.checked);
    if (onChange) onChange();
  });
}

function typeOptionsHtml(selected) {
  const opts = [
    { value: 'combined', key: 'wedding.combined' },
    { value: 'groom', key: 'side.groom' },
    { value: 'bride', key: 'side.bride' },
  ];
  return opts.map(o => `<option value="${o.value}" ${selected === o.value ? 'selected' : ''}>${t(o.key)}</option>`).join('');
}

async function paintWeddingSection(onChange) {
  const body = modalEl.querySelector('#settingsSectionBody');
  body.innerHTML = `<div class="text-center py-4"><div class="spinner-border spinner-border-sm" role="status"></div></div>`;
  const wedding = await Store.loadWedding();
  const events = (wedding.events && wedding.events.length >= 2)
    ? wedding.events.slice(0, 2)
    : [
        (wedding.events && wedding.events[0]) || { type: 'combined', date: '', venue: '' },
        { type: '', date: '', venue: '' },
      ];

  body.innerHTML = `
    <form id="weddingForm">
      <div class="row g-2 mb-3">
        <div class="col-md-6">
          <label class="form-label small">${t('wedding.groomNameLabel')}</label>
          <input class="form-control" name="groomName" value="${wedding.groomName || ''}">
        </div>
        <div class="col-md-6">
          <label class="form-label small">${t('wedding.brideNameLabel')}</label>
          <input class="form-control" name="brideName" value="${wedding.brideName || ''}">
        </div>
      </div>
      ${events.map((ev, i) => `
        <div class="form-card p-3 mb-3">
          <div class="fw-bold small text-muted mb-2">${t('wedding.eventPrefix')} ${i + 1}</div>
          <div class="row g-2">
            <div class="col-md-4">
              <label class="form-label small">${t('wedding.typeLabel')}</label>
              <select class="form-select" name="type_${i}">${typeOptionsHtml(ev.type)}</select>
            </div>
            <div class="col-md-4">
              <label class="form-label small">${t('wedding.dateLabel')}</label>
              <input class="form-control" type="date" name="date_${i}" value="${ev.date || ''}">
            </div>
            <div class="col-md-4">
              <label class="form-label small">${t('wedding.venueLabel')}</label>
              <input class="form-control" name="venue_${i}" value="${ev.venue || ''}" placeholder="${t('wedding.venuePlaceholder')}">
            </div>
          </div>
        </div>
      `).join('')}
      <div class="d-flex align-items-center gap-2">
        <button type="submit" class="btn btn-primary btn-sm">${t('wedding.saveBtn')}</button>
        <span class="small text-muted" id="weddingSaveStatus"></span>
      </div>
    </form>
  `;

  body.querySelector('#weddingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newEvents = events.map((_, i) => ({
      type: fd.get(`type_${i}`) || 'combined',
      date: fd.get(`date_${i}`) || '',
      venue: fd.get(`venue_${i}`) || '',
    }));
    const hasAnyDate = newEvents.some(ev => ev.date);
    const groomName = fd.get('groomName') || '';
    const brideName = fd.get('brideName') || '';
    const submitBtn = e.target.querySelector('button[type=submit]');
    const statusEl = document.getElementById('weddingSaveStatus');
    submitBtn.disabled = true;
    submitBtn.textContent = t('wedding.savingText');
    statusEl.textContent = '';
    try {
      await Store.mutateWedding((working) => {
        working.groomName = groomName;
        working.brideName = brideName;
        working.events = newEvents;
        if (!working.createdAt && hasAnyDate) working.createdAt = new Date().toISOString().slice(0, 10);
      }, 'Update wedding info');
      submitBtn.disabled = false;
      submitBtn.textContent = t('wedding.saveBtn');
      statusEl.textContent = t('wedding.saved');
      showToast(t('common.saved'));
      if (onChange) onChange();
    } catch (err) {
      alert(t('common.saveFailedPrefix') + err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = t('wedding.saveBtn');
    }
  });
}
