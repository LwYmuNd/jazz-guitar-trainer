/**
 * Guide Tone Line - Core Logic
 *
 * Pure logic module for chord name parsing, chord tone calculation,
 * and voice leading path generation (minimal movement algorithm).
 * No DOM dependencies.
 */

import { NOTES, NOTE_NAMES_FLAT, GUITAR_TUNING } from './music-theory.js';

// Standard guitar tuning MIDI values: [E2, A2, D3, G3, B3, E4]
// String 6 (lowest) to String 1 (highest)
const TUNING = GUITAR_TUNING; // [40, 45, 50, 55, 59, 64]
const MAX_FRET = 22;

/**
 * Chord quality definitions: name -> intervals (semitones from root)
 * Each entry maps to [root, 3rd, 5th, 7th] (or fewer for triads/6ths)
 */
const CHORD_QUALITIES = {
  // Major family
  'maj7':    { intervals: [0, 4, 7, 11], tones: ['root', '3rd', '5th', '7th'] },
  'maj9':    { intervals: [0, 4, 7, 11, 14], tones: ['root', '3rd', '5th', '7th', '9th'] },
  'maj13':   { intervals: [0, 4, 7, 11, 14, 21], tones: ['root', '3rd', '5th', '7th', '9th', '13th'] },
  'maj6':    { intervals: [0, 4, 7, 9], tones: ['root', '3rd', '5th', '6th'] },
  '6/9':     { intervals: [0, 4, 7, 9, 14], tones: ['root', '3rd', '5th', '6th', '9th'] },
  'maj':     { intervals: [0, 4, 7], tones: ['root', '3rd', '5th'] },

  // Dominant family
  '7':       { intervals: [0, 4, 7, 10], tones: ['root', '3rd', '5th', '7th'] },
  '9':       { intervals: [0, 4, 7, 10, 14], tones: ['root', '3rd', '5th', '7th', '9th'] },
  '13':      { intervals: [0, 4, 7, 10, 14, 21], tones: ['root', '3rd', '5th', '7th', '9th', '13th'] },
  '7#9':     { intervals: [0, 4, 7, 10, 15], tones: ['root', '3rd', '5th', '7th', '♯9th'] },
  '7b9':     { intervals: [0, 4, 7, 10, 13], tones: ['root', '3rd', '5th', '7th', '♭9th'] },
  '7#11':    { intervals: [0, 4, 7, 10, 18], tones: ['root', '3rd', '5th', '7th', '♯11th'] },
  '7alt':    { intervals: [0, 4, 10, 13, 15, 18], tones: ['root', '3rd', '7th', '♭9th', '♯9th', '♯11th'] },
  'alt':     { intervals: [0, 4, 10, 13, 15, 18], tones: ['root', '3rd', '7th', '♭9th', '♯9th', '♯11th'] },

  // Minor family
  'm7':      { intervals: [0, 3, 7, 10], tones: ['root', '3rd', '5th', '7th'] },
  'm9':      { intervals: [0, 3, 7, 10, 14], tones: ['root', '3rd', '5th', '7th', '9th'] },
  'm11':     { intervals: [0, 3, 7, 10, 14, 17], tones: ['root', '3rd', '5th', '7th', '9th', '11th'] },
  'm6':      { intervals: [0, 3, 7, 9], tones: ['root', '3rd', '5th', '6th'] },
  'm':       { intervals: [0, 3, 7], tones: ['root', '3rd', '5th'] },
  'mMaj7':   { intervals: [0, 3, 7, 11], tones: ['root', '3rd', '5th', '7th'] },

  // Half-diminished / Diminished
  'm7b5':    { intervals: [0, 3, 6, 10], tones: ['root', '3rd', '5th', '7th'] },
  'dim7':    { intervals: [0, 3, 6, 9], tones: ['root', '3rd', '5th', '7th'] },
  'dim':     { intervals: [0, 3, 6], tones: ['root', '3rd', '5th'] },

  // Augmented
  'aug':     { intervals: [0, 4, 8], tones: ['root', '3rd', '5th'] },
  'aug7':    { intervals: [0, 4, 8, 10], tones: ['root', '3rd', '5th', '7th'] },

  // Sus
  'sus4':    { intervals: [0, 5, 7], tones: ['root', '4th', '5th'] },
  'sus2':    { intervals: [0, 2, 7], tones: ['root', '2nd', '5th'] },
  '7sus4':   { intervals: [0, 5, 7, 10], tones: ['root', '4th', '5th', '7th'] },
};

