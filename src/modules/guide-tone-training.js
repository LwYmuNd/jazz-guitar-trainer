/**
 * Guide Tone Line Training - UI Module
 */

import { NOTES, GUITAR_TUNING } from '../core/music-theory.js';
import {
  parseChordName,
  parseProgression,
  transposeProgression,
  noteToSemitone,
  generateGuideToneLine,
  getAllPositionsForSemitone,
  getChordTones,
  getSpelledChordTones,
  PRESET_PROGRESSIONS,
  VOICE_PART_COLORS,
} from '../core/guide-tone.js';
import { createCustomSelect } from '../components/custom-select.js';

// Fretboard dimensions
const FRETS = 15;
const STRINGS = 6;
const FRET_W = 56;
const STR_GAP = 32;
const START_X = 50;
const START_Y = 40;
const DOT_R = 14;

// Chord builder quality options
const BUILDER_QUALITIES = ['maj7', '7', 'm7', 'm7b5', 'dim7', '6', 'm6', 'aug', 'sus4', 'm', 'maj'];

// State
let state = {
  chords: [],      // [{root, quality}]
  voiceParts: ['3rd', '7th'],
  lines: [],       // generated guide tone lines
  focusedChordIndex: 0,
  selectedPreset: 'ii-V-I-major',
  customInput: '',
  key: 'C',
  builderRoot: 'C',
  builderQuality: 'maj7',
};

function regenerateLines() {
  if (!state.chords.length) {
    state.lines = [];
    return;
  }
  state.lines = generateGuideToneLine(state.chords, state.voiceParts, { startFret: 0, endFret: FRETS });
}

/**
 * Render the horizontal fretboard SVG with guide tone positions and connections.
 */
function renderFretboard(container) {
  const displayFrets = FRETS;
  const displayStart = 0;

  const W = FRET_W * (displayFrets + 1) + START_X + 30;
  const H = STR_GAP * (STRINGS + 1) + 40;

  let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;">`;
  svg += `<rect width="${W}" height="${H}" fill="#F5F0E8" rx="12"/>`;

  // Draw frets
  for (let f = 0; f <= displayFrets; f++) {
    const x = START_X + f * FRET_W;
    const actualFret = displayStart + f;
    const isNut = actualFret === 0;
    svg += `<line x1="${x}" y1="${START_Y}" x2="${x}" y2="${START_Y + (STRINGS - 1) * STR_GAP}" stroke="${isNut ? '#1E1B4B' : '#C8C0B4'}" stroke-width="${isNut ? 3 : 1}"/>`;
    if (actualFret > 0) {
      svg += `<text x="${x - FRET_W / 2}" y="${START_Y + (STRINGS - 1) * STR_GAP + 22}" fill="#6B6560" font-size="11" text-anchor="middle">${actualFret}</text>`;
    }
  }

  // Draw fret markers
  const markers = [3, 5, 7, 9, 12, 15, 17, 19];
  markers.forEach(d => {
    const relFret = d - displayStart;
    if (relFret > 0 && relFret <= displayFrets) {
      const cx = START_X + (relFret - 0.5) * FRET_W;
      if (d === 12) {
        svg += `<circle cx="${cx}" cy="${START_Y + 1.5 * STR_GAP}" r="4" fill="#D4CFC6"/>`;
        svg += `<circle cx="${cx}" cy="${START_Y + 3.5 * STR_GAP}" r="4" fill="#D4CFC6"/>`;
      } else {
        svg += `<circle cx="${cx}" cy="${START_Y + 2.5 * STR_GAP}" r="4" fill="#D4CFC6"/>`;
      }
    }
  });

  // Draw strings
  for (let s = 0; s < STRINGS; s++) {
    const y = START_Y + s * STR_GAP;
    svg += `<line x1="${START_X}" y1="${y}" x2="${START_X + displayFrets * FRET_W}" y2="${y}" stroke="#8A8070" stroke-width="${1 + s * 0.3}"/>`;

    // String label (open note)
    const openMidi = GUITAR_TUNING[STRINGS - 1 - s];
    const openNote = NOTES[openMidi % 12];
    svg += `<text x="${START_X - 22}" y="${y + 4}" fill="#6B6560" font-size="11" text-anchor="middle">${openNote}</text>`;
  }

  // Draw guide tone positions and connections
  svg += renderGuideTones(displayStart, displayFrets);

  svg += '</svg>';
  container.innerHTML = svg;
}

