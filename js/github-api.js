import { GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } from './config.js';

const API_BASE = 'https://api.github.com';
const TOKEN_KEY = 'wp_gh_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders() {
  const token = getToken();
  return {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github+json',
  };
}

function b64EncodeUnicode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function b64DecodeUnicode(str) {
  return decodeURIComponent(escape(atob(str.replace(/\n/g, ''))));
}

export async function ghGetFile(path) {
  const url = `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}&t=${Date.now()}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (res.status === 404) return { data: null, sha: null };
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GitHub GET ${path} gagal (${res.status}): ${err.message || res.statusText}`);
  }
  const json = await res.json();
  const text = b64DecodeUnicode(json.content);
  return { data: JSON.parse(text), sha: json.sha };
}

export async function ghPutFile(path, dataObj, message, sha) {
  const body = {
    message,
    content: b64EncodeUnicode(JSON.stringify(dataObj, null, 2)),
    branch: GITHUB_BRANCH,
  };
  if (sha) body.sha = sha;
  const url = `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GitHub PUT ${path} gagal (${res.status}): ${err.message || res.statusText}`);
  }
  const json = await res.json();
  return json.content.sha;
}

export async function verifyAccess() {
  const url = `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Repo tak jumpa / token tak sah (${res.status})`);
  }
  return true;
}
