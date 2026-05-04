import { $, escapeHtml, formatSize, setSubmitLoading } from './utils.js';

export function initUploadPreview() {
  const fileInput = $('#fileInput');
  const dropZone = $('#dropZone');
  const fileList = $('#fileList');
  const uploadForm = $('#uploadForm');
  const uploadMessage = $('#uploadMessage');
  const nameMode = $('#nameMode');
  const customName = $('#customName');
  const maxFiles = Number.parseInt(uploadForm?.dataset.maxFiles || '20', 10);
  let queuedFiles = [];
  const previewUrls = new Map();

  function showUploadMessage(text, type = 'info') {
    if (!uploadMessage) return;
    uploadMessage.hidden = false;
    uploadMessage.textContent = text;
    uploadMessage.className = `upload-message ${type}`;
  }

  function clearUploadMessage() {
    if (!uploadMessage) return;
    uploadMessage.hidden = true;
    uploadMessage.textContent = '';
    uploadMessage.className = 'upload-message';
  }

  function syncFileInput() {
    if (!fileInput) return;
    const transfer = new DataTransfer();
    queuedFiles.forEach((file) => transfer.items.add(file));
    fileInput.files = transfer.files;
  }

  function fileKey(file) {
    return `${file.name}:${file.size}:${file.lastModified}`;
  }

  function getPreviewUrl(file) {
    const key = fileKey(file);
    if (!previewUrls.has(key)) {
      previewUrls.set(key, URL.createObjectURL(file));
    }
    return previewUrls.get(key);
  }

  function revokePreviewUrl(file) {
    const key = fileKey(file);
    const url = previewUrls.get(key);
    if (!url) return;
    URL.revokeObjectURL(url);
    previewUrls.delete(key);
  }

  function renderSelectedFiles() {
    if (!fileList) return;
    if (queuedFiles.length === 0) {
      fileList.hidden = true;
      fileList.innerHTML = '';
      return;
    }

    fileList.hidden = false;
    fileList.innerHTML = `
      <div class="selected-summary">
        <span>已选择 ${queuedFiles.length} 个文件</span>
        <button type="button" class="text-button" id="clearQueuedFiles">清空</button>
      </div>
      <ul>
        ${queuedFiles
          .map((file, index) => {
            const name = escapeHtml(file.name);
            const previewUrl = escapeHtml(getPreviewUrl(file));
            return `<li>
              <img src="${previewUrl}" alt="" loading="lazy">
              <span title="${name}">${name}</span>
              <em>${formatSize(file.size)}</em>
              <button type="button" class="remove-file" data-index="${index}" aria-label="移除 ${name}">移除</button>
            </li>`;
          })
          .join('')}
      </ul>
    `;
  }

  function addFiles(files) {
    const current = new Set(queuedFiles.map(fileKey));
    const incoming = Array.from(files || []);
    let added = 0;
    for (const file of incoming) {
      if (queuedFiles.length >= maxFiles) break;
      const key = fileKey(file);
      if (current.has(key)) continue;
      queuedFiles.push(file);
      current.add(key);
      added += 1;
    }
    syncFileInput();
    renderSelectedFiles();
    if (incoming.length > added) {
      showUploadMessage(`已添加 ${added} 个文件，重复文件或超过上限的文件已跳过。`, 'info');
    } else {
      clearUploadMessage();
    }
  }

  function removeQueuedFile(index) {
    const [removed] = queuedFiles.splice(index, 1);
    if (removed) revokePreviewUrl(removed);
    syncFileInput();
    renderSelectedFiles();
  }

  function clearQueuedFiles() {
    queuedFiles.forEach(revokePreviewUrl);
    queuedFiles = [];
    syncFileInput();
    renderSelectedFiles();
  }

  function syncNameModeState() {
    if (!nameMode || !customName) return;
    const customEnabled = nameMode.value === 'custom';
    customName.disabled = !customEnabled;
    if (!customEnabled) {
      customName.value = '';
      localStorage.removeItem(`nyaovo:${customName.dataset.remember}`);
    }
  }

  syncNameModeState();
  nameMode?.addEventListener('change', syncNameModeState);

  fileInput?.addEventListener('change', () => {
    addFiles(fileInput.files);
  });

  fileList?.addEventListener('click', (event) => {
    const removeButton = event.target.closest('.remove-file');
    if (removeButton) {
      removeQueuedFile(Number.parseInt(removeButton.dataset.index, 10));
      return;
    }
    if (event.target.closest('#clearQueuedFiles')) {
      clearQueuedFiles();
    }
  });

  if (dropZone && fileInput) {
    ['dragenter', 'dragover'].forEach((name) => {
      dropZone.addEventListener(name, (event) => {
        event.preventDefault();
        dropZone.classList.add('dragging');
      });
    });

    ['dragleave', 'drop'].forEach((name) => {
      dropZone.addEventListener(name, (event) => {
        event.preventDefault();
        dropZone.classList.remove('dragging');
      });
    });

    dropZone.addEventListener('drop', (event) => {
      if (!event.dataTransfer?.files?.length) return;
      addFiles(event.dataTransfer.files);
    });
  }

  if (uploadForm && fileInput) {
    const uploadProgress = $('#uploadProgress');
    const progressBar = $('#progressBar');
    const progressPercent = $('#progressPercent');
    const progressBytes = $('#progressBytes');
    const progressSpeed = $('#progressSpeed');

    uploadForm.addEventListener('submit', (event) => {
      if (uploadForm.dataset.submitting === 'true') {
        event.preventDefault();
        return;
      }
      syncFileInput();
      if (!fileInput.files || fileInput.files.length === 0) {
        event.preventDefault();
        showUploadMessage('请先选择或拖入至少一张图片。', 'error');
        return;
      }

      event.preventDefault();
      uploadForm.dataset.submitting = 'true';
      const submitBtn = event.submitter || uploadForm.querySelector('button[type="submit"]');
      setSubmitLoading(submitBtn, '上传中...');
      clearUploadMessage();

      if (uploadProgress) {
        uploadProgress.hidden = false;
        uploadProgress.setAttribute('aria-valuenow', '0');
        progressBar.value = 0;
        progressPercent.textContent = '0%';
        progressBytes.textContent = '0 B / 0 B';
        progressSpeed.textContent = '0 B/s';
      }

      const formData = new FormData(uploadForm);
      const xhr = new XMLHttpRequest();
      let lastLoaded = 0;
      let lastTime = Date.now();

      xhr.upload.onprogress = (e) => {
        if (!uploadProgress) return;
        const now = Date.now();
        const timeDiff = (now - lastTime) / 1000;

        if (timeDiff > 0.2 || e.loaded === e.total) {
          const loadedDiff = e.loaded - lastLoaded;
          const speed = timeDiff > 0 ? loadedDiff / timeDiff : 0;

          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            progressBar.value = percent;
            uploadProgress.setAttribute('aria-valuenow', String(percent));
            progressPercent.textContent = `${percent}%`;
            progressBytes.textContent = `${formatSize(e.loaded)} / ${formatSize(e.total)}`;
          } else {
            progressBar.removeAttribute('value');
            progressPercent.textContent = '上传中...';
            progressBytes.textContent = `${formatSize(e.loaded)}`;
          }

          progressSpeed.textContent = `${formatSize(speed)}/s`;

          lastLoaded = e.loaded;
          lastTime = now;
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 400) {
          let redirect = uploadForm.action.split('?')[0];
          try {
            redirect = JSON.parse(xhr.responseText).redirect || redirect;
          } catch {}
          window.location.href = redirect;
        } else {
          handleUploadError(new Error(`HTTP ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        handleUploadError(new Error('网络错误，上传失败'));
      };

      function handleUploadError(err) {
        uploadForm.dataset.submitting = 'false';
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.originalText || '上传图片';
        if (uploadProgress) uploadProgress.hidden = true;
        showUploadMessage(`上传失败: ${err.message}`, 'error');
      }

      xhr.open(uploadForm.method, uploadForm.action);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      xhr.send(formData);
    });
  }

  window.addEventListener('beforeunload', () => {
    queuedFiles.forEach(revokePreviewUrl);
  });
}
