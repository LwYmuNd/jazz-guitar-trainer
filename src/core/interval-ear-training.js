import { NOTES, NOTE_NAMES_FLAT } from './music-theory.js';

const SHARP_NAMES_ASCII = NOTES.map(n => n.replace('♯', '#'));
const CHROMATIC_ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const PLAYBACK_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function formatRootLabel(root) {
  return String(root).replace(/b/g, '♭').replace(/#/g, '♯');
}

function noteToSemitone(noteName) {
  const normalized = String(noteName).replace(/♭/g, 'b').replace(/♯/g, '#');
  let idx = NOTE_NAMES_FLAT.indexOf(normalized);
  if (idx >= 0) return idx;
  idx = SHARP_NAMES_ASCII.indexOf(normalized);
  if (idx >= 0) return idx;
  throw new Error(`Unknown note: ${noteName}`);
}

function semitoneToDisplayNote(semitone) {
  const n = ((semitone % 12) + 12) % 12;
  return formatRootLabel(NOTE_NAMES_FLAT[n]);
}

function midiToPlaybackName(midi) {
  const n = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${PLAYBACK_NOTE_NAMES[n]}${octave}`;
}

function pickFromList(items, randomFn) {
  return items[Math.floor(randomFn() * items.length)];
}

export const INTERVAL_DEFINITIONS = [
  {
    id: 'm2', semitones: 1, label: 'Minor Second', shortLabel: 'm2',
    jazzLabel: '♭9', category: 'tension',
    confusionIds: ['M2', 'm3'],
    description: 'Tense and unstable color, often heard as b9 tension.',
  },
  {
    id: 'M2', semitones: 2, label: 'Major Second', shortLabel: 'M2',
    jazzLabel: '9', category: 'tension',
    confusionIds: ['m2', 'm3', 'M3'],
    description: 'Open and bright color, common as 9th extension.',
  },
  {
    id: 'm3', semitones: 3, label: 'Minor Third', shortLabel: 'm3',
    jazzLabel: '♭3', category: 'guide',
    confusionIds: ['M3', 'M2', 'P4'],
    description: 'Core interval that defines minor quality.',
  },
  {
    id: 'M3', semitones: 4, label: 'Major Third', shortLabel: 'M3',
    jazzLabel: '3', category: 'guide',
    confusionIds: ['m3', 'P4', 'TT'],
    description: 'Core interval that defines major and dominant quality.',
  },
  {
    id: 'P4', semitones: 5, label: 'Perfect Fourth', shortLabel: 'P4',
    jazzLabel: '11', category: 'stable',
    confusionIds: ['M3', 'TT', 'P5'],
    description: 'Stable consonance, often used as sus4 or 11th color.',
  },
  {
    id: 'TT', semitones: 6, label: 'Tritone', shortLabel: 'TT',
    jazzLabel: '♯11', category: 'guide',
    confusionIds: ['P4', 'P5', 'M3'],
    description: 'Signature dominant tension and tritone-sub sound.',
  },
  {
    id: 'P5', semitones: 7, label: 'Perfect Fifth', shortLabel: 'P5',
    jazzLabel: '5', category: 'stable',
    confusionIds: ['P4', 'TT', 'm6'],
    description: 'One of the most stable consonances in harmony.',
  },
  {
    id: 'm6', semitones: 8, label: 'Minor Sixth', shortLabel: 'm6',
    jazzLabel: '♭13', category: 'tension',
    confusionIds: ['P5', 'M6', 'TT'],
    description: 'Dark color, often used as b13 tension.',
  },
  {
    id: 'M6', semitones: 9, label: 'Major Sixth', shortLabel: 'M6',
    jazzLabel: '13', category: 'tension',
    confusionIds: ['m6', 'm7', 'P5'],
    description: 'Bright and warm color, common as 13th extension.',
  },
  {
    id: 'm7', semitones: 10, label: 'Minor Seventh', shortLabel: 'm7',
    jazzLabel: '♭7', category: 'guide',
    confusionIds: ['M7', 'M6', 'P5'],
    description: 'Key color tone in dominant and minor seventh chords.',
  },
  {
    id: 'M7', semitones: 11, label: 'Major Seventh', shortLabel: 'M7',
    jazzLabel: '7', category: 'guide',
    confusionIds: ['m7', 'P8', 'M6'],
    description: 'Major-seventh color with unresolved tension.',
  },
  {
    id: 'P8', semitones: 12, label: 'Perfect Octave', shortLabel: 'P8',
    jazzLabel: '8', category: 'stable',
    confusionIds: ['M7', 'm7', 'P5'],
    description: 'Perfect consonance at the octave.',
  },
];

const INTERVAL_MAP = Object.fromEntries(
  INTERVAL_DEFINITIONS.map(d => [d.id, d]),
);

export const INTERVAL_OPTIONS = INTERVAL_DEFINITIONS.map(d => ({
  id: d.id,
  label: d.label,
  shortLabel: d.shortLabel,
}));

export const INTERVAL_TRAINING_TEMPLATES = [
  {
    id: 'basic-intervals',
    label: '基础音程',
    description: '从常见基础音程开始建立距离感。',
    intervalIds: ['m2', 'M2', 'm3', 'M3', 'P4', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'],
    questionType: 'melodic',
    direction: 'ascending',
    optionCount: 4,
    labelMode: 'basic',
  },
  {
    id: 'thirds-and-sevenths',
    label: '三度与七度',
    description: '聚焦决定和弦性质的关键音程。',
    intervalIds: ['m3', 'M3', 'm7', 'M7'],
    questionType: 'harmonic',
    direction: 'ascending',
    optionCount: 4,
    labelMode: 'basic',
  },
  {
    id: 'jazz-core-intervals',
    label: '爵士核心音程',
    description: '训练 3rd、7th、tritone 与常见 tension 色彩。',
    intervalIds: ['M2', 'm3', 'M3', 'TT', 'm7', 'M7', 'M6'],
    questionType: 'harmonic',
    direction: 'ascending',
    optionCount: 4,
    labelMode: 'basic',
  },
];

export const EAR_TRAINING_ROOTS = CHROMATIC_ROOTS.map(root => ({
  value: root,
  label: formatRootLabel(root),
}));

export function getIntervalDefinition(intervalId) {
  return INTERVAL_MAP[intervalId] ?? null;
}

export function buildIntervalPool(config = {}) {
  const ids = Array.isArray(config.intervalIds) && config.intervalIds.length
    ? config.intervalIds
    : INTERVAL_DEFINITIONS.map(d => d.id);
  return ids.filter(id => INTERVAL_MAP[id]);
}

function resolveDirection(direction, randomFn) {
  if (direction === 'random') {
    return randomFn() < 0.5 ? 'ascending' : 'descending';
  }
  return direction || 'ascending';
}

function getRootCandidates(rootMode, fixedRoot, randomRootIds) {
  if (rootMode !== 'random') return [fixedRoot];
  if (Array.isArray(randomRootIds) && randomRootIds.length) return randomRootIds;
  return CHROMATIC_ROOTS;
}

export function buildIntervalNotes(root, intervalId, options = {}) {
  const definition = getIntervalDefinition(intervalId);
  if (!definition) return null;
  const baseOctave = options.baseOctave ?? 4;
  const direction = options.direction ?? 'ascending';
  const rootSemitone = noteToSemitone(root);
  let rootMidi = (baseOctave + 1) * 12 + rootSemitone;
  let targetMidi = direction === 'descending'
    ? rootMidi - definition.semitones
    : rootMidi + definition.semitones;

  if (targetMidi < 48) { rootMidi += 12; targetMidi += 12; }
  if (targetMidi > 84) { rootMidi -= 12; targetMidi -= 12; }

  return {
    rootMidi,
    targetMidi,
    rootNote: semitoneToDisplayNote(rootMidi % 12),
    targetNote: semitoneToDisplayNote(targetMidi % 12),
    audioNotes: [midiToPlaybackName(rootMidi), midiToPlaybackName(targetMidi)],
  };
}

export function buildIntervalPlaybackEvents(audioNotes, questionType) {
  if (questionType === 'harmonic') {
    return [{ type: 'interval', notes: audioNotes, delay: 0, duration: 1.2 }];
  }
  return [
    { type: 'note', notes: [audioNotes[0]], delay: 0, duration: 0.6 },
    { type: 'note', notes: [audioNotes[1]], delay: 0.65, duration: 0.6 },
  ];
}

function getLabel(definition, labelMode) {
  return labelMode === 'jazz' ? definition.jazzLabel : definition.label;
}

export function buildOptions(correctId, pool, optionCount, labelMode, randomFn) {
  const orderedPool = Array.from(new Set(pool.filter(id => getIntervalDefinition(id))));
  const optionIds = orderedPool.length ? orderedPool : [correctId];

  const optionLabels = optionIds.map(id => {
    const d = getIntervalDefinition(id);
    return d ? getLabel(d, labelMode) : id;
  });

  const optionDefinitions = optionIds.map(id => {
    const d = getIntervalDefinition(id);
    return d ? { id: d.id, semitones: d.semitones, label: getLabel(d, labelMode) } : null;
  }).filter(Boolean);

  return { optionIds, optionLabels, optionDefinitions };
}

function getVariantCount(pool, rootMode, fixedRoot, config) {
  const roots = getRootCandidates(rootMode, fixedRoot, config.randomRootIds);
  const dir = config.direction ?? 'ascending';
  const dirCount = dir === 'random' ? 2 : 1;
  return pool.length * roots.length * dirCount;
}

export function createIntervalQuestion({
  config = {},
  rootMode = 'fixed',
  fixedRoot = 'C',
  previousSignature = null,
  randomFn = Math.random,
  baseOctave = 4,
}) {
  const pool = buildIntervalPool(config);
  const safePool = pool.length ? pool : buildIntervalPool();
  const questionType = config.questionType ?? 'melodic';
  const optionCount = config.optionCount ?? 4;
  const labelMode = config.labelMode ?? 'basic';
  const rootCandidates = getRootCandidates(rootMode, fixedRoot, config.randomRootIds);

  let attempts = 0;
  let root, intervalId, direction, signature, notes;

  do {
    root = rootMode === 'random'
      ? pickFromList(rootCandidates, randomFn)
      : fixedRoot;
    intervalId = pickFromList(safePool, randomFn);
    direction = resolveDirection(config.direction, randomFn);
    signature = `${questionType}:${root}:${intervalId}:${direction}`;
    attempts++;
  } while (
    signature === previousSignature &&
    attempts < 16 &&
    getVariantCount(safePool, rootMode, fixedRoot, config) > 1
  );

  notes = buildIntervalNotes(root, intervalId, { baseOctave, direction });
  const definition = getIntervalDefinition(intervalId);
  const { optionIds, optionLabels, optionDefinitions } = buildOptions(
    intervalId, safePool, optionCount, labelMode, randomFn,
  );

  return {
    intervalId,
    definition,
    root,
    rootLabel: formatRootLabel(root),
    targetNote: notes.targetNote,
    semitones: definition.semitones,
    direction,
    questionType,
    rootMidi: notes.rootMidi,
    targetMidi: notes.targetMidi,
    audioNotes: notes.audioNotes,
    correctOptionId: intervalId,
    optionIds,
    optionLabels,
    optionDefinitions,
    signature,
  };
}