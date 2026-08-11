export function canView(user, tabId) {
  if (!user) return false;
  if (tabId === 'dashboard') return true;
  if (user.role === 'admin') return true;
  return Array.isArray(user.allowedTabs) && (user.allowedTabs.includes('*') || user.allowedTabs.includes(tabId));
}
export function isAdmin(user) {
  return !!user && user.role === 'admin';
}
