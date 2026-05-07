import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BASE_CHORD_TYPES,
  VOICING_OPTIONS,
  buildChordNotes,
  buildChordPool,
  buildPlaybackEvents,
  createQuestion,
  formatRootLabel,
  getAvailableVoicingOptionIds,
  getChordDefinition,
  TENSION_OPTIONS,
  TRAINING_TEMPLATES,
} from '../src/core/chord-ear-training.js';

test('formatRootLabel uses jazz-friendly accidental symbols', () => {
  assert.equal(formatRootLabel('Bb'), 'B♭');
  assert.equal(formatRootLabel('F#'), 'F♯');
  assert.equal(formatRootLabel('C'), 'C');
});

test('tension options expose single-tension choices including none and alterations', () => {
  assert.deepEqual(
    TENSION_OPTIONS.map(option => option.id),
    ['none', 'b9', '9', '#9', '11', '#11', 'b13', '13'],
  );
});

test('base chord options include triads, sixths, and seventh families', () => {
  assert.deepEqual(
    BASE_CHORD_TYPES.map(option => option.id),
    [
      'major-triad',
      'minor-triad',
      'diminished-triad',
      'augmented-triad',
      'major-six',
      'minor-six',
      'major',
      'dominant',
      'minor',
      'half-diminished',
      'diminished',
    ],
  );
});

test('voicing options cover explicit closed-position inversion choices', () => {
  assert.deepEqual(
    VOICING_OPTIONS.map(option => option.id),
    ['close-root', 'close-first', 'close-second', 'close-third', 'close-random'],
  );
});

test('buildChordPool combines triads, sixth chords, and supported single tensions', () => {
  const pool = buildChordPool({
    baseChordIds: ['major-triad', 'major-six', 'minor-six'],
    tensionIds: ['none', '9', '#11'],
  });

  assert.deepEqual(pool, ['maj', 'add9', 'add#11', '6', '6/9', 'm6', 'm6/9']);
});

test('buildChordPool filters out unsupported tension combinations', () => {
  const pool = buildChordPool({
    baseChordIds: ['augmented-triad', 'diminished-triad', 'major'],
    tensionIds: ['none', '#11', 'b9'],
  });

  assert.deepEqual(pool, ['dim', 'aug', 'maj7', 'maj7#11']);
});

test('buildChordPool filters out chords that cannot support the selected inversion', () => {
  const pool = buildChordPool({
    baseChordIds: ['major-triad', 'minor-triad', 'dominant'],
    tensionIds: ['none'],
    voicingMode: 'close-random',
    randomVoicingIds: ['close-third'],
  });

  assert.deepEqual(pool, ['7']);
});

test('buildChordPool limits drop voicings to supported seventh-chord families', () => {
  const pool = buildChordPool({
    baseChordIds: ['major', 'dominant', 'minor', 'half-diminished', 'major-six'],
    tensionIds: ['none', '9'],
    voicingFamily: 'drop2',
  });

  assert.deepEqual(pool, ['maj7', '7', 'm7', 'm7b5']);
});

test('empty explicit selections stay empty instead of falling back to defaults', () => {
  assert.deepEqual(
    buildChordPool({
      baseChordIds: [],
      tensionIds: [],
    }),
    [],
  );

  assert.deepEqual(
    getAvailableVoicingOptionIds({
      baseChordIds: [],
      tensionIds: [],
    }),
    [],
  );
});

test('buildChordNotes returns expected label and notes for major sharp eleven', () => {
  const chord = buildChordNotes('Bb', 'maj7#11', 3);

  assert.equal(chord.label, 'B♭maj7♯11');
  assert.deepEqual(chord.noteLabels, ['B♭', 'D', 'F', 'A', 'E']);
  assert.deepEqual(chord.audioNotes, ['A#3', 'D4', 'F4', 'A4', 'E5']);
});

test('buildChordNotes returns expected label and notes for dominant flat nine', () => {
  const chord = buildChordNotes('C', '7b9', 3);

  assert.equal(chord.label, 'C7♭9');
  assert.deepEqual(chord.noteLabels, ['C', 'E', 'G', 'B♭', 'D♭']);
});

test('buildChordNotes can generate explicit first inversion voicings for triads', () => {
  const chord = buildChordNotes('C', 'maj', {
    baseOctave: 3,
    voicingMode: 'close-first',
  });

  assert.equal(chord.label, 'Cmaj');
  assert.equal(chord.inversion, 1);
  assert.equal(chord.voicingLabel, '一转位');
  assert.deepEqual(chord.noteLabels, ['E', 'G', 'C']);
  assert.deepEqual(chord.audioNotes, ['E3', 'G3', 'C4']);
});

