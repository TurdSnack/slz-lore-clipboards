'use strict';

// ── Level badge colour palette ───────────────────────────────────
// Colors are assigned to levels in alphabetical order, cycling through
// this list. Add more colours here if you add many new levels.
const PALETTE = [
  '#c9941a', // amber
  '#4e7fcf', // blue
  '#9b6ec8', // purple
  '#2ecfcf', // cyan
  '#4ecf7a', // green
  '#cf4e4e', // red
  '#cf894e', // orange
  '#e8c84e', // yellow
  '#cf4e9b', // pink
  '#4ecfb4', // teal
  '#9aaabf', // slate
  '#8ecf4e', // lime
  '#c86e6e', // rose
  '#6e8ecf', // periwinkle
  '#cfc24e', // gold
  '#4ecf9b', // seafoam
  '#cf6e9b', // mauve
  '#6ecfcf', // sky
  '#cf9b4e', // ochre
  '#9bcf4e', // yellow-green
  '#4e9bcf', // steel blue
  '#888888', // grey (default / unknown)
];

// Assign one palette colour per level, sorted alphabetically
const LEVEL_COLORS = (() => {
  const map = {};
  const keys = Object.keys(LEVEL_LABELS).sort();
  keys.forEach((k, i) => { map[k] = PALETTE[i % PALETTE.length]; });
  return map;
})();

function levelColor(level) {
  return LEVEL_COLORS[level] || PALETTE[PALETTE.length - 1];
}

// ── SFX ──────────────────────────────────────────────────────────
const sfxOpen  = new Audio('audio/vom_c4.mp3');
const sfxClose = new Audio('audio/biph_sdown_F.mp3');

function playSfx(sfx) {
  try {
    sfx.currentTime = 0;
    sfx.play().catch(() => {});
  } catch (_) {}
}

// ── DOM refs ─────────────────────────────────────────────────────
const grid         = document.getElementById('grid');
const searchInput  = document.getElementById('search');
const levelFilter  = document.getElementById('level-filter');
const emptyState   = document.getElementById('empty-state');

const modal          = document.getElementById('modal');
const modalBackdrop  = document.getElementById('modal-backdrop');
const modalClose     = document.getElementById('modal-close');
const modalTitle     = document.getElementById('modal-title');
const myth98ModalTitle   = document.getElementById('myth98-modal-title');
const modalBody      = document.getElementById('modal-body');
const modalBadge     = document.getElementById('modal-badge');
const modalSource    = document.getElementById('modal-source');
const clipboardPaper = document.querySelector('.clipboard-paper');
const paperFrost     = document.querySelector('.paper-frost');

clipboardPaper.addEventListener('scroll', () => {
  paperFrost.classList.toggle('visible', clipboardPaper.scrollTop > 10);
});


// ── Populate level filter from data ──────────────────────────────
(function populateFilter() {
  // Collect levels that actually appear in the data, in definition order
  const usedLevels = Object.keys(LEVEL_LABELS).filter(k =>
    k !== 'default' && CLIPBOARDS.some(cb => cb.level === k)
  );
  usedLevels.forEach(k => {
    const opt = document.createElement('option');
    opt.value       = k;
    opt.textContent = LEVEL_LABELS[k] || k;
    levelFilter.appendChild(opt);
  });
  // Unknown / default at the end if any exist
  if (CLIPBOARDS.some(cb => cb.level === 'default')) {
    const opt = document.createElement('option');
    opt.value       = 'default';
    opt.textContent = LEVEL_LABELS['default'] || 'Unknown';
    levelFilter.appendChild(opt);
  }
})();

// ── Build search index ────────────────────────────────────────────
const searchIndex = CLIPBOARDS.map(cb => ({
  ...cb,
  _titlePlain: plainTMP(cb.title).toLowerCase(),
  _bodyPlain:  plainTMP(cb.body).toLowerCase(),
}));

// ── Render grid ───────────────────────────────────────────────────
function renderGrid() {
  const query  = searchInput.value.trim().toLowerCase();
  const filter = levelFilter.value;

  const visible = searchIndex.filter(cb => {
    if (filter && cb.level !== filter) return false;
    if (query && !cb._titlePlain.includes(query) && !cb._bodyPlain.includes(query)) return false;
    return true;
  });

  grid.innerHTML = '';
  emptyState.classList.toggle('hidden', visible.length > 0);

  visible.forEach(cb => {
    const color      = levelColor(cb.level);
    const levelLabel = (LEVEL_LABELS && LEVEL_LABELS[cb.level]) || cb.level;
    const previewText = cb._bodyPlain.slice(0, 120).replace(/\s+/g, ' ');

    const card = document.createElement('article');
    card.className = 'card';
    card.tabIndex  = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Open: ${cb._titlePlain || 'Untitled'}`);
    card.dataset.id = cb.id;

    card.innerHTML = `
      <div class="myth98-titlebar card-titlebar">
        <span class="myth98-titlebar-text">${cb._titlePlain || '(Untitled)'}</span>
        <div class="myth98-titlebar-buttons" aria-hidden="true">
          <span class="myth98-btn myth98-btn-min">&#x2014;</span>
          <span class="myth98-btn myth98-btn-max">&#x25A1;</span>
          <span class="myth98-btn myth98-btn-close">&#x2715;</span>
        </div>
      </div>
      <div class="card-body">
        <div class="card-overlay">
          <span class="card-badge" style="border-color:${color};color:${color}">${levelLabel}</span>
          <h2 class="card-title">${cb._titlePlain || '(Untitled)'}</h2>
          ${previewText ? `<p class="card-preview">${previewText}&hellip;</p>` : ''}
        </div>
      </div>
    `;

    if (cb.thumbnail) {
      card.querySelector('.card-body').style.backgroundImage = `url('${cb.thumbnail}')`;
    }

    card.addEventListener('click', () => openModal(cb));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(cb); }
    });

    grid.appendChild(card);
  });
}

// ── Modal open/close ──────────────────────────────────────────────
function openModal(cb) {
  const color      = levelColor(cb.level);
  const levelLabel = (LEVEL_LABELS && LEVEL_LABELS[cb.level]) || cb.level;

  modalTitle.textContent   = plainTMP(cb.title) || '(Untitled)';
  if (myth98ModalTitle) myth98ModalTitle.textContent = plainTMP(cb.title) || '(Untitled)';
  modalBody.innerHTML    = parseTMP(cb.body)  || '<em>No content.</em>';
  modalSource.textContent = cb.source;

  modalBadge.textContent    = levelLabel;
  modalBadge.style.color       = color;
  modalBadge.style.borderColor = color;

  playSfx(sfxOpen);
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Reset scroll and frost state for each new clipboard
  clipboardPaper.scrollTop = 0;
  paperFrost.classList.remove('visible');

  requestAnimationFrame(() => modalClose.focus());
}

function closeModal() {
  playSfx(sfxClose);
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

// ── Event listeners ───────────────────────────────────────────────
searchInput.addEventListener('input',  renderGrid);
levelFilter.addEventListener('change', renderGrid);

modalClose.addEventListener('click',    closeModal);
modalBackdrop.addEventListener('click', closeModal);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
});

// ── Init ──────────────────────────────────────────────────────────
renderGrid();