function posToXY(pos, displayStart) {
  const relFret = pos.fret - displayStart;
  const x = pos.fret === 0
    ? START_X - 2
    : START_X + (relFret - 0.5) * FRET_W;
  // String 1 (highest pitch) at top (row 0), String 6 (lowest) at bottom (row 5)
  const row = pos.string - 1;
  const y = START_Y + row * STR_GAP;
  return { x, y };
}

function renderGuideTones(displayStart, displayFrets) {
  let svg = '';
  const maxFret = FRETS;
  const focusIdx = state.focusedChordIndex;

  for (const voicePart of state.voiceParts) {
    const color = VOICE_PART_COLORS[voicePart] || '#7C3AED';

    const prevIdx = focusIdx - 1;
    const chordsToShow = [];
    if (prevIdx >= 0) chordsToShow.push(prevIdx);
    chordsToShow.push(focusIdx);

    const chordPositionsMap = {};
    for (const idx of chordsToShow) {
      if (idx < 0 || idx >= state.chords.length) continue;
      const chord = state.chords[idx];
      const tones = getChordTones(chord.root, chord.quality);
      if (!tones || tones[voicePart] === null || tones[voicePart] === undefined) {
        chordPositionsMap[idx] = [];
        continue;
      }
      const semitone = tones[voicePart];
      const spelledTones = getSpelledChordTones(chord.root, chord.quality);
      const spelledName = (spelledTones && spelledTones[voicePart]) || NOTES[semitone];
      const positions = getAllPositionsForSemitone(semitone, maxFret)
        .filter(p => p.fret >= displayStart && p.fret <= displayStart + displayFrets);
      chordPositionsMap[idx] = positions.map(p => ({
        ...p,
        noteName: spelledName,
      }));
    }

    // Draw dots for the sliding window
    for (const idx of chordsToShow) {
      const positions = chordPositionsMap[idx];
      if (!positions) continue;
      const isCurrent = idx === focusIdx;
      const dotOpacity = isCurrent ? 0.9 : 0.4;
      const textOpacity = isCurrent ? 1 : 0.6;

      // Detect common tones for current chord positions
      let commonToneSemitones = new Set();
      if (isCurrent && prevIdx >= 0 && prevIdx < state.chords.length) {
        const prevChord = state.chords[prevIdx];
        const prevTones = getChordTones(prevChord.root, prevChord.quality);
        if (prevTones) {
          for (const otherPart of state.voiceParts) {
            if (prevTones[otherPart] !== null && prevTones[otherPart] !== undefined) {
              commonToneSemitones.add(prevTones[otherPart]);
            }
          }
        }
      }

      for (const pos of positions) {
        const { x, y } = posToXY(pos, displayStart);
        const isCommon = isCurrent && commonToneSemitones.has(pos.midi % 12);
        if (isCommon) {
          // Outer glow halo for common tones
          svg += `<circle cx="${x}" cy="${y}" r="${DOT_R + 5}" fill="#FFF" opacity="0.25"/>`;
          svg += `<circle cx="${x}" cy="${y}" r="${DOT_R + 2}" fill="${color}" opacity="${dotOpacity}" stroke="#FFF" stroke-width="3"/>`;
        } else {
          svg += `<circle cx="${x}" cy="${y}" r="${DOT_R}" fill="${color}" opacity="${dotOpacity}"/>`;
        }
        // Single line: note name only, centered
        const r = isCommon ? DOT_R + 2 : DOT_R;
        svg += `<text x="${x}" y="${y + 4}" fill="#FFF" font-size="${isCommon ? '10' : '9'}" font-weight="600" text-anchor="middle" opacity="${textOpacity}">${pos.noteName}</text>`;
      }
    }
  }

  return svg;
}

/**
 * Get chord display name from root + quality.
 */
function chordDisplayName(root, quality) {
  const displayRoot = root.replace(/♯/g, '#').replace(/♭/g, 'b');
  if (quality === 'maj') return displayRoot;
  const displayQuality = quality.replace(/♯/g, '#').replace(/♭/g, 'b');
  return displayRoot + displayQuality;
}

/**
 * Update progression based on current preset/key selection.
 */
function updateProgression() {
  if (state.selectedPreset === 'custom') {
    if (!state.customInput.trim()) {
      state.chords = [];
      return [];
    }
    const result = parseProgression(state.customInput);
    // Apply transposition based on selected key (C = no transpose)
    const semitones = noteToSemitone(state.key);
    if (semitones > 0 && result.chords.length > 0) {
      state.chords = transposeProgression(result.chords, semitones);
    } else {
      state.chords = result.chords;
    }
    return result.errors;
  } else {
    const preset = PRESET_PROGRESSIONS[state.selectedPreset];
    if (preset) {
      const chordNames = preset.generate(state.key);
      state.chords = chordNames.map(name => {
        const parsed = parseChordName(name);
        return parsed ? { root: parsed.root, quality: parsed.quality } : null;
      }).filter(Boolean);
    }
    return [];
  }
}

