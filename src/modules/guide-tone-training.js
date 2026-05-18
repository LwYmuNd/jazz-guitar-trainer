/**
 * Guide Tone Line Training - UI Module
 *
 * Provides a horizontal fretboard visualization with two modes:
 * - Observe: shows complete guide tone path with connecting lines
 * - Practice: step-by-step reveal with dimmed previous positions
 */

import { NOTES, GUITAR_TUNING } from '../core/music-theory.js';
import {
  parseChordName,
  parseProgression,
  transposeProgression,
  noteToSemitone,
  getChordTones,
  generateGuideToneLine,
  midiToToneName,
  getMovementLabel,
  getMovementColor,
  PRESET_PROGRESSIONS,
  VOICE_PART_COLORS,
} from '../core/guide-tone.js';
import { ensureStarted, playPlaybackEvents, playChord } from '../core/audio-engine.js';

// Fretboard dimensions
const FRETS = 15;
const STRINGS = 6;
const FRET_W = 56;
const STR_GAP = 32;
const START_X = 50;
const START_Y = 40;
const DOT_R = 12;

// State
let state = {
  mode: 'observe', // 'observe' | 'practice'
  chords: [],      // [{root, quality}]
  voiceParts: ['3rd', '7th'],
  startFret: 1,
  endFret: 5,
  fullFretboard: false,
  overlay: false,
  lines: [],       // generated guide tone lines
  // Practice mode state
  practiceStep: 0,
  revealed: false,
  // Audio
  audioMode: 'guideTone', // 'guideTone' | 'chordPlusGuideTone'
  // Progression input
  selectedPreset: 'ii-V-I-major',
  customInput: '',
  key: 'C',
};

function getConstraints() {
  if (state.fullFretboard) {
    return { startFret: 0, endFret: FRETS };
  }
  return { startFret: state.startFret, endFret: state.endFret };
}

function regenerateLines() {
  if (!state.chords.length) {
    state.lines = [];
    return;
  }
  state.lines = generateGuideToneLine(state.chords, state.voiceParts, getConstraints());
}

function getDisplayFrets() {
  if (state.fullFretboard) return FRETS;
  return state.endFret - state.startFret + 2; // +2 for some padding
}

function getDisplayStartFret() {
  if (state.fullFretboard) return 0;
  return Math.max(0, state.startFret - 1);
}

/**
 * Render the horizontal fretboard SVG with guide tone positions and connections.
 */
function renderFretboard(container) {
  const displayFrets = state.fullFretboard ? FRETS : Math.min(FRETS, state.endFret - state.startFret + 4);
  const displayStart = getDisplayStartFret();

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
    const openMidi = GUITAR_TUNING[STRINGS - 1 - s]; // s=0 is string 1 (highest)
    const openNote = NOTES[openMidi % 12];
    svg += `<text x="${START_X - 22}" y="${y + 4}" fill="#6B6560" font-size="11" text-anchor="middle">${openNote}</text>`;
  }

  // Draw guide tone positions and connections
  if (state.mode === 'observe') {
    svg += renderObserveMode(displayStart, displayFrets);
  } else {
    svg += renderPracticeMode(displayStart, displayFrets);
  }

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