// Aliases for chord quality parsing
const QUALITY_ALIASES = {
  'major7': 'maj7', 'ma7': 'maj7', 'M7': 'maj7', 'Maj7': 'maj7',
  'major': 'maj', 'M': 'maj', 'Maj': 'maj',
  'major9': 'maj9', 'ma9': 'maj9', 'M9': 'maj9', 'Maj9': 'maj9',
  'major13': 'maj13', 'ma13': 'maj13', 'M13': 'maj13', 'Maj13': 'maj13',
  'major6': 'maj6', 'ma6': 'maj6', 'M6': 'maj6', 'Maj6': 'maj6', '6': 'maj6',
  'dom7': '7', 'dom': '7',
  'min7': 'm7', 'mi7': 'm7', '-7': 'm7',
  'min9': 'm9', 'mi9': 'm9', '-9': 'm9',
  'min11': 'm11', 'mi11': 'm11', '-11': 'm11',
  'min6': 'm6', 'mi6': 'm6', '-6': 'm6',
  'min': 'm', 'mi': 'm', '-': 'm', 'minor': 'm',
  'minMaj7': 'mMaj7', 'mM7': 'mMaj7', '-Maj7': 'mMaj7', '-M7': 'mMaj7',
  'half-dim': 'm7b5', 'hdim7': 'm7b5', 'o7': 'dim7',
  'diminished7': 'dim7', 'diminished': 'dim',
  'augmented': 'aug', '+': 'aug', 'aug7': 'aug7', '+7': 'aug7',
  '7sus': '7sus4', 'sus': 'sus4',
};

/**
 * Parse a chord name string into root and quality.
 * Handles both ASCII (# b) and Unicode (♯ ♭) accidentals.
 *
 * @param {string} str - e.g. "Dm7", "G7", "Cmaj7", "F#m7b5", "Bb7"
 * @returns {{root: string, quality: string, intervals: number[], tones: string[]} | null}
 */