/**
 * Build groups for the preset custom-select.
 */
function buildPresetGroups() {
  const options = Object.entries(PRESET_PROGRESSIONS).map(([id, p]) => ({
    value: id,
    label: p.label,
  }));
  options.push({ value: 'custom', label: 'Custom' });
  return [{ options }];
}

/**
 * Build groups for the key custom-select.
 */
function buildKeyGroups() {
  const options = NOTES.map(n => ({
    value: n,
    label: n.replace(/♯/g, '#').replace(/♭/g, 'b'),
  }));
  return [{ options }];
}

/**
 * Main render function for the entire module UI.
 */
function render() {
  const container = document.getElementById('mod-guideTone');
  if (!container) return;

  const errors = updateProgression();
  regenerateLines();

  // Clamp focusedChordIndex to valid range
  if (state.chords.length > 0) {
    if (state.focusedChordIndex >= state.chords.length) {
      state.focusedChordIndex = state.chords.length - 1;
    }
  } else {
    state.focusedChordIndex = 0;
  }

  // Build progression display
  const progressionDisplay = state.chords.map((c, i) => {
    const name = chordDisplayName(c.root, c.quality);
    const isFocused = i === state.focusedChordIndex;
    let cls = 'gt-chord-badge';
    if (isFocused) cls += ' gt-chord-focused';
    return `<span class="${cls}" data-chord-idx="${i}" style="cursor:pointer;">${name}</span>`;
  }).join(' ');

  container.innerHTML = `
    <div class="card">
      <h2>Guide Tone Line</h2>

      <div class="controls" id="gt-controls"></div>

      ${state.selectedPreset === 'custom' ? `
        <div class="gt-builder-panel">
          <div class="gt-builder-row">
            ${NOTES.map(n => {
              const display = n.replace(/♯/g, '#').replace(/♭/g, 'b');
              const isActive = n === state.builderRoot;
              return `<button class="gt-builder-root gt-builder-chip${isActive ? ' active' : ''}" data-root="${n}">${display}</button>`;
            }).join('')}
          </div>
          <div class="gt-builder-row">
            ${BUILDER_QUALITIES.map(q => {
              const isActive = q === state.builderQuality;
              return `<button class="gt-builder-quality gt-builder-chip${isActive ? ' active' : ''}" data-quality="${q}">${q}</button>`;
            }).join('')}
          </div>
          <div class="gt-builder-actions">
            <button id="gt-builder-add" class="gt-builder-btn gt-builder-btn-add">+ 添加</button>
            <button id="gt-builder-clear" class="gt-builder-btn gt-builder-btn-clear">清空</button>
            ${state.customInput.trim() ? `
              <div class="gt-builder-badges">
                ${state.customInput.trim().split(/\s+/).map((chord, i) => `
                  <span class="gt-builder-badge">
                    ${chord}
                    <span class="gt-builder-remove" data-idx="${i}">&times;</span>
                  </span>
                `).join('')}
              </div>
            ` : ''}
          </div>
          ${errors.length ? `<div style="color:#DC2626;font-size:0.8rem;margin-top:10px;">${errors.join(', ')}</div>` : ''}
          ${state.key !== 'C' ? `<div style="color:var(--text-muted);font-size:0.75rem;margin-top:6px;">已移调: +${noteToSemitone(state.key)} 半音</div>` : ''}
        </div>
      ` : ''}

      <div style="margin-bottom:14px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
        <span style="font-size:0.8rem;color:var(--text-muted);font-weight:500;">Voice:</span>
        ${['root', '3rd', '5th', '7th'].map(part => `
          <label style="display:inline-flex;align-items:center;gap:3px;font-size:0.8rem;cursor:pointer;">
            <input type="checkbox" class="gt-voice-cb" data-part="${part}" ${state.voiceParts.includes(part) ? 'checked' : ''}>
            <span style="color:${VOICE_PART_COLORS[part]};font-weight:600;">${part}</span>
          </label>
        `).join('')}
      </div>

      <div style="margin-bottom:12px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;">
        ${state.chords.length > 1 ? `
          <button id="gt-nav-prev" class="gt-nav-btn" ${state.focusedChordIndex <= 0 ? 'disabled' : ''} style="border:none;background:var(--clay-bg);border-radius:6px;padding:4px 10px;cursor:pointer;font-size:1rem;color:var(--text);opacity:${state.focusedChordIndex <= 0 ? '0.3' : '1'};">&larr;</button>
        ` : ''}
        ${progressionDisplay}
        ${state.chords.length > 1 ? `
          <button id="gt-nav-next" class="gt-nav-btn" ${state.focusedChordIndex >= state.chords.length - 1 ? 'disabled' : ''} style="border:none;background:var(--clay-bg);border-radius:6px;padding:4px 10px;cursor:pointer;font-size:1rem;color:var(--text);opacity:${state.focusedChordIndex >= state.chords.length - 1 ? '0.3' : '1'};">&rarr;</button>
        ` : ''}
      </div>

      <div class="fretboard" id="gt-fretboard" style="overflow-x:auto;margin-bottom:14px;"></div>
    </div>
  `;

  // Build controls bar with custom-select components
  const controlsBar = document.getElementById('gt-controls');
  if (controlsBar) {
    const presetSelect = createCustomSelect('gt-preset', buildPresetGroups(), state.selectedPreset);
    controlsBar.appendChild(presetSelect);

    const keySelect = createCustomSelect('gt-key', buildKeyGroups(), state.key);
    controlsBar.appendChild(keySelect);

    presetSelect.addEventListener('change', (e) => {
      state.selectedPreset = e.detail.value;
      state.focusedChordIndex = 0;
      render();
    });

    keySelect.addEventListener('change', (e) => {
      state.key = e.detail.value;
      state.focusedChordIndex = 0;
      render();
    });
  }

  // Render fretboard
  const fbContainer = document.getElementById('gt-fretboard');
  if (fbContainer) {
    renderFretboard(fbContainer);
  }

  // Bind remaining events
  bindEvents();
}