function renderObserveMode(displayStart, displayFrets) {
  let svg = '';

  // For each voice part line
  for (let lineIdx = 0; lineIdx < state.lines.length; lineIdx++) {
    const line = state.lines[lineIdx];
    if (!line || !line.length) continue;

    // If not overlay mode and this isn't the first line, skip
    if (!state.overlay && lineIdx > 0) continue;

    const voicePart = state.voiceParts[lineIdx];
    const color = VOICE_PART_COLORS[voicePart] || '#7C3AED';

    // Draw connecting lines first (behind dots)
    for (let i = 1; i < line.length; i++) {
      const prev = line[i - 1];
      const curr = line[i];
      if (!prev || !curr) continue;

      const prevXY = posToXY(prev, displayStart);
      const currXY = posToXY(curr, displayStart);

      // Check if positions are within display range
      const prevRelFret = prev.fret - displayStart;
      const currRelFret = curr.fret - displayStart;
      if (prevRelFret < 0 || prevRelFret > displayFrets || currRelFret < 0 || currRelFret > displayFrets) continue;

      const movementColor = getMovementColor(curr.movement);

      // Draw line
      svg += `<line x1="${prevXY.x}" y1="${prevXY.y}" x2="${currXY.x}" y2="${currXY.y}" stroke="${movementColor}" stroke-width="2" stroke-dasharray="${curr.movement === 'hold' ? '4,3' : ''}" opacity="0.7"/>`;

      // Draw movement label at midpoint
      const midX = (prevXY.x + currXY.x) / 2;
      const midY = (prevXY.y + currXY.y) / 2 - 10;
      const label = getMovementLabel(curr.movement);
      if (label) {
        svg += `<text x="${midX}" y="${midY}" fill="${movementColor}" font-size="10" font-weight="600" text-anchor="middle">${label}</text>`;
      }
    }

    // Draw dots
    for (let i = 0; i < line.length; i++) {
      const entry = line[i];
      if (!entry) continue;

      const relFret = entry.fret - displayStart;
      if (relFret < 0 || relFret > displayFrets) continue;

      const { x, y } = posToXY(entry, displayStart);

      // Dot
      svg += `<circle cx="${x}" cy="${y}" r="${DOT_R}" fill="${color}" opacity="0.9"/>`;
      // Note name
      svg += `<text x="${x}" y="${y + 4}" fill="#FFF" font-size="9" font-weight="600" text-anchor="middle">${entry.noteName}</text>`;
      // Chord label below
      svg += `<text x="${x}" y="${y + DOT_R + 12}" fill="${color}" font-size="8" text-anchor="middle" opacity="0.8">${entry.voicePart}</text>`;
    }
  }

  return svg;
}

function renderPracticeMode(displayStart, displayFrets) {
  let svg = '';

  if (!state.lines.length || !state.lines[0]) return svg;

  // Use first voice part line for practice (or overlay if enabled)
  const linesToShow = state.overlay ? state.lines : [state.lines[0]];

  for (let lineIdx = 0; lineIdx < linesToShow.length; lineIdx++) {
    const line = linesToShow[lineIdx];
    if (!line) continue;

    const voicePart = state.voiceParts[lineIdx];
    const color = VOICE_PART_COLORS[voicePart] || '#7C3AED';

    // Show previous steps as dimmed
    for (let i = 0; i < state.practiceStep; i++) {
      const entry = line[i];
      if (!entry) continue;

      const relFret = entry.fret - displayStart;
      if (relFret < 0 || relFret > displayFrets) continue;

      const { x, y } = posToXY(entry, displayStart);

      svg += `<circle cx="${x}" cy="${y}" r="${DOT_R}" fill="${color}" opacity="0.3"/>`;
      svg += `<text x="${x}" y="${y + 4}" fill="#FFF" font-size="9" font-weight="600" text-anchor="middle" opacity="0.5">${entry.noteName}</text>`;

      // Draw connecting line to next
      if (i > 0) {
        const prevEntry = line[i - 1];
        if (prevEntry) {
          const prevRelFret = prevEntry.fret - displayStart;
          if (prevRelFret >= 0 && prevRelFret <= displayFrets) {
            const prevXY = posToXY(prevEntry, displayStart);
            svg += `<line x1="${prevXY.x}" y1="${prevXY.y}" x2="${x}" y2="${y}" stroke="${color}" stroke-width="1.5" opacity="0.25"/>`;
          }
        }
      }
    }

    // Show current step if revealed
    if (state.revealed && state.practiceStep < line.length) {
      const entry = line[state.practiceStep];
      if (entry) {
        const relFret = entry.fret - displayStart;
        if (relFret >= 0 && relFret <= displayFrets) {
          const { x, y } = posToXY(entry, displayStart);

          svg += `<circle cx="${x}" cy="${y}" r="${DOT_R + 2}" fill="${color}" opacity="1"/>`;
          svg += `<text x="${x}" y="${y + 4}" fill="#FFF" font-size="10" font-weight="700" text-anchor="middle">${entry.noteName}</text>`;
          svg += `<text x="${x}" y="${y + DOT_R + 14}" fill="${color}" font-size="9" text-anchor="middle" font-weight="600">${entry.voicePart}</text>`;

          // Show connection from previous
          if (state.practiceStep > 0) {
            const prevEntry = line[state.practiceStep - 1];
            if (prevEntry) {
              const prevRelFret = prevEntry.fret - displayStart;
              if (prevRelFret >= 0 && prevRelFret <= displayFrets) {
                const prevXY = posToXY(prevEntry, displayStart);
                const movementColor = getMovementColor(entry.movement);
                svg += `<line x1="${prevXY.x}" y1="${prevXY.y}" x2="${x}" y2="${y}" stroke="${movementColor}" stroke-width="2.5" opacity="0.8"/>`;
                const midX = (prevXY.x + x) / 2;
                const midY = (prevXY.y + y) / 2 - 10;
                const label = getMovementLabel(entry.movement);
                if (label) {
                  svg += `<text x="${midX}" y="${midY}" fill="${movementColor}" font-size="11" font-weight="700" text-anchor="middle">${label}</text>`;
                }
              }
            }
          }
        }
      }
    }
  }

  return svg;
}

