export const PRESETS = [
  { id: 'blush', name: 'Blush Rose', primary: '#c17b8a', primaryHover: '#a86373', blush: '#f7dde0', cream: '#fffaf6', text: '#3a2e2a' },
  { id: 'blue', name: 'Dusty Blue', primary: '#6b8cae', primaryHover: '#557295', blush: '#dbe7f3', cream: '#f7fafc', text: '#2c3e50' },
  { id: 'sage', name: 'Sage Green', primary: '#7a9b76', primaryHover: '#638a5f', blush: '#e2ecdf', cream: '#f8faf6', text: '#2f3b2c' },
  { id: 'lavender', name: 'Lavender', primary: '#9b7fb8', primaryHover: '#8266a3', blush: '#ebe1f5', cream: '#faf7fc', text: '#362b42' },
  { id: 'gold', name: 'Classic Gold', primary: '#b8935f', primaryHover: '#9c7a49', blush: '#f2e7d5', cream: '#fdfaf4', text: '#3a2f1f' },
];

const THEME_KEY = 'wp_theme_id';
const CUSTOM_KEY = 'wp_theme_custom_primary';
const DARK_KEY = 'wp_dark_mode';

const DARK_BG = '#1c1917';
const DARK_TEXT = '#f3ece7';
const DARK_BLUSH = '#332a26';

export function getThemeId() {
  const id = localStorage.getItem(THEME_KEY);
  return PRESETS.some(p => p.id === id) ? id : 'blush';
}
export function getCustomPrimary() {
  return localStorage.getItem(CUSTOM_KEY) || '';
}
export function isDarkMode() {
  return localStorage.getItem(DARK_KEY) === '1';
}

export function setThemeId(id) {
  localStorage.setItem(THEME_KEY, id);
  applyTheme();
}
export function setCustomPrimary(hex) {
  if (hex) localStorage.setItem(CUSTOM_KEY, hex);
  else localStorage.removeItem(CUSTOM_KEY);
  applyTheme();
}
export function setDarkMode(on) {
  localStorage.setItem(DARK_KEY, on ? '1' : '0');
  applyTheme();
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function shade(hex, percent) {
  try {
    const [r, g, b] = hexToRgb(hex);
    const target = percent < 0 ? 0 : 255;
    const p = Math.abs(percent);
    const nr = Math.round((target - r) * p) + r;
    const ng = Math.round((target - g) * p) + g;
    const nb = Math.round((target - b) * p) + b;
    return `#${[nr, ng, nb].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')}`;
  } catch (e) {
    return hex;
  }
}

export function applyTheme() {
  const preset = PRESETS.find(p => p.id === getThemeId()) || PRESETS[0];
  const custom = getCustomPrimary();
  const dark = isDarkMode();

  // In dark mode, lighten the accent colour a touch so it stays readable on a dark background.
  const primary = custom || (dark ? shade(preset.primary, 0.2) : preset.primary);
  const primaryHover = custom ? shade(custom, dark ? 0.2 : -0.18) : (dark ? preset.primary : preset.primaryHover);

  const root = document.documentElement;
  root.style.setProperty('--wp-primary', primary);
  root.style.setProperty('--wp-primary-hover', primaryHover);

  if (dark) {
    root.style.setProperty('--wp-blush', DARK_BLUSH);
    root.style.setProperty('--wp-gold', preset.primary);
    root.style.setProperty('--wp-cream', DARK_BG);
    root.style.setProperty('--wp-text', DARK_TEXT);
  } else {
    root.style.setProperty('--wp-blush', preset.blush);
    root.style.setProperty('--wp-gold', preset.primary);
    root.style.setProperty('--wp-cream', preset.cream);
    root.style.setProperty('--wp-text', preset.text);
  }

  document.body.classList.toggle('dark-mode', dark);
}
