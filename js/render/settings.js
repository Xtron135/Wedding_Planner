import { LANGUAGES, getLang, setLang, t } from '../i18n.js';
import { PRESETS, getThemeId, setThemeId, getCustomPrimary, setCustomPrimary, isDarkMode, setDarkMode } from '../theme.js';

let modalEl = null;

export function openSettingsModal(onChange) {
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'settingsModal';
    modalEl.className = 'modal fade';
    modalEl.tabIndex = -1;
    document.body.appendChild(modalEl);
  }
  paint(onChange);
  const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
}

function paint(onChange) {
  const activePresetId = getCustomPrimary() ? null : getThemeId();
  modalEl.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">⚙️ ${t('settings.title')}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
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
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary btn-sm" data-bs-dismiss="modal">${t('settings.close')}</button>
        </div>
      </div>
    </div>
  `;

  modalEl.querySelector('#langSelect').addEventListener('change', (e) => {
    setLang(e.target.value);
    if (onChange) onChange();
    paint(onChange);
  });
  modalEl.querySelectorAll('[data-theme]').forEach(btn => {
    btn.addEventListener('click', () => {
      setCustomPrimary('');
      setThemeId(btn.dataset.theme);
      if (onChange) onChange();
      paint(onChange);
    });
  });
  modalEl.querySelector('#customColor').addEventListener('input', (e) => {
    setCustomPrimary(e.target.value);
    if (onChange) onChange();
  });
  modalEl.querySelector('#darkModeSwitch').addEventListener('change', (e) => {
    setDarkMode(e.target.checked);
    if (onChange) onChange();
  });
}