test('buildChordNotes can generate explicit third inversion voicings for seventh chords', () => {
  const chord = buildChordNotes('C', '7', {
    baseOctave: 3,
    voicingMode: 'close-third',
  });

  assert.equal(chord.label, 'C7');
  assert.equal(chord.inversion, 3);
  assert.equal(chord.voicingLabel, '三转位');
  assert.deepEqual(chord.noteLabels, ['B♭', 'C', 'E', 'G']);
  assert.deepEqual(chord.audioNotes, ['A#3', 'C4', 'E4', 'G4']);
});

test('buildChordNotes can generate drop2 voicings for supported seventh chords', () => {
  const chord = buildChordNotes('C', 'maj7', {
    baseOctave: 3,
    voicingFamily: 'drop2',
    voicingMode: 'close-root',
  });

  assert.equal(chord.voicingFamily, 'drop2');
  assert.equal(chord.voicingFamilyLabel, 'Drop 2');
  assert.deepEqual(chord.noteLabels, ['G', 'C', 'E', 'B']);
  assert.deepEqual(chord.audioNotes, ['G2', 'C3', 'E3', 'B3']);
});

test('buildChordNotes can generate drop3 voicings for supported seventh chords', () => {
  const chord = buildChordNotes('C', '7', {
    baseOctave: 3,
    voicingFamily: 'drop3',
    voicingMode: 'close-root',
  });

  assert.equal(chord.voicingFamily, 'drop3');
  assert.equal(chord.voicingFamilyLabel, 'Drop 3');
  assert.deepEqual(chord.noteLabels, ['E', 'C', 'G', 'B♭']);
  assert.deepEqual(chord.audioNotes, ['E2', 'C3', 'G3', 'A#3']);
});

test('createQuestion uses selected chord pool as answer options', () => {
  const question = createQuestion({
    config: {
      baseChordIds: ['dominant'],
      tensionIds: ['none', 'b9', '9', '#9'],
      voicingMode: 'close-root',
    },
    rootMode: 'fixed',
    fixedRoot: 'D',
    randomFn: () => 0,
  });

  assert.equal(question.root, 'D');
  assert.equal(question.chordId, '7');
  assert.equal(question.voicingFamily, 'close');
  assert.equal(question.diagram.kind, 'dynamic');
  assert.equal(question.voicingLabel, '原位');
  assert.deepEqual(question.optionLabels, ['7', '7♭9', '9', '7♯9']);
  assert.equal(question.signature, 'D:7:0');
});

test('createQuestion also renders close voicings as dynamic fretboard metadata', () => {
  const question = createQuestion({
    config: {
      baseChordIds: ['major'],
      tensionIds: ['13'],
      voicingFamily: 'close',
      voicingMode: 'close-root',
    },
    rootMode: 'fixed',
    fixedRoot: 'C',
    randomFn: () => 0,
  });

  assert.equal(question.diagram.kind, 'dynamic');
  assert.equal(question.diagram.title, 'Cmaj13 · 封闭 · 原位');
  assert.ok(Array.isArray(question.diagrams));
  assert.equal(question.diagrams.length, 2);
  // 新格式：6弦数组，从低到高（index 0=6弦），-1表示静音
  assert.deepEqual(question.diagram.frets.length, 6);
  assert.equal(question.diagram.frets[0], -1); // 6弦静音
  assert.deepEqual(question.diagram.intervalLabels, [null, '1', '3', '5', '7', '13']);
});

test('createQuestion includes dynamic fretboard metadata for supported drop voicings', () => {
  const question = createQuestion({
    config: {
      baseChordIds: ['major'],
      tensionIds: ['none'],
      voicingFamily: 'drop2',
      voicingMode: 'close-first',
    },
    rootMode: 'fixed',
    fixedRoot: 'C',
    randomFn: () => 0,
  });

  assert.equal(question.voicingFamily, 'drop2');
  assert.equal(question.diagram.kind, 'dynamic');
  assert.equal(question.diagram.title, 'Cmaj7 · Drop 2 · 一转位');
  assert.equal(question.diagram.baseFret, 1);
  // 新格式：6弦数组，从低到高（index 0=6弦），-1表示静音
  // strings=[1,2,3,4]（0-based: 2弦,3弦,4弦,5弦）→ fullFrets[4]=1, [3]=0, [2]=2, [1]=2
  assert.deepEqual(question.diagram.frets, [-1, 2, 2, 0, 1, -1]);
  assert.deepEqual(question.diagram.intervalLabels, [null, '7', '3', '5', '1', null]);
  assert.equal(question.diagrams.length, 3);
});

