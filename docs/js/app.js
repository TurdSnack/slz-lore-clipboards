'use strict';

// ── Audio map ────────────────────────────────────────────────────
// Replace src paths with your actual audio files (mp3/ogg/wav).
// Set src to null to disable audio for that level.
// Keys must match the folder names used in MonoBehaviour/.
const AUDIO_MAP = {
  'default':                  { src: null,                                    label: 'No audio assigned'         },
  '01 - descent':             { src: 'audio/01-descent.mp3',                  label: 'Descent'                   },
  '02 - bonelab hub':         { src: 'audio/02-bonelab-hub.mp3',              label: 'BONELAB Hub'               },
  '03 - longrun':             { src: 'audio/03-longrun.mp3',                  label: 'Long Run'                  },
  '04 - mine dive':           { src: 'audio/04-mine-dive.mp3',                label: 'Mine Dive'                 },
  '05 - big anomaly':         { src: 'audio/05-big-anomaly.mp3',              label: 'Big Anomaly'               },
  '06 - street puncher':      { src: 'audio/06-street-puncher.mp3',           label: 'Street Puncher'            },
  '09 - moonbase':            { src: 'audio/09-moonbase.mp3',                 label: 'Moonbase'                  },
  '11 - pillar climb':        { src: 'audio/11-pillar-climb.mp3',             label: 'Pillar Climb'              },
  '12 - big anomaly b':       { src: 'audio/12-big-anomaly-b.mp3',            label: 'Big Anomaly B'             },
  '13 - ascent':              { src: 'audio/13-ascent.mp3',                   label: 'Ascent'                    },
  '14 - home':                { src: 'audio/14-home.mp3',                     label: 'Home'                      },
  'big bone bowling':         { src: 'audio/big-bone-bowling.mp3',            label: 'Big Bone Bowling'          },
  'container yard':           { src: 'audio/container-yard.mp3',              label: 'Container Yard'            },
  'drop pit':                 { src: 'audio/drop-pit.mp3',                    label: 'Drop Pit'                  },
  'dungeon warrior':          { src: 'audio/dungeon-warrior.mp3',             label: 'Dungeon Warrior'           },
  'halfway park':             { src: 'audio/halfway-park.mp3',                label: 'Halfway Park'              },
  'mirror':                   { src: 'audio/mirror.mp3',                      label: 'Mirror'                    },
  'museum basement':          { src: 'audio/museum-basement.mp3',             label: 'Museum Basement'           },
  'neon district tac trial':  { src: 'audio/neon-district-tac-trial.mp3',     label: 'Neon District Tac Trial'   },
  'rooftops':                 { src: 'audio/rooftops.mp3',                    label: 'Rooftops'                  },
  'tuscany':                  { src: 'audio/tuscany.mp3',                     label: 'Tuscany'                   },
};

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

// ── DOM refs ─────────────────────────────────────────────────────
const grid         = document.getElementById('grid');
const searchInput  = document.getElementById('search');
const levelFilter  = document.getElementById('level-filter');
const emptyState   = document.getElementById('empty-state');

const modal          = document.getElementById('modal');
const modalBackdrop  = document.getElementById('modal-backdrop');
const modalClose     = document.getElementById('modal-close');
const modalTitle     = document.getElementById('modal-title');
const modalBody      = document.getElementById('modal-body');
const modalBadge     = document.getElementById('modal-badge');
const modalSource    = document.getElementById('modal-source');
const clipboardPaper = document.querySelector('.clipboard-paper');
const paperFrost     = document.querySelector('.paper-frost');

clipboardPaper.addEventListener('scroll', () => {
  paperFrost.classList.toggle('visible', clipboardPaper.scrollTop > 10);
});

const audioPlayer  = document.createElement('audio');
audioPlayer.loop   = true;
const audioToggle  = document.getElementById('audio-toggle');
const audioVolume  = document.getElementById('audio-volume');
const audioLabel   = document.getElementById('audio-track-label');

audioPlayer.volume = parseFloat(audioVolume.value);

// ── State ─────────────────────────────────────────────────────────
let currentLevel = null;

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
      <div class="card-overlay">
        <span class="card-badge" style="color:${color};border-color:${color}">${levelLabel}</span>
        <h2 class="card-title">${cb._titlePlain || '(Untitled)'}</h2>
        ${previewText ? `<p class="card-preview">${previewText}&hellip;</p>` : ''}
      </div>
    `;

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

  modalTitle.textContent = plainTMP(cb.title) || '(Untitled)';
  modalBody.innerHTML    = parseTMP(cb.body)  || '<em>No content.</em>';
  modalSource.textContent = cb.source;

  modalBadge.textContent    = levelLabel;
  modalBadge.style.color       = color;
  modalBadge.style.borderColor = color;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Reset scroll and frost state for each new clipboard
  clipboardPaper.scrollTop = 0;
  paperFrost.classList.remove('visible');

  requestAnimationFrame(() => modalClose.focus());

  updateAudio(cb.level);
}

function closeModal() {
  modal.classList.add('hidden');
  document.body.style.overflow = '';
  stopAudio();
}

// ── Audio ─────────────────────────────────────────────────────────
function updateAudio(level) {
  const track = AUDIO_MAP[level] || AUDIO_MAP['default'];

  audioLabel.textContent = track.label;

  if (!track.src) {
    audioToggle.disabled    = true;
    audioToggle.textContent = '\u25B6';
    audioPlayer.pause();
    audioPlayer.src = '';
    currentLevel = null;
    return;
  }

  audioToggle.disabled = false;

  if (level !== currentLevel) {
    audioPlayer.src = track.src;
    audioPlayer.load();
    currentLevel = level;
    audioPlayer.play().then(() => {
      audioToggle.textContent = '\u23F8';
    }).catch(() => {
      // Browser blocked autoplay — user must press Play
      audioToggle.textContent = '\u25B6';
    });
  }
}

function stopAudio() {
  audioPlayer.pause();
  audioPlayer.src = '';
  currentLevel = null;
  audioToggle.textContent = '\u25B6';
  audioToggle.disabled    = true;
}

audioToggle.addEventListener('click', () => {
  if (audioPlayer.paused) {
    audioPlayer.play().then(() => { audioToggle.textContent = '\u23F8'; });
  } else {
    audioPlayer.pause();
    audioToggle.textContent = '\u25B6';
  }
});

audioVolume.addEventListener('input', () => {
  audioPlayer.volume = parseFloat(audioVolume.value);
});

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
