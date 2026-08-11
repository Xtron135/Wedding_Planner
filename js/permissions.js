export const SIDE_TAB_TYPES = ['checklist', 'budget', 'guests', 'vendors', 'custom'];

export function canView(user, tabId) {
  if (!user) return false;
  if (tabId === 'dashboard') return true;
  if (user.role === 'admin') return true;
  return Array.isArray(user.allowedTabs) && (user.allowedTabs.includes('*') || user.allowedTabs.includes(tabId));
}

export function isAdmin(user) {
  return !!user && user.role === 'admin';
}

// Which of 'lelaki' / 'perempuan' a user may view within a given side-based tab.
// No explicit restriction on record (legacy users, or admins) = full access to both sides.
export function getAllowedSides(user, tabId) {
  if (!user) return [];
  if (user.role === 'admin') return ['lelaki', 'perempuan'];
  const sa = user.sideAccess && user.sideAccess[tabId];
  if (!Array.isArray(sa)) return ['lelaki', 'perempuan'];
  return sa;
}
