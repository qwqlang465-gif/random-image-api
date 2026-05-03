import { $, $$, preserveSubmitterValue, setSubmitLoading } from './utils.js';

export function initBatchActions() {
  const selectedCount = $('#selectedCount');
  const selectAllImages = $('#selectAllImages');
  const batchForm = $('#batchForm');

  function checkedImages() {
    return $$('.image-checkbox:checked');
  }

  function updateBatchState() {
    const checkboxes = $$('.image-checkbox');
    const checked = checkedImages();
    if (selectedCount) selectedCount.textContent = `已选 ${checked.length} 张`;
    batchForm?.classList.toggle('has-selection', checked.length > 0);
    if (selectAllImages) {
      const visibleCheckboxes = checkboxes.filter((checkbox) => checkbox.closest('.image-card')?.dataset.filteredVisible === 'true');
      const visibleChecked = visibleCheckboxes.filter((checkbox) => checkbox.checked);
      selectAllImages.checked = visibleCheckboxes.length > 0 && visibleChecked.length === visibleCheckboxes.length;
      selectAllImages.indeterminate = visibleChecked.length > 0 && visibleChecked.length < visibleCheckboxes.length;
    }
  }

  document.addEventListener('change', (event) => {
    if (!event.target.matches('.image-checkbox')) return;
    event.target.closest('.image-card')?.classList.toggle('selected', event.target.checked);
    updateBatchState();
  });

  document.addEventListener('click', (event) => {
    const card = event.target.closest('.image-card');
    if (!card || event.target.closest('button, a, input, select, label, .card-actions')) return;
    const checkbox = card.querySelector('.image-checkbox');
    if (!checkbox) return;
    checkbox.checked = !checkbox.checked;
    card.classList.toggle('selected', checkbox.checked);
    updateBatchState();
  });

  selectAllImages?.addEventListener('change', () => {
    $$('.image-checkbox').forEach((checkbox) => {
      if (checkbox.closest('.image-card')?.dataset.filteredVisible !== 'true') return;
      checkbox.checked = selectAllImages.checked;
      checkbox.closest('.image-card')?.classList.toggle('selected', checkbox.checked);
    });
    updateBatchState();
  });

  batchForm?.addEventListener('submit', (event) => {
    if (batchForm.dataset.submitting === 'true') {
      event.preventDefault();
      return;
    }
    batchForm.querySelectorAll('input[name="images"]').forEach((input) => input.remove());
    const checked = checkedImages();
    if (checked.length === 0) {
      event.preventDefault();
      window.alert('请先选择要批量处理的图片。');
      return;
    }

    const submitter = event.submitter || batchForm.querySelector('button[type="submit"]');
    const action = submitter?.value;
    if (action === 'delete' && !window.confirm(`确定删除选中的 ${checked.length} 张图片吗？`)) {
      event.preventDefault();
      return;
    }

    checked.forEach((checkbox) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'images';
      input.value = checkbox.value;
      batchForm.appendChild(input);
    });
    preserveSubmitterValue(batchForm, submitter);
    batchForm.dataset.submitting = 'true';
    setSubmitLoading(submitter, '处理中...');
  });

  updateBatchState();
  return { updateBatchState };
}
