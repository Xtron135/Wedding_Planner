import { hashPassword, genSalt, genId } from './crypto.js';
import { Store, getCached } from './store.js';

const SESSION_KEY = 'wp_session_user';

export function getCurrentUser() {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}
export function setCurrentUser(user) {
  const safe = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    allowedTabs: user.allowedTabs,
    sideAccess: user.sideAccess,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(safe));
}
export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export async function login(username, password) {
  let usersFile = getCached('users');
  if (!usersFile) usersFile = (await Store.loadCore()).users;
  const user = usersFile.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
  if (!user) throw new Error('Username tak wujud.');
  const hash = await hashPassword(password, user.salt);
  if (hash !== user.passwordHash) throw new Error('Password salah.');
  setCurrentUser(user);
  return user;
}

export async function createUser({ username, password, displayName, role, allowedTabs, sideAccess }) {
  const salt = genSalt();
  const passwordHash = await hashPassword(password, salt);
  const cleanUsername = username.trim();
  const newUser = {
    id: genId('u'),
    username: cleanUsername,
    displayName: displayName || cleanUsername,
    passwordHash,
    salt,
    role: role || 'user',
    allowedTabs: role === 'admin' ? ['*'] : (allowedTabs || []),
    sideAccess: role === 'admin' ? {} : (sideAccess || {}),
  };

  await Store.mutateUsers((usersData) => {
    if (usersData.users.some(u => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
      throw new Error('Username dah wujud.');
    }
    usersData.users.push(newUser);
  }, `Tambah pengguna: ${cleanUsername}`);

  return newUser;
}

export async function updateUser(userId, patch) {
  let newHash = null;
  let newSalt = null;
  if (patch.password) {
    newSalt = genSalt();
    newHash = await hashPassword(patch.password, newSalt);
  }

  let updatedUser = null;
  const cachedTarget = (getCached('users') || { users: [] }).users.find(u => u.id === userId);
  const label = cachedTarget ? cachedTarget.username : userId;

  await Store.mutateUsers((usersData) => {
    const idx = usersData.users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('Pengguna tak jumpa.');
    const user = usersData.users[idx];
    if (newHash) {
      user.passwordHash = newHash;
      user.salt = newSalt;
    }
    if (patch.displayName !== undefined) user.displayName = patch.displayName;
    if (patch.role !== undefined) {
      user.role = patch.role;
      if (patch.role === 'admin') user.allowedTabs = ['*'];
    }
    if (patch.allowedTabs !== undefined && user.role !== 'admin') user.allowedTabs = patch.allowedTabs;
    if (patch.sideAccess !== undefined && user.role !== 'admin') user.sideAccess = patch.sideAccess;
    usersData.users[idx] = user;
    updatedUser = user;
  }, `Kemaskini pengguna: ${label}`);

  const current = getCurrentUser();
  if (current && current.id === updatedUser.id) setCurrentUser(updatedUser);
  return updatedUser;
}

export async function deleteUser(userId) {
  const cachedTarget = (getCached('users') || { users: [] }).users.find(u => u.id === userId);
  const label = cachedTarget ? cachedTarget.username : userId;

  await Store.mutateUsers((usersData) => {
    const target = usersData.users.find(u => u.id === userId);
    if (!target) throw new Error('Pengguna tak jumpa.');
    const adminCount = usersData.users.filter(u => u.role === 'admin').length;
    if (target.role === 'admin' && adminCount <= 1) throw new Error('Tak boleh padam admin terakhir.');
    usersData.users = usersData.users.filter(u => u.id !== userId);
  }, `Padam pengguna: ${label}`);
}
