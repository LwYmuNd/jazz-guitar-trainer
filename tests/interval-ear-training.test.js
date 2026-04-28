import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INTERVAL_DEFINITIONS,
  INTERVAL_OPTIONS,
  INTERVAL_TRAINING_TEMPLATES,
  getIntervalDefinition,
  buildIntervalPool,
  buildIntervalNotes,
  buildIntervalPlaybackEvents,
  buildOptions,
  createIntervalQuestion,
} from '../src/core/interval-ear-training.js';

test('getIntervalDefinition returns correct definition for M3', () => {
  const def = getIntervalDefinition('M3');
  assert.equal(def.semitones, 4);
  assert.equal(def.label, 'Major Third');
  assert.equal(def.jazzLabel, '3');
});

test('getIntervalDefinition returns null for unknown id', () => {
  assert.equal(getIntervalDefinition('unknown'), null);
});

test('INTERVAL_DEFINITIONS contains 12 intervals', () => {
  assert.equal(INTERVAL_DEFINITIONS.length, 12);
});

test('buildIntervalPool filters by config', () => {
  const pool = buildIntervalPool({ intervalIds: ['m3', 'M3', 'P5'] });
  assert.deepEqual(pool, ['m3', 'M3', 'P5']);
});

test('buildIntervalPool returns all intervals when config is empty', () => {
  const pool = buildIntervalPool({});
  assert.equal(pool.length, 12);
});

test('buildIntervalNotes calculates ascending M3 from C4', () => {
  const notes = buildIntervalNotes('C', 'M3', { baseOctave: 4, direction: 'ascending' });
  assert.equal(notes.rootMidi, 60);
  assert.equal(notes.targetMidi, 64);
  assert.equal(notes.rootNote, 'C');
  assert.equal(notes.targetNote, 'E');
});

test('buildIntervalNotes calculates descending M3 from C4', () => {
  const notes = buildIntervalNotes('C', 'M3', { baseOctave: 4, direction: 'descending' });
  assert.equal(notes.rootMidi, 60);
  assert.equal(notes.targetMidi, 56);
  assert.equal(notes.rootNote, 'C');
  assert.equal(notes.targetNote, 'A♭');
});

test('buildIntervalNotes clamps low target midi', () => {
  const notes = buildIntervalNotes('C', 'P8', { baseOctave: 3, direction: 'descending' });
  assert.ok(notes.targetMidi >= 48, 'target should be >= C3');
});

test('buildIntervalNotes clamps high target midi', () => {
  const notes = buildIntervalNotes('C', 'P8', { baseOctave: 6, direction: 'ascending' });
  assert.ok(notes.targetMidi <= 84, 'target should be <= C6');
});

test('buildIntervalPlaybackEvents generates melodic events', () => {
  const events = buildIntervalPlaybackEvents(['C4', 'E4'], 'melodic');
  assert.equal(events.length, 2);
  assert.equal(events[0].type, 'note');
  assert.deepEqual(events[0].notes, ['C4']);
  assert.equal(events[1].type, 'note');
  assert.deepEqual(events[1].notes, ['E4']);
});

test('buildIntervalPlaybackEvents generates harmonic events', () => {
  const events = buildIntervalPlaybackEvents(['C4', 'E4'], 'harmonic');
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'interval');
  assert.deepEqual(events[0].notes, ['C4', 'E4']);
});

test('buildOptions keeps pool order without external distractors', () => {
  const pool = ['m3', 'M3', 'P5', 'm7'];
  const { optionIds } = buildOptions('M3', pool, 4, 'basic', Math.random);
  assert.deepEqual(optionIds, pool);
});

test('createIntervalQuestion avoids consecutive repeats', () => {
  const config = { intervalIds: ['m3', 'M3'], questionType: 'melodic', direction: 'ascending' };
  const q1 = createIntervalQuestion({ config, rootMode: 'fixed', fixedRoot: 'C' });
  const q2 = createIntervalQuestion({ config, rootMode: 'fixed', fixedRoot: 'C', previousSignature: q1.signature });
  assert.notEqual(q1.signature, q2.signature);
});

test('INTERVAL_TRAINING_TEMPLATES contains 3 templates', () => {
  assert.equal(INTERVAL_TRAINING_TEMPLATES.length, 3);
  assert.ok(INTERVAL_TRAINING_TEMPLATES.find(t => t.id === 'basic-intervals'));
  assert.ok(INTERVAL_TRAINING_TEMPLATES.find(t => t.id === 'thirds-and-sevenths'));
  assert.ok(INTERVAL_TRAINING_TEMPLATES.find(t => t.id === 'jazz-core-intervals'));
});