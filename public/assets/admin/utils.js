export function $(selector, root = document) {
  return root.querySelector(selector);
}

export function $$(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function setSubmitLoading(button, text) {
  if (!button) return;
  button.disabled = true;
  button.dataset.originalText = button.textContent;
  button.textContent = text;
}

export function preserveSubmitterValue(form, submitter) {
  if (!form || !submitter?.name) return;
  form.querySelectorAll(`input[data-submit-preserve="${submitter.name}"]`).forEach((input) => input.remove());
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = submitter.name;
  input.value = submitter.value;
  input.dataset.submitPreserve = submitter.name;
  form.appendChild(input);
}

export function rememberFormControls() {
  document.querySelectorAll('[data-remember]').forEach((control) => {
    const key = `nyaovo:${control.dataset.remember}`;
    const saved = localStorage.getItem(key);
    if (saved !== null) control.value = saved;
    control.addEventListener('change', () => localStorage.setItem(key, control.value));
    control.addEventListener('input', () => localStorage.setItem(key, control.value));
  });
}

export function adminHref(href) {
  try {
    const url = new URL(href, window.location.origin);
    return `${url.pathname}${url.search}`;
  } catch {
    return href;
  }
}
