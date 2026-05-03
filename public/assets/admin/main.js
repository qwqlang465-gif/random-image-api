import { initBatchActions } from './batch-actions.js';
import { initClipboard } from './clipboard.js';
import { initConfirm } from './confirm.js';
import { initFilters } from './filters.js';
import { initUploadPreview } from './upload-preview.js';
import { rememberFormControls } from './utils.js';

rememberFormControls();
initUploadPreview();
const batch = initBatchActions();
initFilters({ updateBatchState: batch.updateBatchState });
initClipboard();
initConfirm();
