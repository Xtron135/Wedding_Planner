import { ghGetFile, ghPutFile } from './github-api.js';
import { DATA_PATH } from './config.js';

const cache = {};

async function loadFile(name, fallback) {
  const path = `${DATA_PATH}/${name}.json`;
  const { data, sha } = await ghGetFile(path);
  cache[name] = { data: data ?? fallback, sha };
  return cache[name].data;
}

async function saveFile(name, data, message) {
  const path = `${DATA_PATH}/${name}.json`;
  const sha = cache[name] ? cache[name].sha : null;
  const newSha = await ghPutFile(path, data, message, sha);
  cache[name] = { data, sha: newSha };
  return data;
}

export function getCached(name) {
  return cache[name] ? cache[name].data : undefined;
}

export const Store = {
  async loadCore() {
    const [users, tabs] = await Promise.all([
      loadFile('users', { users: [] }),
      loadFile('tabs', { tabs: [] }),
    ]);
    return { users, tabs };
  },
  async loadTabData(tabId) {
    return loadFile(tabId, { lelaki: [], perempuan: [] });
  },
  async saveUsers(users, message) {
    return saveFile('users', users, message || 'Kemaskini pengguna');
  },
  async saveTabs(tabs, message) {
    return saveFile('tabs', tabs, message || 'Kemaskini senarai tab');
  },
  async saveTabData(tabId, data, message) {
    return saveFile(tabId, data, message || `Kemaskini ${tabId}`);
  },
  getCached,
};
