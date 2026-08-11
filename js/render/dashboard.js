import { Store } from '../store.js';
import { t } from '../i18n.js';

function eventTypeLabel(type) {
  if (type === 'groom') return t('side.groom');
  if (type === 'bride') return t('side.bride');
  return t('wedding.combined');
}

function daysInfo(target) {
  const end = new Date(target + 'T00:00:00').getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.round((end - today) / 86400000);
  if (diffDays > 0) return t('dashboard.daysLeft').replace('{n}', diffDays);
  if (diffDays === 0) return t('dashboard.today');
  return t('dashboard.past');
}

function computeElapsedPct(createdAt, target) {
  if (!createdAt || !target) return null;
  const start = new Date(createdAt + 'T00:00:00').getTime();
  const end = new Date(target + 'T00:00:00').getTime();
  const now = Date.now();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
  if (now >= end) return 100;
  if (now <= start) return 0;
  return Math.round(((now - start) / (end - start)) * 100);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  try {
    return d.toLocaleDateString(t('dashboard.locale'), { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

async function computeChecklistProgress() {
  const data = await Store.loadTabData('checklist');
  const all = [...(data.lelaki || []), ...(data.perempuan || [])];
  const total = all.length;
  // "done" used to be a boolean checkbox; it's now a select ('belum'/'siap').
  // Accept both so old data ticked before this change still counts correctly.
  const done = all.filter(i => i.done === true || i.done === 'siap').length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
}

export async function renderDashboard(container) {
  container.innerHTML = `<div class="text-center text-muted py-5"><div class="spinner-border" role="status"></div></div>`;
  const wedding = await Store.loadWedding();
  const checklistProgress = await computeChecklistProgress();
  paint(container, wedding, checklistProgress);
}

function paint(container, wedding, checklistProgress) {
  const events = (wedding.events || []).filter(e => e && e.date);

  container.innerHTML = `
    <div class="mb-4 text-center">
      <h1 class="brand-title" style="font-size:2rem">
        ${wedding.groomName ? wedding.groomName : '—'} <span class="text-muted">&amp;</span> ${wedding.brideName ? wedding.brideName : '—'}
      </h1>
    </div>

    <div class="row g-3 mb-4">
      ${events.length === 0 ? `
        <div class="col-12"><div class="form-card p-4 text-center text-muted">${t('dashboard.noEvents')}</div></div>
      ` : events.map(ev => {
        const pct = computeElapsedPct(wedding.createdAt, ev.date);
        return `
          <div class="col-12 col-md-6">
            <div class="form-card p-3 h-100">
              <div class="d-flex justify-content-between align-items-start mb-2 gap-2">
                <div>
                  <div class="small text-muted">${eventTypeLabel(ev.type)}</div>
                  <div class="fw-bold">${formatDate(ev.date)}</div>
                  ${ev.venue ? `<div class="small text-muted"><i class="bi bi-geo-alt"></i> ${ev.venue}</div>` : ''}
                </div>
                <span class="badge" style="background:var(--wp-primary);color:#fff;">${daysInfo(ev.date)}</span>
              </div>
              ${pct !== null ? `
                <div class="progress" style="height: 18px;">
                  <div class="progress-bar" role="progressbar" style="width:${pct}%">${pct}%</div>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <div class="form-card p-3">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6 class="mb-0">✅ ${t('dashboard.checklistProgress')}</h6>
        <span class="small text-muted">${checklistProgress.done}/${checklistProgress.total} ${t('common.itemsSuffix')}</span>
      </div>
      <div class="progress" style="height: 20px;">
        <div class="progress-bar" role="progressbar" style="width:${checklistProgress.pct}%">${checklistProgress.pct}%</div>
      </div>
    </div>
  `;
}
