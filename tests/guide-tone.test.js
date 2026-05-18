import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseChordName,
  getChordTones,
  generateGuideToneLine,
  getAllFretPositions,
  findMinimalMovement,
  classifyMovement,
  parseProgression,
  transposeProgression,
  midiToToneName,
  noteToSemitone,
  PRESET_PROGRESSIONS,
} from '../src/core/guide-tone.js';

// --- parseChordName ---

test('parseChordName parses basic major chord', () => {
  const result = parseChordName('C');
  assert.equal(result.root, 'C');
  assert.equal(result.quality, 'maj');
  assert.deepEqual(result.intervals, [0, 4, 7]);
});

test('parseChordName parses Dm7', () => {
  const result = parseChordName('Dm7');
  assert.equal(result.root, 'D');
  assert.equal(result.quality, 'm7');
  assert.deepEqual(result.intervals, [0, 3, 7, 10]);
});

test('parseChordName parses G7', () => {
  const result = parseChordName('G7');
  assert.equal(result.root, 'G');
  assert.equal(result.quality, '7');
  assert.deepEqual(result.intervals, [0, 4, 7, 10]);
});

test('parseChordName parses Cmaj7', () => {
  const result = parseChordName('Cmaj7');
  assert.equal(result.root, 'C');
  assert.equal(result.quality, 'maj7');
  assert.deepEqual(result.intervals, [0, 4, 7, 11]);
});

test('parseChordName parses F#m7b5 with ASCII sharp', () => {
  const result = parseChordName('F#m7b5');
  assert.equal(result.root, 'F♯');
  assert.deepEqual(result.intervals, [0, 3, 6, 10]);
});

test('parseChordName parses Bbmaj7 with ASCII flat', () => {
  const result = parseChordName('Bbmaj7');
  assert.equal(result.root, 'B♭');
  assert.equal(result.quality, 'maj7');
});

test('parseChordName parses Am7', () => {
  const result = parseChordName('Am7');
  assert.equal(result.root, 'A');
  assert.equal(result.quality, 'm7');
});

test('parseChordName parses dim7', () => {
  const result = parseChordName('Bdim7');
  assert.equal(result.root, 'B');
  assert.deepEqual(result.intervals, [0, 3, 6, 9]);
});

test('parseChordName parses aug', () => {
  const result = parseChordName('Caug');
  assert.equal(result.root, 'C');
  assert.deepEqual(result.intervals, [0, 4, 8]);
});

test('parseChordName parses sus4', () => {
  const result = parseChordName('Gsus4');
  assert.equal(result.root, 'G');
  assert.deepEqual(result.intervals, [0, 5, 7]);
});

test('parseChordName returns null for invalid input', () => {
  assert.equal(parseChordName(''), null);
  assert.equal(parseChordName('XYZ'), null);
  assert.equal(parseChordName(null), null);
});

test('parseChordName parses 7alt', () => {
  const result = parseChordName('C7alt');
  assert.equal(result.root, 'C');
  assert.ok(result.intervals.includes(4));  // major 3rd
  assert.ok(result.intervals.includes(10)); // b7
});

// --- noteToSemitone ---

test('noteToSemitone handles standard notes', () => {
  assert.equal(noteToSemitone('C'), 0);
  assert.equal(noteToSemitone('D'), 2);
  assert.equal(noteToSemitone('E'), 4);
  assert.equal(noteToSemitone('G'), 7);
  assert.equal(noteToSemitone('A'), 9);
  assert.equal(noteToSemitone('B'), 11);
});

test('noteToSemitone handles sharps and flats (Unicode)', () => {
  assert.equal(noteToSemitone('C♯'), 1);
  assert.equal(noteToSemitone('B♭'), 10);
  assert.equal(noteToSemitone('F♯'), 6);
});

test('noteToSemitone handles ASCII accidentals', () => {
  assert.equal(noteToSemitone('Db'), 1);
  assert.equal(noteToSemitone('Eb'), 3);
  assert.equal(noteToSemitone('Ab'), 8);
});

// --- getChordTones ---

test('getChordTones returns correct tones for Cmaj7', () => {
  const tones = getChordTones('C', 'maj7');
  assert.equal(tones.root, 0);   // C
  assert.equal(tones['3rd'], 4); // E
  assert.equal(tones['5th'], 7); // G
  assert.equal(tones['7th'], 11); // B
});

test('getChordTones returns correct tones for Dm7', () => {
  const tones = getChordTones('D', 'm7');
  assert.equal(tones.root, 2);    // D
  assert.equal(tones['3rd'], 5);  // F
  assert.equal(tones['5th'], 9);  // A
  assert.equal(tones['7th'], 0);  // C
});

test('getChordTones returns correct tones for G7', () => {
  const tones = getChordTones('G', '7');
  assert.equal(tones.root, 7);    // G
  assert.equal(tones['3rd'], 11); // B
  assert.equal(tones['5th'], 2);  // D
  assert.equal(tones['7th'], 5);  // F
});

