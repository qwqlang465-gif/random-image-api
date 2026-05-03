import { $, $$, adminHref } from './utils.js';

const imagePageSize = 24;
const imageSearchKey = 'nyaovo:imageSearch';
const imageSortKey = 'nyaovo:imageSort';

export function initFilters({ updateBatchState }) {
  const imageGrid = $('.image-grid');
  const imageSearch = $('#imageSearch');
  const imageSort = $('#imageSort');
  const imageResultCount = $('#imageResultCount');
  const resetImageFilters = $('#resetImageFilters');
  const loadMoreImages = $('#loadMoreImages');
  const loadMoreStatus = $('#loadMoreStatus');
  let visibleImageLimit = imagePageSize;
  let filterLoading = false;
  let currentPathSearch = `${window.location.pathname}${window.location.search}`;

  function rememberFilters() {
    const adminPath = window.location.pathname;
    if (!window.location.search) {
      const saved = localStorage.getItem('nyaovo:lastFilter');
      if (saved && saved.startsWith(adminPath) && adminHref(saved) !== window.location.pathname) {
        window.location.replace(adminHref(saved));
      }
    }
  }

  function rememberImageTools() {
    if (imageSearch) {
      imageSearch.value = localStorage.getItem(imageSearchKey) || '';
    }
    if (imageSort) {
      const savedSort = localStorage.getItem(imageSortKey);
      if (savedSort && Array.from(imageSort.options).some((option) => option.value === savedSort)) {
        imageSort.value = savedSort;
      }
    }
  }

  function cardValue(card, key) {
    const value = Number.parseFloat(card.dataset[key] || '0');
    return Number.isFinite(value) ? value : 0;
  }

  function sortedImageCards(cards) {
    const sort = imageSort?.value || 'newest';
    return [...cards].sort((a, b) => {
      if (sort === 'oldest') return cardValue(a, 'mtime') - cardValue(b, 'mtime');
      if (sort === 'name-asc') return (a.dataset.filename || '').localeCompare(b.dataset.filename || '');
      if (sort === 'name-desc') return (b.dataset.filename || '').localeCompare(a.dataset.filename || '');
      if (sort === 'size-desc') return cardValue(b, 'size') - cardValue(a, 'size');
      if (sort === 'size-asc') return cardValue(a, 'size') - cardValue(b, 'size');
      if (sort === 'resolution-desc') return cardValue(b, 'width') * cardValue(b, 'height') - cardValue(a, 'width') * cardValue(a, 'height');
      if (sort === 'resolution-asc') return cardValue(a, 'width') * cardValue(a, 'height') - cardValue(b, 'width') * cardValue(b, 'height');
      return cardValue(b, 'mtime') - cardValue(a, 'mtime');
    });
  }

  function applyImageFilters({ resetPage = true } = {}) {
    if (!imageGrid) return;
    if (resetPage) visibleImageLimit = imagePageSize;

    const query = (imageSearch?.value || '').trim().toLowerCase();
    const cards = $$('.image-card', imageGrid);
    const matched = sortedImageCards(cards.filter((card) => !query || (card.dataset.filename || '').includes(query)));

    matched.forEach((card) => imageGrid.appendChild(card));

    cards.forEach((card) => {
      card.hidden = true;
      card.dataset.filteredVisible = 'false';
    });

    matched.slice(0, visibleImageLimit).forEach((card) => {
      card.hidden = false;
      card.dataset.filteredVisible = 'true';
    });

    if (imageResultCount) {
      imageResultCount.textContent = `当前 ${matched.length} 张，已显示 ${Math.min(matched.length, visibleImageLimit)} 张`;
    }

    const hasMore = matched.length > visibleImageLimit;
    if (loadMoreImages) loadMoreImages.hidden = !hasMore;
    if (loadMoreStatus) {
      loadMoreStatus.textContent = hasMore ? `还有 ${matched.length - visibleImageLimit} 张` : matched.length ? '已全部显示' : '无匹配图片';
    }

    updateBatchState?.();
  }

  async function loadFilterUrl(href, { push = true } = {}) {
    if (!imageGrid || filterLoading) return;
    const target = adminHref(href);
    const currentScroll = { x: window.scrollX, y: window.scrollY };
    filterLoading = true;
    if (loadMoreStatus) loadMoreStatus.textContent = '正在更新筛选...';

    try {
      const response = await fetch(target, {
        headers: { 'X-Requested-With': 'fetch' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const nextFilters = doc.querySelector('.filters');
      const nextGrid = doc.querySelector('.image-grid');
      const filters = document.querySelector('.filters');
      if (!nextFilters || !nextGrid || !filters) throw new Error('页面结构不完整');

      filters.innerHTML = nextFilters.innerHTML;
      imageGrid.innerHTML = nextGrid.innerHTML;
      visibleImageLimit = imagePageSize;
      applyImageFilters();

      if (push) {
        window.history.pushState({ filterUrl: target }, '', target);
      }
      currentPathSearch = target;
      localStorage.setItem('nyaovo:lastFilter', target);
      window.scrollTo(currentScroll.x, currentScroll.y);
    } catch {
      window.location.assign(target);
    } finally {
      filterLoading = false;
    }
  }

  rememberFilters();
  rememberImageTools();

  document.addEventListener('click', (event) => {
    const link = event.target.closest('.filter-row a');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = adminHref(link.getAttribute('href'));
    if (!target.startsWith(window.location.pathname)) return;
    event.preventDefault();
    loadFilterUrl(target);
  });

  imageSearch?.addEventListener('input', () => {
    localStorage.setItem(imageSearchKey, imageSearch.value);
    applyImageFilters();
  });

  imageSearch?.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !imageSearch.value) return;
    imageSearch.value = '';
    localStorage.removeItem(imageSearchKey);
    applyImageFilters();
  });

  imageSort?.addEventListener('change', () => {
    localStorage.setItem(imageSortKey, imageSort.value);
    applyImageFilters();
  });

  loadMoreImages?.addEventListener('click', () => {
    visibleImageLimit += imagePageSize;
    applyImageFilters({ resetPage: false });
  });

  resetImageFilters?.addEventListener('click', (event) => {
    localStorage.removeItem('nyaovo:lastFilter');
    localStorage.removeItem(imageSearchKey);
    localStorage.removeItem(imageSortKey);
    if (imageSearch) imageSearch.value = '';
    if (imageSort) imageSort.value = 'newest';
    const target = adminHref(resetImageFilters.getAttribute('href'));
    if (!target.startsWith(window.location.pathname)) return;
    event.preventDefault();
    loadFilterUrl(target);
  });

  applyImageFilters();

  window.addEventListener('popstate', () => {
    const nextPathSearch = `${window.location.pathname}${window.location.search}`;
    if (nextPathSearch === currentPathSearch) return;
    currentPathSearch = nextPathSearch;
    loadFilterUrl(nextPathSearch, { push: false });
  });
}
