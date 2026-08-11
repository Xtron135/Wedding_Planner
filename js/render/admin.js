import { createUser, updateUser, deleteUser, getCurrentUser } from '../auth.js';
import { Store, getCached } from '../store.js';
import { genId } from '../crypto.js';

export async function renderAdmin(container) {
  paint(container);
}

function paint(container) {
  container.innerHTML = `
    <h2 class="mb-3">🔐 Pentadbiran & Kebenaran</h2>
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item"><button class="nav-link active" data-sub="users">Pengguna</button></li>
      <li class="nav-item"><button class="nav-link" data-sub="tabs">Urus Tab</button></li>
    </ul>
    <div id="adminSubContent"></div>
  `;
  container.querySelectorAll('[data-sub]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-sub]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (btn.dataset.sub === 'users') paintUsers(container.querySelector('#adminSubContent'));
      else paintTabsManager(container.querySelector('#adminSubContent'));
    });
  });
  paintUsers(container.querySelector('#adminSubContent'));
}

function tabLabel(tabsData, id) {
  const t = tabsData.tabs.find(x => x.id === id);
  return t ? t.label : id;
}

function paintUsers(el) {
  const usersData = getCached('users');
  const tabsData = getCached('tabs');
  const me = getCurrentUser();

  el.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0">Senarai Pengguna</h5>
      <button class="btn btn-primary btn-sm" id="addUserBtn"><i class="bi bi-person-plus"></i> Tambah Pengguna</button>
    </div>
    <div class="table-responsive">
      <table class="table bg-white align-middle">
        <thead><tr><th>Username</th><th>Nama</th><th>Peranan</th><th>Tab Dibenarkan</th><th></th></tr></thead>
        <tbody>
          ${usersData.users.map(u => `
            <tr>
              <td>${u.username}</td>
              <td>${u.displayName}</td>
              <td><span class="badge ${u.role === 'admin' ? 'bg-warning text-dark' : 'bg-secondary'}">${u.role === 'admin' ? 'Admin' : 'Pengguna'}</span></td>
              <td>${u.role === 'admin' ? 'Semua' : ((u.allowedTabs || []).map(id => tabLabel(tabsData, id)).join(', ') || '<span class="text-muted">Tiada</span>')}</td>
              <td class="text-nowrap">
                <button class="btn btn-sm btn-outline-secondary editUserBtn" data-id="${u.id}"><i class="bi bi-pencil"></i></button>
                ${u.id !== me.id ? `<button class="btn btn-sm btn-outline-danger delUserBtn" data-id="${u.id}"><i class="bi bi-trash"></i></button>` : ''}
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div id="userFormWrap"></div>
  `;

  el.querySelector('#addUserBtn').addEventListener('click', () => paintUserForm(el.querySelector('#userFormWrap'), null, el));
  el.querySelectorAll('.editUserBtn').forEach(b => b.addEventListener('click', () => {
    const u = usersData.users.find(x => x.id === b.dataset.id);
    paintUserForm(el.querySelector('#userFormWrap'), u, el);
  }));
  el.querySelectorAll('.delUserBtn').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Padam pengguna ni?')) return;
    try {
      await deleteUser(b.dataset.id);
      paintUsers(el);
    } catch (err) {
      alert(err.message);
    }
  }));
}

