import { Store } from '../../store.js';
import { genId } from '../../crypto.js';
import { t } from '../../i18n.js';

export function createSideListTab({ tabId, getTitle, icon, fields }) {
  let currentSide = 'lelaki';
  let data = { lelaki: [], perempuan: [] };
  let editingId = null;
  let allowedSides = ['lelaki', 'perempuan'];

  function emptyForm() {
    const obj = {};
    fields.forEach(f => { obj[f.key] = f.type === 'checkbox' ? false : ''; });
    return obj;
  }
  let formState = emptyForm();

  async function render(container, sides) {
    allowedSides = Array.isArray(sides) ? sides : ['lelaki', 'perempuan'];

    if (allowedSides.length === 0) {
      container.innerHTML = `<div class="text-muted text-center py-5"><i class="bi bi-lock"></i> ${t('common.noSideAccess')}</div>`;
      return;
    }
    if (!allowedSides.includes(currentSide)) currentSide = allowedSides[0];

    data = await Store.loadTabData(tabId);
    if (!data.lelaki) data.lelaki = [];
    if (!data.perempuan) data.perempuan = [];
    editingId = null;
    formState = emptyForm();
    paint(container);
  }

  function fieldLabel(f) {
    return t(f.labelKey);
  }

  function optionLabel(f, val) {
    if (f.options) {
      const opt = f.options.find(o => o.value === val);
      if (opt) return t(opt.labelKey);
    }
    return val === undefined || val === null ? '' : val;
  }

  function fieldInputHtml(f, value) {
    const val = value === undefined || value === null ? (f.type === 'checkbox' ? false : '') : value;
    if (f.type === 'select') {
      return `<select class="form-select form-select-sm" data-field="${f.key}">
        ${f.options.map(o => `<option value="${o.value}" ${val === o.value ? 'selected' : ''}>${t(o.labelKey)}</option>`).join('')}
      </select>`;
    }
    if (f.type === 'checkbox') {
      return `<div class="form-check mt-2"><input class="form-check-input" type="checkbox" data-field="${f.key}" ${val ? 'checked' : ''}></div>`;
    }
    return `<input class="form-control form-control-sm" type="${f.type}" data-field="${f.key}" value="${val}" placeholder="${fieldLabel(f)}">`;
  }

  function formHtml() {
    return `
      <form id="itemForm" class="row g-2 align-items-end p-3 mb-3 form-card">
        ${fields.map(f => `<div class="col-12 col-sm-6 col-md-3">
          <label class="form-label small mb-0">${fieldLabel(f)}</label>
          ${fieldInputHtml(f, formState[f.key])}
        </div>`).join('')}
        <div class="col-12 col-md-auto d-flex gap-2">
          <button type="submit" class="btn btn-primary btn-sm">${editingId ? t('common.updateBtn') : t('common.addBtn')}</button>
          ${editingId ? `<button type="button" id="cancelEditBtn" class="btn btn-outline-secondary btn-sm">${t('common.cancelBtn')}</button>` : ''}
        </div>
      </form>
    `;
  }

  function displayValue(f, val) {
    if (f.type === 'checkbox') return val ? '✅' : '❌';
    if (f.type === 'select') return optionLabel(f, val);
    if (f.type === 'number' && val !== '' && val !== null && val !== undefined) {
      return `RM ${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
    return val === undefined || val === null ? '' : val;
  }

  function rowHtml(item) {
    return `<tr data-id="${item.id}">
      ${fields.map(f => `<td>${displayValue(f, item[f.key])}</td>`).join('')}
      <td class="text-nowrap">
        <button class="btn btn-sm btn-outline-secondary editBtn" data-id="${item.id}"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger delBtn" data-id="${item.id}"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`;
  }

  function summaryHtml(items) {
    const numField = fields.find(f => f.type === 'number');
    if (!numField) return '';
    const total = items.reduce((s, it) => s + (Number(it[numField.key]) || 0), 0);
    return `<div class="text-muted small mb-2">${t('common.totalLabel')} ${fieldLabel(numField)}: <strong>RM ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> &middot; ${items.length} ${t('common.itemsSuffix')}</div>`;
  }

  function sideSwitchHtml() {
    if (allowedSides.length < 2) return '';
    return `
      <div class="btn-group side-switch" role="group">
        ${allowedSides.includes('lelaki') ? `<button type="button" class="btn ${currentSide === 'lelaki' ? 'btn-primary' : 'btn-outline-primary'}" data-side="lelaki">\u{1F935} ${t('side.groom')}</button>` : ''}
        ${allowedSides.includes('perempuan') ? `<button type="button" class="btn ${currentSide === 'perempuan' ? 'btn-primary' : 'btn-outline-primary'}" data-side="perempuan">\u{1F470} ${t('side.bride')}</button>` : ''}
      </div>
    `;
  }

  function paint(container) {
    const items = data[currentSide] || [];
    container.innerHTML = `
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h2 class="mb-0">${icon || ''} ${getTitle()}</h2>
        ${sideSwitchHtml()}
      </div>
      ${formHtml()}
      ${summaryHtml(items)}
      <div class="table-responsive">
        <table class="table table-hover align-middle bg-white">
          <thead><tr>${fields.map(f => `<th>${fieldLabel(f)}</th>`).join('')}<th></th></tr></thead>
          <tbody>
            ${items.length === 0 ? `<tr><td colspan="${fields.length + 1}" class="text-muted text-center py-4">${t('common.noDataYet')}</td></tr>` : items.map(rowHtml).join('')}
          </tbody>
        </table>
      </div>
    `;
    bindEvents(container);
  }

  function readForm(container) {
    const obj = {};
    fields.forEach(f => {
      const el = container.querySelector(`[data-field="${f.key}"]`);
      if (!el) return;
      if (f.type === 'checkbox') obj[f.key] = el.checked;
      else if (f.type === 'number') obj[f.key] = el.value === '' ? '' : Number(el.value);
      else obj[f.key] = el.value;
    });
    return obj;
  }

  function bindEvents(container) {
    container.querySelectorAll('[data-side]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentSide = btn.dataset.side;
        editingId = null;
        formState = emptyForm();
        paint(container);
      });
    });

    const form = container.querySelector('#itemForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const values = readForm(container);
        const missingRequired = fields.some(f => f.required && f.type !== 'checkbox' && !values[f.key] && values[f.key] !== 0);
        if (missingRequired) { alert(t('common.requiredFieldsAlert')); return; }
        const submitBtn = form.querySelector('button[type=submit]');
        submitBtn.disabled = true;
        submitBtn.textContent = t('common.savingText');
        try {
          if (editingId) {
            const idx = data[currentSide].findIndex(i => i.id === editingId);
            if (idx !== -1) data[currentSide][idx] = { ...data[currentSide][idx], ...values };
          } else {
            data[currentSide].push({ id: genId(tabId), ...values });
          }
          await Store.saveTabData(tabId, data, `Update ${getTitle()} (${currentSide})`);
          editingId = null;
          formState = emptyForm();
          paint(container);
        } catch (err) {
          alert(t('common.saveFailedPrefix') + err.message);
          submitBtn.disabled = false;
          submitBtn.textContent = editingId ? t('common.updateBtn') : t('common.addBtn');
        }
      });
      const cancelBtn = container.querySelector('#cancelEditBtn');
      if (cancelBtn) cancelBtn.addEventListener('click', () => { editingId = null; formState = emptyForm(); paint(container); });
    }

    container.querySelectorAll('.editBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = data[currentSide].find(i => i.id === btn.dataset.id);
        if (!item) return;
        editingId = item.id;
        formState = { ...item };
        paint(container);
      });
    });

    container.querySelectorAll('.delBtn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(t('common.confirmDeleteItem'))) return;
        const backup = data[currentSide];
        data[currentSide] = data[currentSide].filter(i => i.id !== btn.dataset.id);
        try {
          await Store.saveTabData(tabId, data, `Delete item in ${getTitle()} (${currentSide})`);
          paint(container);
        } catch (err) {
          data[currentSide] = backup;
          alert(t('common.deleteFailedPrefix') + err.message);
        }
      });
    });
  }

  return { render };
}
