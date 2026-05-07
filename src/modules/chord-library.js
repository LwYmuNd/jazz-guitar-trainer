import { renderChordDiagramSVG } from '../core/chord-diagram-renderer.js';
import {
  CHORD_PNG_DATABASE,
  getFamilies,
  getQualitiesByFamily,
  getDiagrams,
} from '../core/chord-png-database.js';

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createInitialState() {
  const families = getFamilies(CHORD_PNG_DATABASE);
  const defaultFamily = families[0]?.id ?? null;
  const qualities = defaultFamily ? getQualitiesByFamily(CHORD_PNG_DATABASE, defaultFamily) : [];
  const defaultQuality = qualities[0]?.id ?? null;
  return {
    currentFamily: defaultFamily,
    currentQuality: defaultQuality,
    diagrams: [],
  };
}

function renderFamilySelector(state) {
  const families = getFamilies(CHORD_PNG_DATABASE);
  if (families.length === 0) return '';
  return families
    .map(family => `
      <button
        type="button"
        class="filter-chip ${state.currentFamily === family.id ? 'active' : ''}"
        data-action="select-family"
        data-family="${escapeHtml(family.id)}"
      >
        ${escapeHtml(family.label)}
        <span class="filter-chip-count">${family.count}</span>
      </button>
    `)
    .join('');
}

function renderQualitySelector(state) {
  if (!state.currentFamily) return '';
  const qualities = getQualitiesByFamily(CHORD_PNG_DATABASE, state.currentFamily);
  if (qualities.length === 0) return '';
  return qualities
    .map(quality => `
      <button
        type="button"
        class="filter-chip ${state.currentQuality === quality.id ? 'active' : ''}"
        data-action="select-quality"
        data-quality="${escapeHtml(quality.id)}"
      >
        ${escapeHtml(quality.label)}
        <span class="filter-chip-count">${quality.count}</span>
      </button>
    `)
    .join('');
}

function renderPositionCard(diagram) {
  const svg = renderChordDiagramSVG({
    title: diagram.name,
    frets: diagram.frets,
    intervalLabels: diagram.intervalLabels,
    baseFret: diagram.baseFret,
    barre: diagram.barre,
    optionalDots: diagram.optionalDots,
    rootless: diagram.rootless,
  });

  const titleParts = [escapeHtml(diagram.name)];
  if (diagram.bassNote && !diagram.name.includes('/')) {
    titleParts.push(`<span class="chord-position-bass">/${escapeHtml(diagram.bassNote)}</span>`);
  }
  if (diagram.rootless) {
    titleParts.push('<span class="chord-position-tag">rootless</span>');
  }

  return `
    <div class="chord-position-card">
      <div class="chord-position-header">
        <strong>${titleParts.join(' ')}</strong>
        <span>${escapeHtml(diagram.qualityLabel)}</span>
      </div>
      <div class="chord-position-diagram">
        ${svg}
      </div>
      <div class="chord-position-meta">
        <span><b>Intervals:</b> ${escapeHtml(diagram.intervalsText) || '—'}</span>
        <span><b>Frets:</b> ${escapeHtml(diagram.fretsText)}</span>
        <span class="chord-position-source">${escapeHtml(diagram.source)}</span>
      </div>
    </div>
  `;
}

function renderPositionsGrid(state) {
  const families = getFamilies(CHORD_PNG_DATABASE);
  if (families.length === 0) {
    return `
      <div class="chord-library-empty">
        Chord PNG database is empty. Run <code>node scripts/parse-chord-png.js</code>
        and review drafts via <code>tools/chord-db-review.html</code> to populate
        <code>src/core/chord-png-db/</code>.
      </div>
    `;
  }
  if (!state.currentQuality) {
    return '<div class="chord-library-empty">Select a chord quality to view voicings</div>';
  }
  if (state.diagrams.length === 0) {
    return '<div class="chord-library-empty">No voicings available for this selection</div>';
  }
  return `
    <div class="chord-positions-grid">
      ${state.diagrams.map(renderPositionCard).join('')}
    </div>
  `;
}

function updateDiagrams(state) {
  if (!state.currentFamily || !state.currentQuality) {
    state.diagrams = [];
    return;
  }
  state.diagrams = getDiagrams(CHORD_PNG_DATABASE, {
    family: state.currentFamily,
    quality: state.currentQuality,
  });
}

export function initChordLibrary() {
  const container = document.getElementById('mod-chordLibrary');
  const state = createInitialState();

  container.innerHTML = `
    <div class="card">
      <h2>Jazz Guitar Chord Dictionary</h2>
      <p class="module-intro">Browse jazz guitar chord voicings by family and quality, with interval labels and fingerings rendered on a fretboard diagram.</p>

      <div class="chord-library-controls">
        <div class="chord-library-section">
          <h3>Voicing Family</h3>
          <div class="filter-chip-grid" id="cl-family-selector"></div>
        </div>

        <div class="chord-library-section">
          <h3>Chord Quality</h3>
          <div class="filter-chip-grid" id="cl-quality-selector"></div>
        </div>
      </div>

      <div id="cl-positions-container"></div>
    </div>
  `;

  const familySelector = document.getElementById('cl-family-selector');
  const qualitySelector = document.getElementById('cl-quality-selector');
  const positionsContainer = document.getElementById('cl-positions-container');

  function render() {
    familySelector.innerHTML = renderFamilySelector(state);
    qualitySelector.innerHTML = renderQualitySelector(state);
    positionsContainer.innerHTML = renderPositionsGrid(state);
  }

  container.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;

    if (action === 'select-family') {
      state.currentFamily = button.dataset.family;
      const qualities = getQualitiesByFamily(CHORD_PNG_DATABASE, state.currentFamily);
      if (!qualities.some(q => q.id === state.currentQuality)) {
        state.currentQuality = qualities[0]?.id ?? null;
      }
      updateDiagrams(state);
      render();
      return;
    }

    if (action === 'select-quality') {
      state.currentQuality = button.dataset.quality;
      updateDiagrams(state);
      render();
    }
  });

  updateDiagrams(state);
  render();
}