function paintUserForm(wrap, user, refreshEl) {
  const tabsData = getCached('tabs');
  const isEdit = !!user;
  wrap.innerHTML = `
    <div class="form-card p-3 mt-3">
      <h6>${isEdit ? 'Kemaskini Pengguna: ' + user.username : 'Tambah Pengguna Baru'}</h6>
      <form id="userForm" class="row g-2">
        <div class="col-md-4">
          <label class="form-label small">Username</label>
          <input class="form-control" name="username" value="${user ? user.username : ''}" ${isEdit ? 'disabled' : 'required'}>
        </div>
        <div class="col-md-4">
          <label class="form-label small">Nama Papar</label>
          <input class="form-control" name="displayName" value="${user ? user.displayName : ''}">
        </div>
        <div class="col-md-4">
          <label class="form-label small">Password ${isEdit ? '(kosongkan jika tak nak tukar)' : ''}</label>
          <input class="form-control" name="password" type="password" ${isEdit ? '' : 'required'}>
        </div>
        <div class="col-md-4">
          <label class="form-label small">Peranan</label>
          <select class="form-select" name="role">
            <option value="user" ${user && user.role === 'user' ? 'selected' : ''}>Pengguna Biasa</option>
            <option value="admin" ${user && user.role === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
        </div>
        <div class="col-12">
          <label class="form-label small d-block">Tab Dibenarkan (untuk Pengguna Biasa)</label>
          ${tabsData.tabs.map(t => `
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="checkbox" name="allowedTabs" value="${t.id}" id="perm_${t.id}" ${user && (user.allowedTabs || []).includes(t.id) ? 'checked' : ''}>
              <label class="form-check-label" for="perm_${t.id}">${t.label}</label>
            </div>
          `).join('')}
        </div>
        <div class="col-12 d-flex gap-2 mt-2">
          <button type="submit" class="btn btn-primary btn-sm">Simpan</button>
          <button type="button" class="btn btn-outline-secondary btn-sm" id="cancelUserForm">Batal</button>
        </div>
      </form>
    </div>
  `;
  wrap.querySelector('#cancelUserForm').addEventListener('click', () => { wrap.innerHTML = ''; });
  wrap.querySelector('#userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const allowedTabs = fd.getAll('allowedTabs');
    const submitBtn = e.target.querySelector('button[type=submit]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan...';
    try {
      if (isEdit) {
        await updateUser(user.id, {
          displayName: fd.get('displayName'),
          password: fd.get('password') || undefined,
          role: fd.get('role'),
          allowedTabs,
        });
      } else {
        await createUser({
          username: fd.get('username'),
          password: fd.get('password'),
          displayName: fd.get('displayName'),
          role: fd.get('role'),
          allowedTabs,
        });
      }
      wrap.innerHTML = '';
      paintUsers(refreshEl);
    } catch (err) {
      alert(err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Simpan';
    }
  });
}

function paintTabsManager(el) {
  const tabsData = getCached('tabs');
  el.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0">Urus Tab</h5>
      <button class="btn btn-primary btn-sm" id="addTabBtn"><i class="bi bi-plus-lg"></i> Tambah Tab Baru</button>
    </div>
    <ul class="list-group">
      ${tabsData.tabs.map(t => `
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <span>${t.icon || ''} ${t.label} ${t.builtin ? '<span class="badge bg-secondary">Asal</span>' : '<span class="badge bg-info text-dark">Custom</span>'}</span>
          ${!t.builtin ? `<button class="btn btn-sm btn-outline-danger delTabBtn" data-id="${t.id}"><i class="bi bi-trash"></i></button>` : ''}
        </li>
      `).join('')}
    </ul>
    <div id="tabFormWrap"></div>
  `;
  el.querySelector('#addTabBtn').addEventListener('click', () => {
    const wrap = el.querySelector('#tabFormWrap');
    wrap.innerHTML = `
      <div class="form-card p-3 mt-3">
        <h6>Tab Baru</h6>
        <form id="newTabForm" class="row g-2">
          <div class="col-md-6">
            <label class="form-label small">Nama Tab</label>
            <input class="form-control" name="label" required placeholder="Cth: Katering, Fotografi...">
          </div>
          <div class="col-md-4">
            <label class="form-label small">Emoji/Ikon</label>
            <input class="form-control" name="icon" placeholder="📌" maxlength="4">
          </div>
          <div class="col-12">
            <button type="submit" class="btn btn-primary btn-sm">Cipta Tab</button>
          </div>
        </form>
      </div>
    `;
    wrap.querySelector('#newTabForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const id = 'custom_' + genId('t');
      const newTab = { id, label: fd.get('label'), icon: fd.get('icon') || '📌', builtin: false, type: 'custom' };
      const submitBtn = e.target.querySelector('button[type=submit]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Mencipta...';
      try {
        tabsData.tabs.push(newTab);
        await Store.saveTabs(tabsData, `Tambah tab baru: ${newTab.label}`);
        wrap.innerHTML = '';
        paintTabsManager(el);
      } catch (err) {
        tabsData.tabs = tabsData.tabs.filter(t => t.id !== id);
        alert(err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Cipta Tab';
      }
    });
  });
  el.querySelectorAll('.delTabBtn').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Padam tab ni? Data sedia ada takkan dipadam dari repo tapi tab takkan dipaparkan lagi.')) return;
    const backup = tabsData.tabs;
    tabsData.tabs = tabsData.tabs.filter(t => t.id !== b.dataset.id);
    try {
      await Store.saveTabs(tabsData, 'Padam tab');
      paintTabsManager(el);
    } catch (err) {
      tabsData.tabs = backup;
      alert(err.message);
    }
  }));
}
