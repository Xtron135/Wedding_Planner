import { getToken, setToken, clearToken, verifyAccess } from './github-api.js';
import { Store, getCached } from './store.js';
import { getCurrentUser, login, logout, updateUser } from './auth.js';
import { canView, isAdmin } from './permissions.js';
import { t, tabLabel, LANGUAGES, getLang, setLang } from './i18n.js';
import { applyTheme } from './theme.js';
import { openSettingsModal } from './render/settings.js';
import checklistTab from './render/tabs/checklist.js';
import budgetTab from './render/tabs/budget.js';
import guestsTab from './render/tabs/guests.js';
import vendorsTab from './render/tabs/vendors.js';
import { createCustomTab } from './render/tabs/custom.js';
import { renderAdmin } from './render/admin.js';
import { renderDashboard } from './render/dashboard.js';

applyTheme();

const appRoot = document.getElementById('app');
let activeTabId = null;
const customTabInstances = {};

function miniLangSwitcherHtml() {
  return `
    <div class="mini-lang-switcher">
      <select class="form-select form-select-sm" id="miniLangSelect">
        ${LANGUAGES.map(l => `<option value="${l.id}" ${l.id === getLang() ? 'selected' : ''}>${l.label}</option>`).join('')}
      </select>
    </div>
  `;
}
function bindMiniLangSwitcher(refreshFn) {
  const el = document.getElementById('miniLangSelect');
  if (el) el.addEventListener('change', (e) => { setLang(e.target.value); refreshFn(); });
}

async function boot() {
  if (!getToken()) return renderTokenSetup();
  try {
    await verifyAccess();
  } catch (err) {
    return renderTokenSetup(err.message);
  }
  await Store.loadCore();
  const user = getCurrentUser();
  if (!user) return renderLogin();
  renderApp(user);
}

function refreshUI() {
  const user = getCurrentUser();
  if (user) return renderApp(user);
  if (getToken()) return renderLogin();
  return renderTokenSetup();
}

function renderTokenSetup(errorMsg) {
  appRoot.innerHTML = `
    <div class="centered-screen">
      <div class="auth-card position-relative">
        ${miniLangSwitcherHtml()}
        <h1 class="brand-title">💍 Wedding Planner</h1>
        <p class="text-muted">${t('setup.desc')}</p>
        ${errorMsg ? `<div class="alert alert-danger py-2">${errorMsg}</div>` : ''}
        <form id="tokenForm">
          <input class="form-control mb-2" type="password" id="tokenInput" placeholder="ghp_xxxxxxxxxxxx" required>
          <button class="btn btn-primary w-100" type="submit">${t('setup.connectBtn')}</button>
        </form>
        <p class="small text-muted mt-3">${t('setup.tokenNote')}</p>
      </div>
    </div>
  `;
  bindMiniLangSwitcher(() => renderTokenSetup(errorMsg));
  document.getElementById('tokenForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = document.getElementById('tokenInput').value.trim();
    setToken(token);
    boot();
  });
}

function renderLogin() {
  appRoot.innerHTML = `
    <div class="centered-screen">
      <div class="auth-card position-relative">
        ${miniLangSwitcherHtml()}
        <h1 class="brand-title">💍 Wedding Planner</h1>
        <p class="text-muted">${t('login.desc')}</p>
        <div id="loginError"></div>
        <form id="loginForm">
          <input class="form-control mb-2" name="username" placeholder="${t('login.usernamePlaceholder')}" required autocomplete="username">
          <input class="form-control mb-2" name="password" type="password" placeholder="${t('login.passwordPlaceholder')}" required autocomplete="current-password">
          <button class="btn btn-primary w-100" type="submit">${t('login.loginBtn')}</button>
        </form>
        <button class="btn btn-link btn-sm mt-2 p-0" id="resetTokenBtn">${t('login.changeTokenBtn')}</button>
      </div>
    </div>
  `;
  bindMiniLangSwitcher(() => renderLogin());
  document.getElementById('resetTokenBtn').addEventListener('click', () => { clearToken(); boot(); });
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const user = await login(fd.get('username'), fd.get('password'));
      renderApp(user);
    } catch (err) {
      document.getElementById('loginError').innerHTML = `<div class="alert alert-danger py-2">${err.message}</div>`;
    }
  });
}

function getVisibleTabs(user) {
  const tabsData = getCached('tabs');
  return tabsData.tabs.filter(td => canView(user, td.id));
}