test('createQuestion transposes dynamic fretboard metadata with the current root', () => {
  const question = createQuestion({
    config: {
      baseChordIds: ['dominant'],
      tensionIds: ['none'],
      voicingFamily: 'drop3',
      voicingMode: 'close-root',
    },
    rootMode: 'fixed',
    fixedRoot: 'D',
    randomFn: () => 0,
  });

  assert.equal(question.diagram.kind, 'dynamic');
  assert.equal(question.diagram.title, 'D7 · Drop 3 · 原位');
  // 新格式：6弦数组，从低到高（index 0=6弦），-1表示静音
  // strings=[2,3,4,5]（0-based: 3弦,4弦,5弦,6弦）→ fullFrets[3]=5, [2]=7, [1]=5, [0]=2
  assert.deepEqual(question.diagram.frets, [2, 5, 7, 5, -1, -1]);
});

test('createQuestion switches to root answers when only one chord is left and root is random', () => {
  const question = createQuestion({
    config: {
      baseChordIds: ['major-triad'],
      tensionIds: ['none'],
      voicingMode: 'close-root',
      randomRootIds: ['C', 'D', 'E'],
    },
    rootMode: 'random',
    fixedRoot: 'C',
    randomFn: () => 0,
  });

  assert.equal(question.answerMode, 'root');
  assert.equal(question.correctOptionId, 'C');
  assert.deepEqual(question.optionLabels, ['C', 'D', 'E']);
  assert.equal(question.promptLabel, '根音');
});

test('createQuestion switches to inversion answers when only one chord is left and inversion is random', () => {
  const question = createQuestion({
    config: {
      baseChordIds: ['major-triad'],
      tensionIds: ['none'],
      voicingMode: 'close-random',
      randomVoicingIds: ['close-first', 'close-second'],
    },
    rootMode: 'fixed',
    fixedRoot: 'C',
    randomFn: () => 0,
  });

  assert.equal(question.answerMode, 'inversion');
  assert.equal(question.correctOptionId, 'close-first');
  assert.deepEqual(question.optionLabels, ['一转位', '二转位']);
  assert.equal(question.promptLabel, '转位');
});

test('createQuestion keeps chord answers when multiple chord options remain even with random root challenge', () => {
  const question = createQuestion({
    config: {
      baseChordIds: ['major-triad', 'minor-triad'],
      tensionIds: ['none'],
      voicingMode: 'close-root',
      randomRootIds: ['C', 'D', 'E'],
    },
    rootMode: 'random',
    fixedRoot: 'C',
    randomFn: () => 0,
  });

  assert.equal(question.answerMode, 'chord');
  assert.equal(question.correctOptionId, 'maj');
  assert.deepEqual(question.optionLabels, ['maj', 'm']);
  assert.equal(question.promptLabel, '和弦');
});

test('buildPlaybackEvents supports chord, arpeggio, and both modes', () => {
  const notes = ['C4', 'E4', 'G4', 'B4'];

  assert.deepEqual(buildPlaybackEvents(notes, 'chord'), [
    { type: 'chord', notes, delay: 0, duration: 1.35 },
  ]);

  assert.deepEqual(buildPlaybackEvents(notes, 'arpeggio'), [
    { type: 'note', notes: ['C4'], delay: 0, duration: 0.42 },
    { type: 'note', notes: ['E4'], delay: 0.16, duration: 0.42 },
    { type: 'note', notes: ['G4'], delay: 0.32, duration: 0.42 },
    { type: 'note', notes: ['B4'], delay: 0.48, duration: 0.42 },
  ]);

  assert.deepEqual(buildPlaybackEvents(notes, 'both'), [
    { type: 'note', notes: ['C4'], delay: 0, duration: 0.42 },
    { type: 'note', notes: ['E4'], delay: 0.16, duration: 0.42 },
    { type: 'note', notes: ['G4'], delay: 0.32, duration: 0.42 },
    { type: 'note', notes: ['B4'], delay: 0.48, duration: 0.42 },
    { type: 'chord', notes, delay: 0.8, duration: 1.35 },
  ]);
});

test('training template exposes triads-and-sixths entry points alongside dominant tensions', () => {
  const coreTemplate = TRAINING_TEMPLATES.find(item => item.id === 'basic-core-chords');
  const template = TRAINING_TEMPLATES.find(item => item.id === 'dominant-tensions');

  assert.ok(coreTemplate);
  assert.deepEqual(
    coreTemplate.baseChordIds,
    ['major-triad', 'minor-triad', 'diminished-triad', 'augmented-triad', 'major-six', 'minor-six', 'major', 'dominant', 'minor'],
  );
  assert.deepEqual(coreTemplate.tensionIds, ['none']);
  assert.equal(coreTemplate.voicingMode, 'close-root');

  assert.ok(template);
  assert.deepEqual(template.baseChordIds, ['dominant']);
  assert.deepEqual(template.tensionIds, ['none', 'b9', '9', '#9', '#11', 'b13', '13']);
  assert.equal(template.playbackMode, 'chord');
  assert.equal(template.voicingMode, 'close-root');
});

test('getChordDefinition throws for unknown ids', () => {
  assert.throws(() => getChordDefinition('maj7b9#11'), /Unknown chord/i);
});