/**
 * Build audio playback events for current state.
 */
async function playGuideTone() {
  await ensureStarted();

  if (state.mode === 'observe') {
    // Play all guide tones sequentially
    const events = [];
    const line = state.lines[0];
    if (!line) return;

    if (state.audioMode === 'guideTone') {
      // Pure guide tone line
      for (let i = 0; i < line.length; i++) {
        const entry = line[i];
        if (!entry) continue;
        events.push({
          notes: [midiToToneName(entry.midi)],
          duration: 0.8,
          delay: i * 1.0,
        });
      }
    } else {
      // Chord + guide tone
      for (let i = 0; i < line.length; i++) {
        const entry = line[i];
        if (!entry) continue;
        const chord = state.chords[i];
        const tones = getChordTones(chord.root, chord.quality);
        if (tones) {
          // Build chord notes
          const chordMidis = [];
          for (const part of ['root', '3rd', '5th', '7th']) {
            if (tones[part] !== null && tones[part] !== undefined) {
              // Use octave 3 for chord background
              chordMidis.push(tones[part] + 48);
            }
          }
          const chordNotes = chordMidis.map(m => midiToToneName(m));
          events.push({
            notes: chordNotes,
            duration: 0.8,
            delay: i * 1.0,
          });
          // Guide tone highlighted slightly after
          events.push({
            notes: [midiToToneName(entry.midi)],
            duration: 0.6,
            delay: i * 1.0 + 0.15,
          });
        }
      }
    }

    await playPlaybackEvents(events);
  } else {
    // Practice mode: play current step
    const line = state.lines[0];
    if (!line || state.practiceStep >= line.length) return;
    const entry = line[state.practiceStep];
    if (!entry) return;

    if (state.audioMode === 'guideTone') {
      await playPlaybackEvents([{
        notes: [midiToToneName(entry.midi)],
        duration: 1.0,
        delay: 0,
      }]);
    } else {
      const chord = state.chords[state.practiceStep];
      const tones = getChordTones(chord.root, chord.quality);
      if (tones) {
        const chordMidis = [];
        for (const part of ['root', '3rd', '5th', '7th']) {
          if (tones[part] !== null && tones[part] !== undefined) {
            chordMidis.push(tones[part] + 48);
          }
        }
        const chordNotes = chordMidis.map(m => midiToToneName(m));
        await playPlaybackEvents([
          { notes: chordNotes, duration: 1.0, delay: 0 },
          { notes: [midiToToneName(entry.midi)], duration: 0.8, delay: 0.15 },
        ]);
      }
    }
  }
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
 * Main render function for the entire module UI.
 */
function render() {
  const container = document.getElementById('mod-guideTone');
  if (!container) return;

  const errors = updateProgression();
  regenerateLines();

  // Current chord info for practice mode
  let currentChordLabel = '';
  if (state.mode === 'practice' && state.chords.length > 0 && state.practiceStep < state.chords.length) {
    const chord = state.chords[state.practiceStep];
    currentChordLabel = chordDisplayName(chord.root, chord.quality);
  }

  // Build progression display
  const progressionDisplay = state.chords.map((c, i) => {
    const name = chordDisplayName(c.root, c.quality);
    const isCurrent = state.mode === 'practice' && i === state.practiceStep;
    const isPast = state.mode === 'practice' && i < state.practiceStep;
    let cls = 'gt-chord-badge';
    if (isCurrent) cls += ' gt-chord-current';
    if (isPast) cls += ' gt-chord-past';
    return `<span class="${cls}">${name}</span>`;
  }).join(' ');

  container.innerHTML = `
    <div class="card">
      <h2>Guide Tone Line</h2>

      <div class="controls" style="flex-wrap:wrap;gap:10px;">
        <select id="gt-preset">
          ${Object.entries(PRESET_PROGRESSIONS).map(([id, p]) =>
            `<option value="${id}" ${state.selectedPreset === id ? 'selected' : ''}>${p.label}</option>`
          ).join('')}
          <option value="custom" ${state.selectedPreset === 'custom' ? 'selected' : ''}>Custom</option>
        </select>

        <select id="gt-key">
          ${NOTES.map(n => `<option value="${n}" ${state.key === n ? 'selected' : ''}>${n.replace(/♯/g, '#').replace(/♭/g, 'b')}</option>`).join('')}
        </select>

        <div class="degree-toggle" id="gt-mode-toggle">
          <button class="${state.mode === 'observe' ? 'active' : ''}" data-mode="observe">观察</button>
          <button class="${state.mode === 'practice' ? 'active' : ''}" data-mode="practice">练习</button>
        </div>
      </div>

      ${state.selectedPreset === 'custom' ? `
        <div style="margin-bottom:14px;">
          <input type="text" id="gt-custom-input" placeholder="输入和弦进行，如：Dm7 G7 Cmaj7" value="${state.customInput}" style="width:100%;max-width:400px;padding:8px 12px;border:2px solid var(--clay-border);border-radius:8px;font-size:0.85rem;font-family:var(--font-body);">
          ${errors.length ? `<div style="color:#DC2626;font-size:0.8rem;margin-top:4px;">${errors.join(', ')}</div>` : ''}
          ${state.key !== 'C' ? `<div style="color:var(--text-muted);font-size:0.75rem;margin-top:4px;">已移调: +${noteToSemitone(state.key)} 半音</div>` : ''}
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

        <span style="margin-left:12px;font-size:0.8rem;color:var(--text-muted);">|</span>

        <label style="display:inline-flex;align-items:center;gap:3px;font-size:0.8rem;cursor:pointer;">
          <input type="checkbox" id="gt-overlay" ${state.overlay ? 'checked' : ''}>
          <span>叠加显示</span>
        </label>

        <label style="display:inline-flex;align-items:center;gap:3px;font-size:0.8rem;cursor:pointer;margin-left:8px;">
          <input type="checkbox" id="gt-full-fb" ${state.fullFretboard ? 'checked' : ''}>
          <span>全指板</span>
        </label>
      </div>

      ${!state.fullFretboard ? `
        <div style="margin-bottom:14px;display:flex;align-items:center;gap:8px;">
          <span style="font-size:0.8rem;color:var(--text-muted);">把位:</span>
          <input type="number" id="gt-start-fret" min="0" max="19" value="${state.startFret}" style="width:50px;padding:4px 8px;border:2px solid var(--clay-border);border-radius:6px;font-size:0.85rem;">
          <span style="font-size:0.8rem;">~</span>
          <input type="number" id="gt-end-fret" min="1" max="22" value="${state.endFret}" style="width:50px;padding:4px 8px;border:2px solid var(--clay-border);border-radius:6px;font-size:0.85rem;">
        </div>
      ` : ''}

      <div style="margin-bottom:12px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;">
        ${progressionDisplay}
      </div>

      <div class="fretboard" id="gt-fretboard" style="overflow-x:auto;margin-bottom:14px;"></div>

      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
        ${state.mode === 'practice' ? `
          <button class="btn btn-primary" id="gt-reveal" ${state.revealed ? 'disabled' : ''}>
            ${state.revealed ? '已揭示' : '揭示'}
          </button>
          <button class="btn btn-secondary" id="gt-next" ${!state.revealed ? 'disabled' : ''}>
            下一步
          </button>
          <button class="btn btn-secondary" id="gt-reset-practice">
            重置
          </button>
        ` : ''}
        <button class="btn btn-secondary" id="gt-play">
          <span style="margin-right:4px;">&#9654;</span> 播放
        </button>
        <select id="gt-audio-mode" style="min-width:auto;padding:6px 10px;">
          <option value="guideTone" ${state.audioMode === 'guideTone' ? 'selected' : ''}>Guide Tone</option>
          <option value="chordPlusGuideTone" ${state.audioMode === 'chordPlusGuideTone' ? 'selected' : ''}>和弦 + Guide Tone</option>
        </select>
      </div>

      ${state.mode === 'practice' && currentChordLabel ? `
        <div style="margin-top:12px;font-size:1.1rem;font-weight:600;color:var(--text);">
          当前和弦: <span style="color:var(--primary);font-family:var(--font-mono);">${currentChordLabel}</span>
          <span style="font-size:0.8rem;color:var(--text-muted);margin-left:8px;">(${state.practiceStep + 1}/${state.chords.length})</span>
        </div>
      ` : ''}

      <div style="margin-top:12px;">
        <div style="display:flex;flex-wrap:wrap;gap:12px;font-size:0.75rem;color:var(--text-muted);">
          <span><span style="color:#2563EB;">&#9679;</span> 半音下行 ↓½</span>
          <span><span style="color:#DC2626;">&#9679;</span> 半音上行 ↑½</span>
          <span><span style="color:#7C3AED;">&#9679;</span> 全音下行 ↓1</span>
          <span><span style="color:#D97706;">&#9679;</span> 全音上行 ↑1</span>
          <span><span style="color:#059669;">&#9679;</span> 保持不动 →</span>
        </div>
      </div>
    </div>
  `;

  // Render fretboard
  const fbContainer = document.getElementById('gt-fretboard');
  if (fbContainer) {
    renderFretboard(fbContainer);
  }

  // Bind events
  bindEvents();
}

function bindEvents() {
  const presetSel = document.getElementById('gt-preset');
  if (presetSel) {
    presetSel.addEventListener('change', (e) => {
      state.selectedPreset = e.target.value;
      state.practiceStep = 0;
      state.revealed = false;
      render();
    });
  }

  const keySel = document.getElementById('gt-key');
  if (keySel) {
    keySel.addEventListener('change', (e) => {
      state.key = e.target.value;
      state.practiceStep = 0;
      state.revealed = false;
      render();
    });
  }

  const modeToggle = document.getElementById('gt-mode-toggle');
  if (modeToggle) {
    modeToggle.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-mode]');
      if (!btn) return;
      state.mode = btn.dataset.mode;
      state.practiceStep = 0;
      state.revealed = false;
      render();
    });
  }

  const customInput = document.getElementById('gt-custom-input');
  if (customInput) {
    customInput.addEventListener('input', (e) => {
      state.customInput = e.target.value;
      state.practiceStep = 0;
      state.revealed = false;
      render();
    });
  }

  // Voice part checkboxes
  document.querySelectorAll('.gt-voice-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      const parts = [];
      document.querySelectorAll('.gt-voice-cb:checked').forEach(checked => {
        parts.push(checked.dataset.part);
      });
      state.voiceParts = parts.length ? parts : ['3rd']; // At least one
      state.practiceStep = 0;
      state.revealed = false;
      render();
    });
  });

  const overlayCb = document.getElementById('gt-overlay');
  if (overlayCb) {
    overlayCb.addEventListener('change', (e) => {
      state.overlay = e.target.checked;
      render();
    });
  }

  const fullFbCb = document.getElementById('gt-full-fb');
  if (fullFbCb) {
    fullFbCb.addEventListener('change', (e) => {
      state.fullFretboard = e.target.checked;
      state.practiceStep = 0;
      state.revealed = false;
      render();
    });
  }

  const startFretInput = document.getElementById('gt-start-fret');
  if (startFretInput) {
    startFretInput.addEventListener('change', (e) => {
      const v = parseInt(e.target.value);
      if (!isNaN(v) && v >= 0 && v < state.endFret) {
        state.startFret = v;
        state.practiceStep = 0;
        state.revealed = false;
        render();
      }
    });
  }

  const endFretInput = document.getElementById('gt-end-fret');
  if (endFretInput) {
    endFretInput.addEventListener('change', (e) => {
      const v = parseInt(e.target.value);
      if (!isNaN(v) && v > state.startFret && v <= 22) {
        state.endFret = v;
        state.practiceStep = 0;
        state.revealed = false;
        render();
      }
    });
  }

  // Practice mode buttons
  const revealBtn = document.getElementById('gt-reveal');
  if (revealBtn) {
    revealBtn.addEventListener('click', () => {
      state.revealed = true;
      render();
      // Auto-play on reveal
      playGuideTone();
    });
  }

  const nextBtn = document.getElementById('gt-next');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (state.practiceStep < state.chords.length - 1) {
        state.practiceStep++;
        state.revealed = false;
        render();
      }
    });
  }

  const resetBtn = document.getElementById('gt-reset-practice');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state.practiceStep = 0;
      state.revealed = false;
      render();
    });
  }

  // Audio
  const playBtn = document.getElementById('gt-play');
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      playGuideTone();
    });
  }

  const audioModeSel = document.getElementById('gt-audio-mode');
  if (audioModeSel) {
    audioModeSel.addEventListener('change', (e) => {
      state.audioMode = e.target.value;
    });
  }
}

/**
 * Initialize the Guide Tone Training module.
 */
export function initGuideToneTraining() {
  render();
}