test('getChordTones returns null 7th for triads', () => {
  const tones = getChordTones('C', 'maj');
  assert.equal(tones.root, 0);
  assert.equal(tones['3rd'], 4);
  assert.equal(tones['5th'], 7);
  assert.equal(tones['7th'], null);
});

test('getChordTones returns null for invalid input', () => {
  assert.equal(getChordTones('X', 'maj7'), null);
  assert.equal(getChordTones('C', 'invalidQuality'), null);
});

// --- getAllFretPositions ---

test('getAllFretPositions returns valid positions for middle C (MIDI 60)', () => {
  const positions = getAllFretPositions(60); // C4
  assert.ok(positions.length > 0);
  // Verify all positions produce the correct MIDI
  const TUNING = [40, 45, 50, 55, 59, 64];
  for (const pos of positions) {
    const openMidi = TUNING[6 - pos.string];
    assert.equal(openMidi + pos.fret, 60);
    assert.ok(pos.fret >= 0 && pos.fret <= 22);
    assert.ok(pos.string >= 1 && pos.string <= 6);
  }
});

test('getAllFretPositions returns multiple positions for common notes', () => {
  const positions = getAllFretPositions(64); // E4 (string 1 open)
  assert.ok(positions.length >= 2); // At least open string 1 and string 2 fret 5
  const hasOpen = positions.some(p => p.string === 1 && p.fret === 0);
  const hasFret5 = positions.some(p => p.string === 2 && p.fret === 5);
  assert.ok(hasOpen);
  assert.ok(hasFret5);
});

test('getAllFretPositions returns empty for out-of-range MIDI', () => {
  const positions = getAllFretPositions(20); // Way below guitar range
  assert.equal(positions.length, 0);
});

// --- findMinimalMovement ---

test('findMinimalMovement finds closest position to current', () => {
  const currentPos = { string: 2, fret: 3 }; // B3 string, fret 3 = D4 (MIDI 62)
  const targetSemitone = 0; // C
  const constraints = { startFret: 1, endFret: 5 };
  const result = findMinimalMovement(currentPos, targetSemitone, constraints);
  assert.ok(result);
  assert.equal(result.midi % 12, 0); // It should be a C
  assert.ok(result.fret >= 0 && result.fret <= 22);
});

test('findMinimalMovement returns position in constraint range when possible', () => {
  const constraints = { startFret: 3, endFret: 7 };
  const result = findMinimalMovement(null, 0, constraints); // C, no current position
  assert.ok(result);
  assert.ok(result.fret >= 3 && result.fret <= 7);
});

test('findMinimalMovement relaxes constraints when no position in range', () => {
  // E2 (MIDI 40) can only be played on string 6 fret 0
  const constraints = { startFret: 10, endFret: 12 };
  const result = findMinimalMovement(null, 4, constraints); // E
  assert.ok(result);
  assert.equal(result.midi % 12, 4);
});

// --- classifyMovement ---

test('classifyMovement classifies half steps correctly', () => {
  assert.equal(classifyMovement(60, 61), 'half-up');
  assert.equal(classifyMovement(60, 59), 'half-down');
});

test('classifyMovement classifies whole steps correctly', () => {
  assert.equal(classifyMovement(60, 62), 'whole-up');
  assert.equal(classifyMovement(60, 58), 'whole-down');
});

test('classifyMovement classifies hold correctly', () => {
  assert.equal(classifyMovement(60, 60), 'hold');
});

test('classifyMovement classifies start correctly', () => {
  assert.equal(classifyMovement(null, 60), 'start');
  assert.equal(classifyMovement(undefined, 60), 'start');
});

test('classifyMovement classifies larger intervals', () => {
  assert.equal(classifyMovement(60, 65), 'up');
  assert.equal(classifyMovement(60, 55), 'down');
});

// --- PRESET_PROGRESSIONS ---

test('ii-V-I-major generates correct chords in C', () => {
  const chords = PRESET_PROGRESSIONS['ii-V-I-major'].generate('C');
  assert.deepEqual(chords, ['Dm7', 'G7', 'Cmaj7']);
});

test('ii-V-I-major generates correct chords in F', () => {
  const chords = PRESET_PROGRESSIONS['ii-V-I-major'].generate('F');
  assert.deepEqual(chords, ['Gm7', 'C7', 'Fmaj7']);
});

test('ii-V-i-minor generates correct chords in A', () => {
  const chords = PRESET_PROGRESSIONS['ii-V-i-minor'].generate('A');
  assert.equal(chords.length, 3);
  assert.equal(chords[0], 'Bm7b5');
  assert.equal(chords[1], 'E7');
  assert.equal(chords[2], 'Am7');
});

