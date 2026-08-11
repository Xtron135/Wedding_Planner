import { ghGetFile, ghPutFile } from './github-api.js';
import { DATA_PATH } from './config.js';

const cache = {};

function isConflictError(err) {
  const msg = String(err && err.message || '');
  return /\(409\)|\(422\)|does not match|sha wasn't supplied|sha was not supplied/i.test(msg);
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Jittered exponential backoff so a bunch of retriers (e.g. several people tapping
// "save" within the same second) desync instead of re-colliding on every retry round.
function backoffDelay(attempt) {
  const base = Math.min(1200, 80 * Math.pow(1.7, attempt));
  return base + Math.random() * 150;
}

async function loadFile(name, fallback) {
  const path = `${DATA_PATH}/${name}.json`;
  const { data, sha } = await ghGetFile(path);
  cache[name] = { data: data ?? fallback, sha };
  return cache[name].data;
}

// Safe read-modify-write: fetches the current file, applies mutatorFn to a working
// copy, and saves it. If GitHub rejects the write because someone else saved first
// (sha conflict), it re-fetches the latest version, re-applies the same mutation on
// top of THAT, and retries (with jittered backoff) — so several people editing at
// once never clobber each other. mutatorFn may throw to abort (e.g. validation
// errors) without retrying. maxRetries=7 gives up to 8 total attempts, enough
// headroom for a small family/planning group (tested up to 8 concurrent writers).
async function mutateFile(name, fallback, mutatorFn, message, maxRetries = 7) {
  const path = `${DATA_PATH}/${name}.json`;
  let attempt = 0;
  while (true) {
    let current;
    if (attempt === 0 && cache[name]) {
      current = cache[name].data;
    } else {
      const { data, sha } = await ghGetFile(path);
      current = data ?? fallback;
      cache[name] = { data: current, sha };
    }

    const working = deepClone(current ?? fallback);
    mutatorFn(working);

    try {
      const sha = cache[name] ? cache[name].sha : null;
      const newSha = await ghPutFile(path, working, message, sha);
      cache[name] = { data: working, sha: newSha };
      return working;
    } catch (err) {
      if (attempt >= maxRetries || !isConflictError(err)) throw err;
      attempt += 1;
      await sleep(backoffDelay(attempt));
      // loop again: re-fetch fresh copy and re-apply mutatorFn on top of it
    }
  }
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
  async loadWedding() {
    return loadFile('wedding', {
      groomName: '',
      brideName: '',
      createdAt: null,
      events: [
        { type: 'combined', date: '', venue: '' },
        { type: '', date: '', venue: '' },
      ],
    });
  },

  // Safe mutators (fetch-fresh + retry-once-on-conflict)
  async mutateTabData(tabId, mutatorFn, message) {
    return mutateFile(tabId, { lelaki: [], perempuan: [] }, mutatorFn, message || `Kemaskini ${tabId}`);
  },
  async mutateUsers(mutatorFn, message) {
    return mutateFile('users', { users: [] }, mutatorFn, message || 'Kemaskini pengguna');
  },
  async mutateTabs(mutatorFn, message) {
    return mutateFile('tabs', { tabs: [] }, mutatorFn, message || 'Kemaskini senarai tab');
  },
  async mutateWedding(mutatorFn, message) {
    return mutateFile('wedding', {
      groomName: '', brideName: '', createdAt: null,
      events: [{ type: 'combined', date: '', venue: '' }, { type: '', date: '', venue: '' }],
    }, mutatorFn, message || 'Update wedding info');
  },

  // Legacy whole-object save (kept for compatibility, no conflict retry)
  async saveUsers(users, message) {
    const path = `${DATA_PATH}/users.json`;
    const sha = cache.users ? cache.users.sha : null;
    const newSha = await ghPutFile(path, users, message || 'Kemaskini pengguna', sha);
    cache.users = { data: users, sha: newSha };
    return users;
  },
  async saveTabs(tabs, message) {
    const path = `${DATA_PATH}/tabs.json`;
    const sha = cache.tabs ? cache.tabs.sha : null;
    const newSha = await ghPutFile(path, tabs, message || 'Kemaskini senarai tab', sha);
    cache.tabs = { data: tabs, sha: newSha };
    return tabs;
  },
  async saveTabData(tabId, data, message) {
    const path = `${DATA_PATH}/${tabId}.json`;
    const sha = cache[tabId] ? cache[tabId].sha : null;
    const newSha = await ghPutFile(path, data, message || `Kemaskini ${tabId}`, sha);
    cache[tabId] = { data, sha: newSha };
    return data;
  },
  getCached,
};