function renderApp(user) {
  const tabs = getVisibleTabs(user);
  const defaultTabId = tabs.some(td => td.id === 'dashboard') ? 'dashboard' : (tabs[0] ? tabs[0].id : null);
  activeTabId = activeTabId && (activeTabId === '__admin__' || tabs.some(td => td.id === activeTabId)) ? activeTabId : defaultTabId;

  appRoot.innerHTML = `
    <nav class="navbar navbar-light bg-white border-bottom sticky-top px-3 d-flex d-md-none">
      <button class="btn btn-outline-secondary" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarOffcanvas"><i class="bi bi-list"></i></button>
      <span class="navbar-brand mb-0 h1 ms-2 brand-title" style="font-size:1.1rem">💍 Wedding Planner</span>
    </nav>
    <div class="app-layout">
      <div class="offcanvas-md offcanvas-start sidebar" tabindex="-1" id="sidebarOffcanvas">
        <div class="offcanvas-header d-md-none">
          <h5>Menu</h5>
          <button type="button" class="btn-close" data-bs-dismiss="offcanvas" data-bs-target="#sidebarOffcanvas"></button>
        </div>
        <div class="offcanvas-body sidebar-body d-flex flex-column">
          <div class="d-none d-md-block brand-title px-2 py-3">💍 Wedding Planner</div>
          <div class="nav flex-column flex-grow-1" id="navTabs">
            ${tabs.map(td => `<button class="nav-link tab-link ${td.id === activeTabId ? 'active' : ''}" data-tab="${td.id}">${td.icon || ''} ${tabLabel(td)}</button>`).join('')}
            ${isAdmin(user) ? `<button class="nav-link tab-link ${activeTabId === '__admin__' ? 'active' : ''}" data-tab="__admin__">🔐 ${t('nav.admin')}</button>` : ''}
          </div>
          <div class="px-2 py-3 border-top">
            <div class="small text-muted mb-2">${t('sidebar.loggedInAs')} <strong>${user.displayName}</strong></div>
            <button class="btn btn-outline-secondary btn-sm w-100 mb-2" id="settingsBtn"><i class="bi bi-gear"></i> ${t('sidebar.settingsBtn')}</button>
            <button class="btn btn-outline-secondary btn-sm w-100 mb-2" id="changePwBtn">${t('sidebar.changePasswordBtn')}</button>
            <button class="btn btn-outline-danger btn-sm w-100" id="logoutBtn">${t('sidebar.logoutBtn')}</button>
          </div>
        </div>
      </div>
      <main class="content-area p-3 p-md-4" id="tabContent"></main>
    </div>
  `;

  document.getElementById('logoutBtn').addEventListener('click', () => { logout(); location.reload(); });
  document.getElementById('settingsBtn').addEventListener('click', () => openSettingsModal(refreshUI));
  document.getElementById('changePwBtn').addEventListener('click', async () => {
    const newPw = prompt(t('sidebar.changePasswordPrompt'));
    if (!newPw) return;
    try {
      await updateUser(user.id, { password: newPw });
      alert(t('sidebar.passwordUpdated'));
    } catch (err) {
      alert(err.message);
    }
  });

  appRoot.querySelectorAll('.tab-link').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTabId = btn.dataset.tab;
      appRoot.querySelectorAll('.tab-link').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const offcanvasEl = document.getElementById('sidebarOffcanvas');
      if (window.bootstrap && offcanvasEl) {
        const oc = window.bootstrap.Offcanvas.getInstance(offcanvasEl);
        if (oc) oc.hide();
      }
      loadTabContent(user);
    });
  });

  loadTabContent(user);
}

async function loadTabContent(user) {
  const container = document.getElementById('tabContent');
  container.innerHTML = `<div class="text-center text-muted py-5"><div class="spinner-border" role="status"></div></div>`;

  if (activeTabId === '__admin__') return renderAdmin(container);

  const tabsData = getCached('tabs');
  const tabDef = tabsData.tabs.find(td => td.id === activeTabId);
  if (!tabDef) {
    container.innerHTML = `<p class="text-muted">${t('content.noTabSelected')}</p>`;
    return;
  }

  if (tabDef.id === 'dashboard') return renderDashboard(container);
  if (tabDef.id === 'checklist') return checklistTab.render(container);
  if (tabDef.id === 'budget') return budgetTab.render(container);
  if (tabDef.id === 'guests') return guestsTab.render(container);
  if (tabDef.id === 'vendors') return vendorsTab.render(container);

  if (!customTabInstances[tabDef.id]) customTabInstances[tabDef.id] = createCustomTab(tabDef);
  return customTabInstances[tabDef.id].render(container);
}

boot();
