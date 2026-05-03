document.addEventListener('click', async (event) => {
  const copyButton = event.target.closest('.copy-button');
  if (!copyButton) return;

  const text = copyButton.dataset.copy;
  try {
    await navigator.clipboard.writeText(text);
    copyButton.textContent = '已复制';
    setTimeout(() => {
      copyButton.textContent = '复制 URL';
    }, 1200);
  } catch {
    window.prompt('复制 URL', text);
  }
});

document.addEventListener('submit', (event) => {
  const form = event.target.closest('.confirm-form');
  if (!form) return;
  const message = form.dataset.confirm || '确定执行此操作吗？';
  if (!window.confirm(message)) {
    event.preventDefault();
  }
});