function bindEvents() {
  // Chord badge click to set focused chord index
  document.querySelectorAll('.gt-chord-badge[data-chord-idx]').forEach(badge => {
    badge.addEventListener('click', () => {
      const idx = parseInt(badge.dataset.chordIdx);
      if (isNaN(idx)) return;
      state.focusedChordIndex = idx;
      render();
    });
  });

  // Navigation arrows
  const navPrev = document.getElementById('gt-nav-prev');
  if (navPrev) {
    navPrev.addEventListener('click', () => {
      if (state.focusedChordIndex > 0) {
        state.focusedChordIndex--;
        render();
      }
    });
  }
  const navNext = document.getElementById('gt-nav-next');
  if (navNext) {
    navNext.addEventListener('click', () => {
      if (state.focusedChordIndex < state.chords.length - 1) {
        state.focusedChordIndex++;
        render();
      }
    });
  }

  // Voice part checkboxes
  document.querySelectorAll('.gt-voice-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      const parts = [];
      document.querySelectorAll('.gt-voice-cb:checked').forEach(checked => {
        parts.push(checked.dataset.part);
      });
      state.voiceParts = parts.length ? parts : ['3rd'];
      state.focusedChordIndex = 0;
      render();
    });
  });

  // Chord builder: root buttons
  document.querySelectorAll('.gt-builder-root').forEach(btn => {
    btn.addEventListener('click', () => {
      state.builderRoot = btn.dataset.root;
      render();
    });
  });

  // Chord builder: quality buttons
  document.querySelectorAll('.gt-builder-quality').forEach(btn => {
    btn.addEventListener('click', () => {
      state.builderQuality = btn.dataset.quality;
      render();
    });
  });

  // Chord builder: add button
  const builderAdd = document.getElementById('gt-builder-add');
  if (builderAdd) {
    builderAdd.addEventListener('click', () => {
      const root = state.builderRoot.replace(/♯/g, '#').replace(/♭/g, 'b');
      const quality = state.builderQuality;
      const chordName = quality === 'maj' ? root : root + quality;
      state.customInput = state.customInput.trim()
        ? state.customInput.trim() + ' ' + chordName
        : chordName;
      state.focusedChordIndex = 0;
      render();
    });
  }

  // Chord builder: clear button
  const builderClear = document.getElementById('gt-builder-clear');
  if (builderClear) {
    builderClear.addEventListener('click', () => {
      state.customInput = '';
      state.focusedChordIndex = 0;
      render();
    });
  }

  // Chord builder: remove individual chord badges
  document.querySelectorAll('.gt-builder-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx);
      if (isNaN(idx)) return;
      const parts = state.customInput.trim().split(/\s+/);
      parts.splice(idx, 1);
      state.customInput = parts.join(' ');
      state.focusedChordIndex = 0;
      render();
    });
  });
}

/**
 * Initialize the Guide Tone Training module.
 */
export function initGuideToneTraining() {
  render();
}
