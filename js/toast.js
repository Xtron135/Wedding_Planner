let container = null;

function ensureContainer() {
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = 1080;
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message, variant = 'success') {
  const el = document.createElement('div');
  el.className = `toast align-items-center text-white bg-${variant} border-0`;
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  ensureContainer().appendChild(el);
  const toast = new window.bootstrap.Toast(el, { delay: 2000 });
  el.addEventListener('hidden.bs.toast', () => el.remove());
  toast.show();
}
