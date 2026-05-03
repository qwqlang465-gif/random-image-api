import { setSubmitLoading } from './utils.js';

export function initConfirm() {
  document.addEventListener('submit', (event) => {
    const form = event.target.closest('.confirm-form');
    if (!form) return;
    if (form.dataset.submitting === 'true') {
      event.preventDefault();
      return;
    }
    const message = form.dataset.confirm || '确定执行此操作吗？';
    if (!window.confirm(message)) {
      event.preventDefault();
      return;
    }
    form.dataset.submitting = 'true';
    setSubmitLoading(event.submitter || form.querySelector('button[type="submit"]'), '处理中...');
  });
}