test('I-vi-ii-V generates 4 chords', () => {
  const chords = PRESET_PROGRESSIONS['I-vi-ii-V'].generate('C');
  assert.equal(chords.length, 4);
  assert.deepEqual(chords, ['Cmaj7', 'Am7', 'Dm7', 'G7']);
});

test('blues generates 12 bars', () => {
  const chords = PRESET_PROGRESSIONS['blues'].generate('C');
  assert.equal(chords.length, 12);
  // All should be dom7
  for (const chord of chords) {
    assert.ok(chord.endsWith('7'));
  }
});

// --- generateGuideToneLine ---

test('generateGuideToneLine produces valid path for ii-V-I', () => {
  const chords = [
    { root: 'D', quality: 'm7' },
    { root: 'G', quality: '7' },
    { root: 'C', quality: 'maj7' },
  ];
  const lines = generateGuideToneLine(chords, ['3rd', '7th'], { startFret: 1, endFret: 5 });
  assert.equal(lines.length, 2); // Two voice parts

  // Each line should have 3 entries (one per chord)
  assert.equal(lines[0].length, 3);
  assert.equal(lines[1].length, 3);

  // First entry should be 'start'
  assert.equal(lines[0][0].movement, 'start');
  assert.equal(lines[1][0].movement, 'start');

  // Verify note correctness
  // Dm7 3rd = F (semitone 5)
  assert.equal(lines[0][0].midi % 12, 5);
  // Dm7 7th = C (semitone 0)
  assert.equal(lines[1][0].midi % 12, 0);

  // G7 3rd = B (semitone 11)
  assert.equal(lines[0][1].midi % 12, 11);
  // G7 7th = F (semitone 5)
  assert.equal(lines[1][1].midi % 12, 5);

  // Cmaj7 3rd = E (semitone 4)
  assert.equal(lines[0][2].midi % 12, 4);
  // Cmaj7 7th = B (semitone 11)
  assert.equal(lines[1][2].midi % 12, 11);
});

test('generateGuideToneLine returns empty array for empty input', () => {
  assert.deepEqual(generateGuideToneLine([], ['3rd'], { startFret: 1, endFret: 5 }), []);
  assert.deepEqual(generateGuideToneLine(null, ['3rd'], { startFret: 1, endFret: 5 }), []);
});

test('generateGuideToneLine handles single chord', () => {
  const chords = [{ root: 'C', quality: 'maj7' }];
  const lines = generateGuideToneLine(chords, ['3rd'], { startFret: 1, endFret: 5 });
  assert.equal(lines.length, 1);
  assert.equal(lines[0].length, 1);
  assert.equal(lines[0][0].movement, 'start');
  assert.equal(lines[0][0].midi % 12, 4); // E
});

// --- parseProgression ---

test('parseProgression handles space-separated chords', () => {
  const result = parseProgression('Dm7 G7 Cmaj7');
  assert.equal(result.chords.length, 3);
  assert.equal(result.errors.length, 0);
  assert.equal(result.chords[0].root, 'D');
  assert.equal(result.chords[0].quality, 'm7');
});

test('parseProgression handles comma-separated chords', () => {
  const result = parseProgression('Am7, D7, Gmaj7');
  assert.equal(result.chords.length, 3);
  assert.equal(result.errors.length, 0);
});

test('parseProgression handles pipe-separated chords', () => {
  const result = parseProgression('Dm7 | G7 | Cmaj7');
  assert.equal(result.chords.length, 3);
  assert.equal(result.errors.length, 0);
});

test('parseProgression reports errors for invalid chords', () => {
  const result = parseProgression('Dm7 XYZ Cmaj7');
  assert.equal(result.chords.length, 2);
  assert.equal(result.errors.length, 1);
  assert.ok(result.errors[0].includes('XYZ'));
});

test('parseProgression handles empty input', () => {
  const result = parseProgression('');
  assert.equal(result.chords.length, 0);
  assert.ok(result.errors.length > 0);
});

// --- transposeProgression ---

test('transposeProgression shifts up by 2 semitones', () => {
  const chords = [{ root: 'C', quality: 'maj7' }, { root: 'D', quality: 'm7' }];
  const transposed = transposeProgression(chords, 2);
  assert.equal(transposed[0].root, 'D');
  assert.equal(transposed[0].quality, 'maj7');
  assert.equal(transposed[1].root, 'E');
  assert.equal(transposed[1].quality, 'm7');
});

test('transposeProgression wraps around', () => {
  const chords = [{ root: 'B', quality: '7' }];
  const transposed = transposeProgression(chords, 1);
  assert.equal(transposed[0].root, 'C');
});

// --- midiToToneName ---

test('midiToToneName converts correctly', () => {
  assert.equal(midiToToneName(60), 'C4');
  assert.equal(midiToToneName(69), 'A4');
  assert.equal(midiToToneName(40), 'E2');
  assert.equal(midiToToneName(64), 'E4');
});