export function parseChordName(str) {
  if (!str || typeof str !== 'string') return null;
  str = str.trim();
  if (!str) return null;

  // Extract root note (letter + optional accidental)
  const rootMatch = str.match(/^([A-G])(♯|♭|#|b)?/);
  if (!rootMatch) return null;

  let rootLetter = rootMatch[1];
  let rootAccidental = rootMatch[2] || '';

  // Normalize accidental to Unicode
  if (rootAccidental === '#') rootAccidental = '♯';
  if (rootAccidental === 'b') rootAccidental = '♭';

  const root = rootLetter + rootAccidental;

  // Verify root is valid
  const rootIndex = noteToSemitone(root);
  if (rootIndex < 0) return null;

  // Extract quality string (everything after root)
  let qualityStr = str.slice(rootMatch[0].length).trim();

  // Normalize common patterns in quality
  qualityStr = qualityStr.replace(/#/g, '♯').replace(/b(?=[0-9])/g, '♭');

  // Try to resolve quality
  let qualityDef = resolveQuality(qualityStr);
  if (!qualityDef) return null;

  return {
    root,
    quality: qualityStr || 'maj',
    intervals: qualityDef.intervals,
    tones: qualityDef.tones,
  };
}

/**
 * Resolve a quality string to its definition.
 */
function resolveQuality(qualityStr) {
  // Empty string = major triad
  if (!qualityStr) return CHORD_QUALITIES['maj'];

  // Direct match
  if (CHORD_QUALITIES[qualityStr]) return CHORD_QUALITIES[qualityStr];

  // Alias match
  if (QUALITY_ALIASES[qualityStr] && CHORD_QUALITIES[QUALITY_ALIASES[qualityStr]]) {
    return CHORD_QUALITIES[QUALITY_ALIASES[qualityStr]];
  }

  // Normalize Unicode back to ASCII for alias lookup
  const ascii = qualityStr.replace(/♯/g, '#').replace(/♭/g, 'b');
  if (CHORD_QUALITIES[ascii]) return CHORD_QUALITIES[ascii];
  if (QUALITY_ALIASES[ascii] && CHORD_QUALITIES[QUALITY_ALIASES[ascii]]) {
    return CHORD_QUALITIES[QUALITY_ALIASES[ascii]];
  }

  return null;
}

/**
 * Convert note name to semitone index (0-11).
 */
function noteToSemitone(name) {
  let idx = NOTES.indexOf(name);
  if (idx >= 0) return idx;
  idx = NOTE_NAMES_FLAT.indexOf(name);
  if (idx >= 0) return idx;
  // Try converting ♯/♭ variants
  const ascii = name.replace(/♯/g, '#').replace(/♭/g, 'b');
  idx = NOTE_NAMES_FLAT.indexOf(ascii);
  if (idx >= 0) return idx;
  // Manual resolution
  const letter = name.charAt(0);
  const acc = name.slice(1);
  const letterSemitones = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  if (!(letter in letterSemitones)) return -1;
  let semi = letterSemitones[letter];
  for (const ch of acc) {
    if (ch === '♯' || ch === '#') semi++;
    else if (ch === '♭' || ch === 'b') semi--;
  }
  return ((semi % 12) + 12) % 12;
}

export { noteToSemitone };

const LETTER_ORDER = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const SEMI_OF_LETTER = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/**
 * Spell a note name from a semitone value given a target letter.
 * Returns the letter with the correct accidental(s) to reach targetSemi.
 */
function spellNoteWithLetter(letter, targetSemi) {
  const natural = SEMI_OF_LETTER[letter];
  const diff = ((targetSemi - natural) + 12) % 12;
  if (diff === 0) return letter;
  if (diff === 1) return letter + '♯';
  if (diff === 11) return letter + '♭';
  if (diff === 2) return letter + '♯♯';
  if (diff === 10) return letter + '♭♭';
  // Fallback: use NOTES array
  return NOTES[targetSemi];
}

/**
 * Get the spelled name for a chord tone based on the chord root.
 * Uses jazz-standard tertian spelling: each chord tone occupies the next
 * letter in the scale-letter sequence from the root.
 *
 * @param {string} root - Root note name (e.g. "B♭", "F♯")
 * @param {number} intervalIndex - Scale-degree offset: root=0, 3rd=1, 5th=2, 7th=3, 9th=4, 11th=5, 13th=6
 * @param {number} targetSemitone - The actual semitone (0-11) of the chord tone
 * @returns {string} - Correctly spelled note name
 */
export function spellChordTone(root, intervalIndex, targetSemitone) {
  const rootLetter = root.charAt(0).toUpperCase();
  const rootLetterIdx = LETTER_ORDER.indexOf(rootLetter);
  if (rootLetterIdx < 0) return NOTES[targetSemitone];

  // Chord tones stack in thirds: root(0), 3rd(2 letters up), 5th(4), 7th(6), 9th(1+7=8→1), 11th(3+7=10→3), 13th(5+7=12→5)
  // intervalIndex maps: 0→root, 1→3rd(+2), 2→5th(+4), 3→7th(+6), 4→9th(+1), 5→11th(+3), 6→13th(+5)
  const letterOffsets = [0, 2, 4, 6, 1, 3, 5];
  const offset = letterOffsets[intervalIndex] !== undefined ? letterOffsets[intervalIndex] : 0;
  const targetLetterIdx = (rootLetterIdx + offset) % 7;
  const targetLetter = LETTER_ORDER[targetLetterIdx];

  return spellNoteWithLetter(targetLetter, targetSemitone);
}

/**
 * Map from tone label to intervalIndex for spellChordTone.
 */
const TONE_TO_INTERVAL_INDEX = {
  'root': 0,
  '2nd': 4, // same letter position as 9th
  '3rd': 1,
  '4th': 5, // same letter position as 11th
  '5th': 2,
  '6th': 6, // same letter position as 13th
  '7th': 3,
  '9th': 4,
  '♭9th': 4,
  '♯9th': 4,
  '11th': 5,
  '♯11th': 5,
  '♭13th': 6,
  '13th': 6,
};

/**
 * Get spelled chord tone names for a chord, keyed by voice part.
 * Returns a map using the same keys as getChordTones: { root, '3rd', '5th', '7th' }
 *
 * @param {string} root - Root note name
 * @param {string} quality - Chord quality string
 * @returns {Object<string, string>|null} - Map of voice part to spelled note name
 */
export function getSpelledChordTones(root, quality) {
  const rootSemi = noteToSemitone(root);
  if (rootSemi < 0) return null;

  const qualityDef = resolveQuality(quality);
  if (!qualityDef) return null;

  const result = { root: null, '3rd': null, '5th': null, '7th': null };

  for (let i = 0; i < qualityDef.tones.length; i++) {
    const tone = qualityDef.tones[i];
    const semitone = (rootSemi + qualityDef.intervals[i]) % 12;
    const intervalIdx = TONE_TO_INTERVAL_INDEX[tone];
    const spelled = intervalIdx !== undefined
      ? spellChordTone(root, intervalIdx, semitone)
      : NOTES[semitone];

    // Map to voice part keys (same logic as getChordTones)
    if (tone === 'root') {
      result.root = spelled;
    } else if (tone === '3rd' || tone === '4th' || tone === '2nd') {
      result['3rd'] = spelled;
    } else if (tone === '5th') {
      result['5th'] = spelled;
    } else if (tone === '7th' || tone === '6th') {
      result['7th'] = spelled;
    }
  }

  return result;
}

/**
 * Get chord tones as semitone offsets for the four primary voices.
 * Returns { root, '3rd', '5th', '7th' } with semitone values (0-11).
 * For triads without 7th, returns null for 7th.
 *
 * @param {string} root - Root note name (Unicode)
 * @param {string} quality - Quality string
 * @returns {object} - { root: number, '3rd': number|null, '5th': number|null, '7th': number|null }
 */
export function getChordTones(root, quality) {
  const rootSemi = noteToSemitone(root);
  if (rootSemi < 0) return null;

  const qualityDef = resolveQuality(quality);
  if (!qualityDef) return null;

  const intervals = qualityDef.intervals;
  const tones = qualityDef.tones;

  const result = { root: rootSemi, '3rd': null, '5th': null, '7th': null };

  for (let i = 0; i < tones.length; i++) {
    const tone = tones[i];
    const semitone = (rootSemi + intervals[i]) % 12;
    if (tone === 'root') {
      result.root = semitone;
    } else if (tone === '3rd' || tone === '4th' || tone === '2nd') {
      // For sus chords, treat 4th/2nd as the "3rd" voice
      result['3rd'] = semitone;
    } else if (tone === '5th') {
      result['5th'] = semitone;
    } else if (tone === '7th' || tone === '6th') {
      // Treat 6th as 7th voice for guide tone purposes
      result['7th'] = semitone;
    }
  }

  return result;
}

/**
 * Preset chord progressions as templates.
 * Each generates an array of chord name strings for a given key.
 */
export const PRESET_PROGRESSIONS = {
  'ii-V-I-major': {
    label: 'ii-V-I Major',
    generate: (key) => {
      const rootSemi = noteToSemitone(key);
      if (rootSemi < 0) return [];
      const ii = NOTES[(rootSemi + 2) % 12];
      const V = NOTES[(rootSemi + 7) % 12];
      const I = NOTES[rootSemi % 12];
      return [`${ii}m7`, `${V}7`, `${I}maj7`];
    }
  },
  'ii-V-i-minor': {
    label: 'ii-V-i Minor',
    generate: (key) => {
      const rootSemi = noteToSemitone(key);
      if (rootSemi < 0) return [];
      const ii = NOTES[(rootSemi + 2) % 12];
      const V = NOTES[(rootSemi + 7) % 12];
      const i = NOTES[rootSemi % 12];
      return [`${ii}m7b5`, `${V}7`, `${i}m7`];
    }
  },
  'I-vi-ii-V': {
    label: 'I-vi-ii-V',
    generate: (key) => {
      const rootSemi = noteToSemitone(key);
      if (rootSemi < 0) return [];
      const I = NOTES[rootSemi % 12];
      const vi = NOTES[(rootSemi + 9) % 12];
      const ii = NOTES[(rootSemi + 2) % 12];
      const V = NOTES[(rootSemi + 7) % 12];
      return [`${I}maj7`, `${vi}m7`, `${ii}m7`, `${V}7`];
    }
  },
  'blues': {
    label: '12-Bar Blues',
    generate: (key) => {
      const rootSemi = noteToSemitone(key);
      if (rootSemi < 0) return [];
      const I = NOTES[rootSemi % 12];
      const IV = NOTES[(rootSemi + 5) % 12];
      const V = NOTES[(rootSemi + 7) % 12];
      return [
        `${I}7`, `${I}7`, `${I}7`, `${I}7`,
        `${IV}7`, `${IV}7`, `${I}7`, `${I}7`,
        `${V}7`, `${IV}7`, `${I}7`, `${V}7`,
      ];
    }
  },
};

/**
 * Get all fret positions for a given semitone class (all octaves) within a fret range.
 *
 * @param {number} semitone - Pitch class 0-11
 * @param {number} [maxFret=22] - Maximum fret to consider
 * @returns {Array<{string: number, fret: number, midi: number}>}
 */
export function getAllPositionsForSemitone(semitone, maxFret = MAX_FRET) {
  const positions = [];
  for (let s = 0; s < 6; s++) {
    const openMidi = TUNING[s];
    for (let fret = 0; fret <= maxFret; fret++) {
      const midi = openMidi + fret;
      if (midi % 12 === semitone) {
        positions.push({ string: 6 - s, fret, midi });
      }
    }
  }
  return positions;
}

/**
 * Get all possible fret positions for a given MIDI note on the guitar.
 *
 * @param {number} midi - MIDI note number
 * @returns {Array<{string: number, fret: number}>} - string is 1-6 (1=highest), fret is 0-22
 */
export function getAllFretPositions(midi) {
  const positions = [];
  for (let s = 0; s < 6; s++) {
    // s=0 is string 6 (lowest, E2=40), s=5 is string 1 (highest, E4=64)
    const openMidi = TUNING[s];
    const fret = midi - openMidi;
    if (fret >= 0 && fret <= MAX_FRET) {
      // Convert to string number (1=highest to 6=lowest)
      positions.push({ string: 6 - s, fret });
    }
  }
  return positions;
}

/**
 * Find the closest fret position for a target MIDI note given a current position.
 * Minimizes fret distance while staying within constraints.
 *
 * @param {{string: number, fret: number} | null} currentPos - Current position (null for first note)
 * @param {number} targetSemitone - Target note as semitone (0-11)
 * @param {{startFret: number, endFret: number}} constraints - Fret range constraints
 * @returns {{string: number, fret: number, midi: number} | null}
 */
export function findMinimalMovement(currentPos, targetSemitone, constraints) {
  const { startFret, endFret } = constraints;

  // Get all possible MIDI values for this semitone within guitar range
  const candidates = [];
  for (let s = 0; s < 6; s++) {
    const openMidi = TUNING[s];
    // Find the fret for each octave of this semitone on this string
    for (let octave = 0; octave <= 4; octave++) {
      const midi = (Math.floor(openMidi / 12) + octave) * 12 + targetSemitone;
      const fret = midi - openMidi;
      if (fret >= startFret && fret <= endFret) {
        candidates.push({ string: 6 - s, fret, midi });
      }
    }
  }

  if (candidates.length === 0) {
    // Relax constraints: try full fretboard
    for (let s = 0; s < 6; s++) {
      const openMidi = TUNING[s];
      for (let octave = 0; octave <= 4; octave++) {
        const midi = (Math.floor(openMidi / 12) + octave) * 12 + targetSemitone;
        const fret = midi - openMidi;
        if (fret >= 0 && fret <= MAX_FRET) {
          candidates.push({ string: 6 - s, fret, midi });
        }
      }
    }
  }

  if (candidates.length === 0) return null;

  if (!currentPos) {
    // No current position: prefer middle of constraint range
    const midFret = (startFret + endFret) / 2;
    candidates.sort((a, b) => Math.abs(a.fret - midFret) - Math.abs(b.fret - midFret));
    return candidates[0];
  }

  // Find current MIDI to compare distances
  const currentMidi = TUNING[6 - currentPos.string] + currentPos.fret;

  // Sort by semitone distance (voice leading prefers minimal movement)
  candidates.sort((a, b) => {
    const distA = Math.abs(a.midi - currentMidi);
    const distB = Math.abs(b.midi - currentMidi);
    return distA - distB;
  });

  return candidates[0];
}

/**
 * Classify the movement between two MIDI values.
 *
 * @param {number|null} prevMidi - Previous MIDI value (null for first)
 * @param {number} currentMidi - Current MIDI value
 * @returns {string} - 'start'|'hold'|'half-up'|'half-down'|'whole-up'|'whole-down'|'up'|'down'
 */
export function classifyMovement(prevMidi, currentMidi) {
  if (prevMidi === null || prevMidi === undefined) return 'start';
  const diff = currentMidi - prevMidi;
  if (diff === 0) return 'hold';
  if (diff === 1) return 'half-up';
  if (diff === -1) return 'half-down';
  if (diff === 2) return 'whole-up';
  if (diff === -2) return 'whole-down';
  if (diff > 0) return 'up';
  return 'down';
}

/**
 * Generate a complete guide tone line for a chord progression.
 *
 * @param {Array<{root: string, quality: string}>} chords - Parsed chord array
 * @param {string[]} voiceParts - Which voices to track: ['3rd', '7th'], etc.
 * @param {{startFret: number, endFret: number}} constraints - Fret range
 * @returns {Array<Array<{chord: string, chordIndex: number, voicePart: string, noteName: string, midi: number, string: number, fret: number, movement: string}>>}
 *   Returns one array per voice part, each containing one entry per chord.
 */
export function generateGuideToneLine(chords, voiceParts, constraints) {
  if (!chords || !chords.length || !voiceParts || !voiceParts.length) return [];

  const defaultConstraints = constraints || { startFret: 1, endFret: 5 };
  const lines = [];

  for (const part of voiceParts) {
    const line = [];
    let prevPos = null;
    let prevMidi = null;

    for (let i = 0; i < chords.length; i++) {
      const chord = chords[i];
      const tones = getChordTones(chord.root, chord.quality);
      if (!tones) {
        line.push(null);
        continue;
      }

      const targetSemitone = tones[part];
      if (targetSemitone === null || targetSemitone === undefined) {
        line.push(null);
        continue;
      }

      const pos = findMinimalMovement(prevPos, targetSemitone, defaultConstraints);
      if (!pos) {
        line.push(null);
        continue;
      }

      const movement = classifyMovement(prevMidi, pos.midi);
      const noteName = NOTES[pos.midi % 12];

      line.push({
        chord: `${chord.root}${chord.quality === 'maj' ? '' : chord.quality}`,
        chordIndex: i,
        voicePart: part,
        noteName,
        midi: pos.midi,
        string: pos.string,
        fret: pos.fret,
        movement,
      });

      prevPos = pos;
      prevMidi = pos.midi;
    }

    lines.push(line);
  }

  return lines;
}

/**
 * Parse a chord progression text input into array of chord objects.
 * Supports space, comma, pipe separated chords.
 *
 * @param {string} text - e.g. "Dm7 G7 Cmaj7" or "Dm7, G7, Cmaj7" or "Dm7 | G7 | Cmaj7"
 * @returns {{chords: Array<{root: string, quality: string}>, errors: string[]}}
 */
export function parseProgression(text) {
  if (!text || typeof text !== 'string') return { chords: [], errors: ['Empty input'] };

  // Split by spaces, commas, pipes
  const tokens = text.split(/[\s,|]+/).filter(t => t.length > 0);
  const chords = [];
  const errors = [];

  for (const token of tokens) {
    const parsed = parseChordName(token);
    if (parsed) {
      chords.push({ root: parsed.root, quality: parsed.quality || 'maj' });
    } else {
      errors.push(`Cannot parse: "${token}"`);
    }
  }

  return { chords, errors };
}

/**
 * Transpose a chord progression by a number of semitones.
 *
 * @param {Array<{root: string, quality: string}>} chords
 * @param {number} semitones - Number of semitones to transpose (positive = up)
 * @returns {Array<{root: string, quality: string}>}
 */
export function transposeProgression(chords, semitones) {
  return chords.map(chord => {
    const rootSemi = noteToSemitone(chord.root);
    const newSemi = ((rootSemi + semitones) % 12 + 12) % 12;
    return { root: NOTES[newSemi], quality: chord.quality };
  });
}

/**
 * Convert MIDI note number to Tone.js-compatible note name (ASCII).
 * @param {number} midi
 * @returns {string} e.g. "C4", "Bb3", "F#2"
 */
export function midiToToneName(midi) {
  const note = NOTE_NAMES_FLAT[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}

/**
 * Get the movement label for display.
 * @param {string} movement
 * @returns {string}
 */
export function getMovementLabel(movement) {
  switch (movement) {
    case 'half-down': return '↓½';
    case 'half-up': return '↑½';
    case 'whole-down': return '↓1';
    case 'whole-up': return '↑1';
    case 'hold': return '→';
    case 'up': return '↑';
    case 'down': return '↓';
    case 'start': return '';
    default: return '';
  }
}

/**
 * Get color for a movement type.
 * @param {string} movement
 * @returns {string} CSS color
 */
export function getMovementColor(movement) {
  switch (movement) {
    case 'half-down': return '#2563EB'; // blue
    case 'half-up': return '#DC2626';   // red
    case 'whole-down': return '#7C3AED'; // purple
    case 'whole-up': return '#D97706';   // amber
    case 'hold': return '#059669';       // green
    case 'up': return '#D97706';
    case 'down': return '#2563EB';
    case 'start': return '#6B7280';
    default: return '#6B7280';
  }
}

// Voice part colors for multi-line overlay
export const VOICE_PART_COLORS = {
  'root': '#DC2626',   // red
  '3rd': '#7C3AED',    // purple
  '5th': '#059669',    // emerald green
  '7th': '#D97706',    // amber
};
