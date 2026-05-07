import { NOTES, NOTE_NAMES_FLAT } from './music-theory.js';
import { DROP2, DROP3, STRING_SETS, transposeVoicing } from './chord-voicings.js';

const SHARP_NAMES_ASCII = NOTES.map(note => note.replace('♯', '#'));
const CHROMATIC_ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const PLAYBACK_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BASE_ORDER = [
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
];
const TENSION_ORDER = ['none', 'b9', '9', '#9', '11', '#11', 'b13', '13'];

export const BASE_CHORD_TYPES = [
  {
    id: 'major-triad',
    label: 'Maj',
    shortLabel: 'maj',
    description: 'Major triad base chord.',
  },
  {
    id: 'minor-triad',
    label: 'm',
    shortLabel: 'm',
    description: 'Minor triad base chord.',
  },
  {
    id: 'diminished-triad',
    label: 'dim',
    shortLabel: 'dim',
    description: 'Diminished triad base chord.',
  },
  {
    id: 'augmented-triad',
    label: 'aug',
    shortLabel: 'aug',
    description: 'Augmented triad base chord.',
  },
  {
    id: 'major-six',
    label: '6',
    shortLabel: '6',
    description: 'Major-six base chord.',
  },
  {
    id: 'minor-six',
    label: 'm6',
    shortLabel: 'm6',
    description: 'Minor-six base chord.',
  },
  {
    id: 'major',
    label: 'Maj7',
    shortLabel: 'maj7',
    description: 'Major-seven base chord.',
  },
  {
    id: 'dominant',
    label: '7',
    shortLabel: '7',
    description: 'Dominant-seven base chord.',
  },
  {
    id: 'minor',
    label: 'm7',
    shortLabel: 'm7',
    description: 'Minor-seven base chord.',
  },
  {
    id: 'half-diminished',
    label: 'm7♭5',
    shortLabel: 'm7♭5',
    description: 'Half-diminished base chord.',
  },
  {
    id: 'diminished',
    label: 'dim7',
    shortLabel: 'dim7',
    description: 'Fully diminished base chord.',
  },
];

export const TENSION_OPTIONS = [
  { id: 'none', label: 'None', description: 'Base chord only.' },
  { id: 'b9', label: '♭9', description: 'Flat ninth tension.' },
  { id: '9', label: '9', description: 'Natural ninth tension.' },
  { id: '#9', label: '♯9', description: 'Sharp ninth tension.' },
  { id: '11', label: '11', description: 'Natural eleventh tension.' },
  { id: '#11', label: '♯11', description: 'Sharp eleventh tension.' },
  { id: 'b13', label: '♭13', description: 'Flat thirteenth tension.' },
  { id: '13', label: '13', description: 'Natural thirteenth tension.' },
];

export const VOICING_OPTIONS = [
  {
    id: 'close-root',
    label: '原位',
    description: 'Closed position with the root in the bass.',
  },
  {
    id: 'close-first',
    label: '一转位',
    description: 'Closed position with the first inversion in the bass.',
  },
  {
    id: 'close-second',
    label: '二转位',
    description: 'Closed position with the second inversion in the bass.',
  },
  {
    id: 'close-third',
    label: '三转位',
    description: 'Closed position with the third inversion in the bass.',
  },
  {
    id: 'close-random',
    label: '随机转位',
    description: 'Closed position with the inversion chosen randomly each time.',
  },
];

export const VOICING_FAMILY_OPTIONS = [
  {
    id: 'close',
    label: '封闭',
    description: 'Closed-position voicings and inversions.',
  },
  {
    id: 'drop2',
    label: 'Drop 2',
    description: 'Four-note drop-2 voicings for core seventh-chord families.',
  },
  {
    id: 'drop3',
    label: 'Drop 3',
    description: 'Four-note drop-3 voicings for core seventh-chord families.',
  },
];

const SPECIFIC_VOICING_OPTION_IDS = ['close-root', 'close-first', 'close-second', 'close-third'];
const VOICING_ID_TO_INVERSION = {
  'close-root': 0,
  'close-first': 1,
  'close-second': 2,
  'close-third': 3,
};
const DROP_VOICING_FAMILY_IDS = ['drop2', 'drop3'];
const DROP_VOICING_SUPPORTED_FAMILIES = ['major', 'dominant', 'minor', 'half-diminished'];
const VOICING_FAMILY_LABELS = Object.fromEntries(
  VOICING_FAMILY_OPTIONS.map(option => [option.id, option.label]),
);
const REFERENCE_DIAGRAMS = {
  close: {
    '6': 'maj6.png',
    '6/9': 'maj69.png',
    m6: 'min6.png',
    maj7: 'maj7.png',
    maj9: 'maj9.png',
    'maj7#11': 'maj7s11.png',
    maj13: 'maj13.png',
    '7': 'dom7.png',
    '9': 'dom9.png',
    '13': 'dom13.png',
    '7b9': 'dom7b9.png',
    '7#9': 'dom7s9.png',
    '7#11': 'dom7s11.png',
    '7b13': 'dom7b13.png',
    m7: 'min7.png',
    'm7b5': 'min7b5.png',
    dim7: 'dim7.png',
  },
  drop2: {
    maj7: 'drop2-maj7.png',
    '7': 'drop2-dom7.png',
    m7: 'drop2-min7.png',
    'm7b5': 'drop2-min7b5.png',
  },
  drop3: {
    maj7: 'drop3-maj7.png',
    '7': 'drop3-dom7.png',
    m7: 'drop3-min7.png',
    'm7b5': 'drop3-min7b5.png',
  },
};
const VOICING_QUALITY_MAP = {
  maj7: 'Maj7',
  '7': 'Dom7',
  m7: 'Min7',
  m7b5: 'Min7b5',
};
const GUITAR_TUNING_HIGH_TO_LOW = [64, 59, 55, 50, 45, 40];

const FAMILY_CONFIG = {
  'major-triad': {
    baseId: 'maj',
    shellIntervals: [0, 4, 7],
    supportedTensions: ['none', '9', '#11'],
    descriptions: {
      none: 'The plain major triad, clean and direct.',
      '9': 'Major triad color with an added ninth on top.',
      '#11': 'Major triad color with a brighter added sharp-eleven.',
    },
  },
  'minor-triad': {
    baseId: 'm',
    shellIntervals: [0, 3, 7],
    supportedTensions: ['none', '9', '11'],
    descriptions: {
      none: 'The plain minor triad before any upper color is added.',
      '9': 'Minor triad color with an added ninth.',
      '11': 'Minor triad color with an added eleventh.',
    },
  },
  'diminished-triad': {
    baseId: 'dim',
    shellIntervals: [0, 3, 6],
    supportedTensions: ['none'],
    descriptions: {
      none: 'Compact diminished triad color.',
    },
  },
  'augmented-triad': {
    baseId: 'aug',
    shellIntervals: [0, 4, 8],
    supportedTensions: ['none'],
    descriptions: {
      none: 'Bright augmented triad color with a raised fifth.',
    },
  },
  'major-six': {
    baseId: '6',
    shellIntervals: [0, 4, 7, 9],
    supportedTensions: ['none', '9'],
    descriptions: {
      none: 'A major triad opened up by the sixth.',
      '9': 'The classic 6/9 color without adding a seventh.',
    },
  },
  'minor-six': {
    baseId: 'm6',
    shellIntervals: [0, 3, 7, 9],
    supportedTensions: ['none', '9'],
    descriptions: {
      none: 'Minor color with the sixth added on top.',
      '9': 'Minor-six color widened into a m6/9 sonority.',
    },
  },
  major: {
    baseId: 'maj7',
    shellIntervals: [0, 4, 7, 11],
    supportedTensions: ['none', '9', '#11', '13'],
    descriptions: {
      none: 'The smooth, settled major-seven color common in jazz harmony.',
      '9': 'Major-seven color with a lifted ninth on top.',
      '#11': 'Lydian-flavored major color with the sharp eleventh as the key tension.',
      '13': 'A wider major color that keeps the major-seven core but reaches for 13.',
    },
  },
  dominant: {
    baseId: '7',
    shellIntervals: [0, 4, 7, 10],
    supportedTensions: ['none', 'b9', '9', '#9', '11', '#11', 'b13', '13'],
    descriptions: {
      none: 'The dominant-seven sound: active, bluesy, and ready to resolve.',
      b9: 'Dominant color sharpened by the strong pull of a flat ninth.',
      '9': 'Dominant tension with the ninth added above the shell.',
      '#9': 'Dominant color with the altered sharp-nine bite.',
      '11': 'Dominant color widened by the eleventh.',
      '#11': 'A brighter dominant extension with the sharp eleventh color.',
      b13: 'Dominant color with the darker altered flat-thirteen pull.',
      '13': 'Dominant color with the bright pull of 13 on top.',
    },
  },
  minor: {
    baseId: 'm7',
    shellIntervals: [0, 3, 7, 10],
    supportedTensions: ['none', '9', '11', '13'],
    descriptions: {
      none: 'The base minor-seven shell before adding upper extensions.',
      '9': 'Minor-seven color with a 9 on top, adding lift without losing softness.',
      '11': 'A modal extension color that leans toward quartal space and open minor color.',
      '13': 'Minor-seven color with the 13 extension opening the top of the chord.',
    },
  },
  'half-diminished': {
    baseId: 'm7b5',
    shellIntervals: [0, 3, 6, 10],
    supportedTensions: ['none'],
    descriptions: {
      none: 'Half-diminished color with a softer edge than a fully diminished chord.',
    },
  },
  diminished: {
    baseId: 'dim7',
    shellIntervals: [0, 3, 6, 9],
    supportedTensions: ['none'],
    descriptions: {
      none: 'Fully diminished symmetry with maximum pull and instability.',
    },
  },
};

const TENSION_INTERVALS = {
  b9: 13,
  '9': 14,
  '#9': 15,
  '11': 17,
  '#11': 18,
  b13: 20,
  '13': 21,
};

export const TRAINING_TEMPLATES = [
  {
    id: 'basic-core-chords',
    label: 'Basic Core Chords',
    description: 'Start from triads, sixth chords, and core seventh colors.',
    baseChordIds: [
      'major-triad',
      'minor-triad',
      'diminished-triad',
      'augmented-triad',
      'major-six',
      'minor-six',
      'major',
      'dominant',
      'minor',
    ],
    tensionIds: ['none'],
    playbackMode: 'chord',
    voicingMode: 'close-root',
  },
  {
    id: 'basic-sevenths',
    label: 'Basic Seventh Chords',
    description: 'Focus on core seventh-chord colors only.',
    baseChordIds: ['major', 'dominant', 'minor', 'half-diminished', 'diminished'],
    tensionIds: ['none'],
    playbackMode: 'chord',
    voicingMode: 'close-root',
  },
  {
    id: 'triads-and-sixths',
    label: 'Triads and Sixths',
    description: 'Drill plain triads, six chords, and a small set of common add colors.',
    baseChordIds: ['major-triad', 'minor-triad', 'diminished-triad', 'augmented-triad', 'major-six', 'minor-six'],
    tensionIds: ['none', '9', '#11', '11'],
    playbackMode: 'chord',
    voicingMode: 'close-root',
  },
  {
    id: 'minor-tensions',
    label: 'Minor Tensions',
    description: 'Train minor base with one selected tension at a time.',
    baseChordIds: ['minor'],
    tensionIds: ['none', '9', '11', '13'],
    playbackMode: 'chord',
    voicingMode: 'close-root',
  },
  {
    id: 'dorian-minor-tensions',
    label: 'Dorian Minor Tensions',
    description: 'Focus on Dorian-friendly minor tensions, especially 9, 11, and 13.',
    baseChordIds: ['minor'],
    tensionIds: ['none', '9', '11', '13'],
    playbackMode: 'chord',
    voicingMode: 'close-root',
  },
  {
    id: 'dominant-tensions',
    label: 'Dominant Tensions',
    description: 'Compare dominant base with altered and natural single tensions.',
    baseChordIds: ['dominant'],
    tensionIds: ['none', 'b9', '9', '#9', '#11', 'b13', '13'],
    playbackMode: 'chord',
    voicingMode: 'close-root',
  },
];

export const EAR_TRAINING_ROOTS = CHROMATIC_ROOTS.map(root => ({
  value: root,
  label: formatRootLabel(root),
}));

function pickFromList(items, randomFn){
  const index = Math.floor(randomFn() * items.length);
  return items[Math.min(index, items.length - 1)];
}

function noteToSemitone(noteName){
  const normalized = String(noteName).replace(/♭/g, 'b').replace(/♯/g, '#');
  let index = NOTE_NAMES_FLAT.indexOf(normalized);
  if(index >= 0) return index;
  index = SHARP_NAMES_ASCII.indexOf(normalized);
  if(index >= 0) return index;
  throw new Error(`Unknown note: ${noteName}`);
}

function semitoneToDisplayNote(semitone){
  const normalized = ((semitone % 12) + 12) % 12;
  return formatRootLabel(NOTE_NAMES_FLAT[normalized]);
}

function midiToPlaybackNoteName(midi){
  const normalized = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${PLAYBACK_NOTE_NAMES[normalized]}${octave}`;
}

function buildDescription(familyId, tensionId){
  return FAMILY_CONFIG[familyId].descriptions[tensionId];
}

function buildChordId(familyId, tensionId){
  const family = FAMILY_CONFIG[familyId];
  if(tensionId === 'none'){
    return family.baseId;
  }

  if(familyId === 'major-triad'){
    if(tensionId === '9') return 'add9';
    if(tensionId === '#11') return 'add#11';
  }

  if(familyId === 'minor-triad'){
    if(tensionId === '9') return 'm(add9)';
    if(tensionId === '11') return 'm(add11)';
  }

  if(familyId === 'major-six'){
    if(tensionId === '9') return '6/9';
  }

  if(familyId === 'minor-six'){
    if(tensionId === '9') return 'm6/9';
  }

  if(familyId === 'major'){
    if(tensionId === '9') return 'maj9';
    if(tensionId === '#11') return 'maj7#11';
    if(tensionId === '13') return 'maj13';
  }

  if(familyId === 'dominant'){
    if(tensionId === '9') return '9';
    if(tensionId === '11') return '11';
    if(tensionId === '13') return '13';
    return `7${tensionId}`;
  }

  if(familyId === 'minor'){
    if(tensionId === '9') return 'm9';
    if(tensionId === '11') return 'm11';
    if(tensionId === '13') return 'm13';
  }

  return family.baseId;
}

function buildSymbol(familyId, tensionId){
  return buildChordId(familyId, tensionId)
    .replace(/b/g, '♭')
    .replace(/#/g, '♯');
}

function buildDefinition(familyId, tensionId){
  const family = FAMILY_CONFIG[familyId];
  const tensionIntervals = tensionId === 'none' ? [] : [TENSION_INTERVALS[tensionId]];

  return {
    id: buildChordId(familyId, tensionId),
    familyId,
    tensionId,
    shortLabel: buildSymbol(familyId, tensionId),
    answerLabel: buildSymbol(familyId, tensionId),
    symbol: buildSymbol(familyId, tensionId),
    intervals: [...family.shellIntervals, ...tensionIntervals],
    tensions: tensionId === 'none' ? [] : [tensionId.replace(/b/g, '♭').replace(/#/g, '♯')],
    description: buildDescription(familyId, tensionId),
  };
}

function formatIntervalLabel(interval){
  const normalized = ((interval % 12) + 12) % 12;

  if(interval === 13) return '♭9';
  if(interval === 14) return '9';
  if(interval === 15) return '♯9';
  if(interval === 17) return '11';
  if(interval === 18) return '♯11';
  if(interval === 20) return '♭13';
  if(interval === 21) return '13';

  if(normalized === 0) return '1';
  if(normalized === 3) return '♭3';
  if(normalized === 4) return '3';
  if(normalized === 5) return '4';
  if(normalized === 6) return '♭5';
  if(normalized === 7) return '5';
  if(normalized === 8) return '♯5';
  if(normalized === 9) return '6';
  if(normalized === 10) return '♭7';
  if(normalized === 11) return '7';
  if(normalized === 1) return '♭9';
  if(normalized === 2) return '9';

  return String(interval);
}

const CHORD_DEFINITIONS = BASE_ORDER.flatMap(familyId => (
  FAMILY_CONFIG[familyId].supportedTensions.map(tensionId => buildDefinition(familyId, tensionId))
));

function getSelectedIds(selectedIds, fallbackIds){
  if(Array.isArray(selectedIds)){
    return [...selectedIds];
  }
  return [...fallbackIds];
}

function normalizeOptions(optionsOrBaseOctave){
  if(typeof optionsOrBaseOctave === 'number'){
    return {
      baseOctave: optionsOrBaseOctave,
      voicingFamily: 'close',
      voicingMode: 'close-root',
      randomVoicingIds: [],
      randomFn: Math.random,
    };
  }

  return {
    baseOctave: optionsOrBaseOctave?.baseOctave ?? 3,
    voicingFamily: optionsOrBaseOctave?.voicingFamily ?? 'close',
    voicingMode: optionsOrBaseOctave?.voicingMode ?? 'close-root',
    randomVoicingIds: optionsOrBaseOctave?.randomVoicingIds ?? [],
    randomFn: optionsOrBaseOctave?.randomFn ?? Math.random,
  };
}

function getInversionLabel(inversion){
  if(inversion === 0) return '原位';
  const names = ['一', '二', '三', '四', '五'];
  const prefix = names[inversion - 1] ?? String(inversion);
  return `${prefix}转位`;
}

function getMaxInversion(familyId){
  return Math.max(FAMILY_CONFIG[familyId].shellIntervals.length - 1, 0);
}

function getVoicingFamilyLabel(voicingFamily = 'close'){
  return VOICING_FAMILY_LABELS[voicingFamily] ?? voicingFamily;
}

function isDropVoicingCompatible(definition){
  return definition.tensionId === 'none' &&
    DROP_VOICING_SUPPORTED_FAMILIES.includes(definition.familyId);
}

function supportsVoicingFamily(definition, voicingFamily = 'close'){
  if(!DROP_VOICING_FAMILY_IDS.includes(voicingFamily)){
    return true;
  }
  return isDropVoicingCompatible(definition);
}

function getSpecificVoicingOptionIdsForFamily(familyId){
  const maxInversion = getMaxInversion(familyId);
  return SPECIFIC_VOICING_OPTION_IDS.filter(optionId => VOICING_ID_TO_INVERSION[optionId] <= maxInversion);
}

function getRandomVoicingOptionIdsForFamily(familyId, randomVoicingIds = []){
  const availableOptionIds = getSpecificVoicingOptionIdsForFamily(familyId);
  if(Array.isArray(randomVoicingIds) && randomVoicingIds.length){
    return randomVoicingIds.filter(optionId => availableOptionIds.includes(optionId));
  }
  return availableOptionIds;
}

function getAvailableInversions(familyId, voicingMode, randomVoicingIds = [], voicingFamily = 'close'){
  const maxInversion = getMaxInversion(familyId);

  if(DROP_VOICING_FAMILY_IDS.includes(voicingFamily) && maxInversion < 3){
    return [];
  }

  if(voicingMode === 'close-random'){
    return getRandomVoicingOptionIdsForFamily(familyId, randomVoicingIds)
      .map(optionId => VOICING_ID_TO_INVERSION[optionId]);
  }

  if(voicingMode === 'close-root'){
    return [0];
  }

  if(voicingMode === 'close-first'){
    return maxInversion >= 1 ? [1] : [];
  }

  if(voicingMode === 'close-second'){
    return maxInversion >= 2 ? [2] : [];
  }

  if(voicingMode === 'close-third'){
    return maxInversion >= 3 ? [3] : [];
  }

  return [0];
}

function applyCloseVoicing(intervals, inversion){
  return intervals
    .slice(inversion)
    .concat(intervals.slice(0, inversion).map(interval => interval + 12));
}

function applyCloseVoicingEntries(entries, inversion){
  return entries
    .slice(inversion)
    .concat(entries.slice(0, inversion).map(entry => ({
      ...entry,
      interval: entry.interval + 12,
    })));
}

function applyDropVoicing(intervals, dropIndexFromTop){
  const targetIndex = intervals.length - dropIndexFromTop;
  const droppedIntervals = intervals.map((interval, index) => (
    index === targetIndex ? interval - 12 : interval
  ));
  return droppedIntervals.sort((left, right) => left - right);
}

function applyDropVoicingEntries(entries, dropIndexFromTop){
  const targetIndex = entries.length - dropIndexFromTop;
  return entries
    .map((entry, index) => (
      index === targetIndex
        ? { ...entry, interval: entry.interval - 12 }
        : { ...entry }
    ))
    .sort((left, right) => left.interval - right.interval);
}

function applyVoicingFamily(intervals, inversion, voicingFamily = 'close'){
  const closeVoicing = applyCloseVoicing(intervals, inversion);

  if(voicingFamily === 'drop2'){
    return applyDropVoicing(closeVoicing, 2);
  }

  if(voicingFamily === 'drop3'){
    return applyDropVoicing(closeVoicing, 3);
  }

  return closeVoicing;
}

function applyVoicingFamilyEntries(entries, inversion, voicingFamily = 'close'){
  const closeVoicing = applyCloseVoicingEntries(entries, inversion);

  if(voicingFamily === 'drop2'){
    return applyDropVoicingEntries(closeVoicing, 2);
  }

  if(voicingFamily === 'drop3'){
    return applyDropVoicingEntries(closeVoicing, 3);
  }

  return closeVoicing;
}

function getVoicingLabel(inversion){
  return getInversionLabel(inversion);
}

function getVoicingDisplayLabel(inversion, voicingFamily = 'close'){
  if(voicingFamily === 'close'){
    return getVoicingLabel(inversion);
  }
  return `${getVoicingFamilyLabel(voicingFamily)} · ${getVoicingLabel(inversion)}`;
}

function getReferenceDiagram(chordId, voicingFamily = 'close'){
  const image = REFERENCE_DIAGRAMS[voicingFamily]?.[chordId];
  if(!image) return null;

  return {
    image,
    title: `${getVoicingFamilyLabel(voicingFamily)} ${getChordDefinition(chordId).answerLabel}`,
    caption: 'Movable shape reference for the current voicing family.',
  };
}

function getDynamicVoicingLibrary(voicingFamily){
  if(voicingFamily === 'drop2') return DROP2;
  if(voicingFamily === 'drop3') return DROP3;
  return null;
}

function getDynamicVoicingQuality(chordId){
  return VOICING_QUALITY_MAP[chordId] ?? null;
}

function getDynamicVoicingCandidates(root, chordId, voicingFamily, inversion){
  const library = getDynamicVoicingLibrary(voicingFamily);
  const quality = getDynamicVoicingQuality(chordId);
  if(!library || !quality) return [];

  const qualityVoicings = library[quality];
  if(!qualityVoicings) return [];

  const rootOffset = noteToSemitone(root);
  const candidates = STRING_SETS
    .map((set, setIndex) => {
      const source = qualityVoicings[set.id]?.[inversion];
      if(!source) return null;
      const frets = transposeVoicing(source.frets, rootOffset);
      const positiveFrets = frets.filter(fret => fret > 0);
      const maxFret = positiveFrets.length ? Math.max(...positiveFrets) : 0;
      const minFret = positiveFrets.length ? Math.min(...positiveFrets) : 0;
      const span = positiveFrets.length ? maxFret - minFret : 0;

      return {
        set,
        frets,
        score: [maxFret, span, minFret, setIndex],
      };
    })
    .filter(Boolean);

  if(!candidates.length) return [];

  candidates.sort((left, right) => {
    for(let index = 0; index < left.score.length; index += 1){
      const diff = left.score[index] - right.score[index];
      if(diff !== 0) return diff;
    }
    return 0;
  });

  return candidates;
}

function buildContiguousStringSets(size){
  if(size < 2 || size > 6) return [];
  return Array.from({ length: 7 - size }, (_, start) => ({
    label: `${start + 1}-${start + size}`,
    strings: Array.from({ length: size }, (_, index) => start + index),
  }));
}

function voicesToFretsTopDown(noteClasses, strings){
  let previousMidi = Infinity;
  const frets = [];

  for(let index = 0; index < noteClasses.length; index += 1){
    const openMidi = GUITAR_TUNING_HIGH_TO_LOW[strings[index]];
    const noteClass = ((noteClasses[index] % 12) + 12) % 12;
    const candidates = [];

    for(let fret = 0; fret <= 15; fret += 1){
      if((openMidi + fret) % 12 === noteClass){
        candidates.push(openMidi + fret);
      }
    }

    if(!candidates.length){
      return null;
    }

    if(index === 0){
      frets.push(candidates[0] - openMidi);
      previousMidi = candidates[0];
      continue;
    }

    let bestMidi = candidates.filter(midi => midi < previousMidi).pop();
    if(bestMidi === undefined){
      bestMidi = candidates[0];
    }

    frets.push(bestMidi - openMidi);
    previousMidi = bestMidi;
  }

  return frets;
}

function getGenericDiagramCandidates(midiNotes){
  const noteClassesTopDown = [...midiNotes]
    .reverse()
    .map(midi => ((midi % 12) + 12) % 12);
  const stringSets = buildContiguousStringSets(noteClassesTopDown.length);
  const candidates = stringSets
    .map((set, setIndex) => {
      const frets = voicesToFretsTopDown(noteClassesTopDown, set.strings);
      if(!frets) return null;

      const positiveFrets = frets.filter(fret => fret > 0);
      const maxFret = positiveFrets.length ? Math.max(...positiveFrets) : 0;
      const minFret = positiveFrets.length ? Math.min(...positiveFrets) : 0;
      const span = positiveFrets.length ? maxFret - minFret : 0;

      return {
        set,
        frets,
        score: [maxFret, span, minFret, setIndex],
      };
    })
    .filter(Boolean);

  if(!candidates.length){
    return [];
  }

  candidates.sort((left, right) => {
    for(let index = 0; index < left.score.length; index += 1){
      const diff = left.score[index] - right.score[index];
      if(diff !== 0) return diff;
    }
    return 0;
  });

  return candidates;
}

function buildDynamicDiagrams(root, chordId, voicingFamily, inversion, midiNotes, intervalLabelsTopDown){
  const candidates = getDynamicVoicingCandidates(root, chordId, voicingFamily, inversion);
  const fallbackCandidates = candidates.length ? candidates : getGenericDiagramCandidates(midiNotes);
  if(!fallbackCandidates.length) return [];

  return fallbackCandidates.slice(0, 3).map(candidate => {
    // 将4弦数据转换为6弦格式（从低到高，0=6弦，5=1弦），-1表示静音
    // candidate.set.strings 是从高到低的索引（0=1弦），candidate.frets 对应顺序
    const fullFrets = [-1, -1, -1, -1, -1, -1];
    const fullIntervalLabels = [null, null, null, null, null, null];
    candidate.set.strings.forEach((stringIndex, i) => {
      fullFrets[5 - stringIndex] = candidate.frets[i];
      fullIntervalLabels[5 - stringIndex] = intervalLabelsTopDown[i] ?? null;
    });

    const positiveFrets = fullFrets.filter(fret => fret > 0);
    const minPositiveFret = positiveFrets.length ? Math.min(...positiveFrets) : 1;
    const maxPositiveFret = positiveFrets.length ? Math.max(...positiveFrets) : 1;
    const baseFret = maxPositiveFret <= 4 ? 1 : minPositiveFret;

    return {
      kind: 'dynamic',
      title: `${formatRootLabel(root)}${getChordDefinition(chordId).answerLabel} · ${getVoicingFamilyLabel(voicingFamily)} · ${getInversionLabel(inversion)}`,
      caption: `Current root-transposed shape on ${candidate.set.label}.`,
      stringSetLabel: candidate.set.label,
      frets: fullFrets,
      intervalLabels: fullIntervalLabels,
      baseFret,
    };
  });
}

function getQuestionDiagrams(root, chordId, voicingFamily, inversion, midiNotes, intervalLabelsTopDown){
  const dynamicDiagrams = buildDynamicDiagrams(root, chordId, voicingFamily, inversion, midiNotes, intervalLabelsTopDown);
  if(dynamicDiagrams.length){
    return dynamicDiagrams;
  }
  const fallbackDiagram = getReferenceDiagram(chordId, voicingFamily);
  return fallbackDiagram ? [fallbackDiagram] : [];
}

function getVoicingVariantCount(chordId, config = {}){
  const definition = getChordDefinition(chordId);
  return getAvailableInversions(
    definition.familyId,
    config.voicingMode ?? 'close-root',
    config.randomVoicingIds,
    config.voicingFamily,
  ).length;
}

function getRootCandidates(rootMode = 'fixed', fixedRoot = 'C', randomRootIds = []){
  if(rootMode !== 'random'){
    return [fixedRoot];
  }

  const selectedRoots = randomRootIds.filter(root => CHROMATIC_ROOTS.includes(root));
  return selectedRoots.length ? selectedRoots : [...CHROMATIC_ROOTS];
}

function getQuestionVariantCount(chordPool, rootMode, fixedRoot, config = {}){
  const rootCount = getRootCandidates(rootMode, fixedRoot, config.randomRootIds).length;
  const voicingCount = chordPool.reduce(
    (total, chordId) => total + getVoicingVariantCount(chordId, config),
    0,
  );
  return rootCount * voicingCount;
}

function getVoicingOptionLabel(optionId){
  return VOICING_OPTIONS.find(option => option.id === optionId)?.label ?? optionId;
}

export function getAnswerModeContext({
  config = {},
  rootMode = 'fixed',
  fixedRoot = 'C',
} = {}){
  const chordPool = buildChordPool(config);
  const safePool = chordPool.length ? chordPool : buildChordPool();
  const rootCandidates = getRootCandidates(rootMode, fixedRoot, config.randomRootIds);
  const singleChordId = safePool.length === 1 ? safePool[0] : null;
  const singleDefinition = singleChordId ? getChordDefinition(singleChordId) : null;
  const inversionOptionIds = singleDefinition
    ? getRandomVoicingOptionIdsForFamily(singleDefinition.familyId, config.randomVoicingIds)
    : [];

  if(singleChordId && rootCandidates.length > 1){
    return {
      answerMode: 'root',
      promptLabel: '根音',
      optionIds: rootCandidates,
      optionLabels: rootCandidates.map(formatRootLabel),
    };
  }

  if(singleChordId && (config.voicingMode ?? 'close-root') === 'close-random' && inversionOptionIds.length > 1){
    return {
      answerMode: 'inversion',
      promptLabel: '转位',
      optionIds: inversionOptionIds,
      optionLabels: inversionOptionIds.map(getVoicingOptionLabel),
    };
  }

  return {
    answerMode: 'chord',
    promptLabel: '和弦',
    optionIds: [...safePool],
    optionLabels: safePool.map(id => getChordDefinition(id).answerLabel),
  };
}

export function getAvailableVoicingOptionIds(config = {}){
  const baseChordIds = getSelectedIds(config.baseChordIds, ['major-triad', 'minor-triad', 'major', 'dominant', 'minor']);
  const tensionIds = getSelectedIds(config.tensionIds, ['none']);
  const voicingFamily = config.voicingFamily ?? 'close';

  return VOICING_OPTIONS
    .filter(option => CHORD_DEFINITIONS.some(definition => (
      baseChordIds.includes(definition.familyId) &&
      tensionIds.includes(definition.tensionId) &&
      supportsVoicingFamily(definition, voicingFamily) &&
      getAvailableInversions(definition.familyId, option.id, [], voicingFamily).length > 0
    )))
    .map(option => option.id);
}

export function getAvailableRandomVoicingOptionIds(config = {}){
  return getAvailableVoicingOptionIds(config)
    .filter(optionId => optionId !== 'close-random');
}

export function formatRootLabel(root){
  return String(root).replace(/b/g, '♭').replace(/#/g, '♯');
}

export function getChordDefinition(chordId){
  const definition = CHORD_DEFINITIONS.find(item => item.id === chordId);
  if(!definition){
    throw new Error(`Unknown chord: ${chordId}`);
  }
  return definition;
}

export function getTrainingTemplate(templateId){
  const template = TRAINING_TEMPLATES.find(item => item.id === templateId);
  if(!template){
    throw new Error(`Unknown training template: ${templateId}`);
  }
  return template;
}

export function buildChordPool(config = {}){
  const baseChordIds = getSelectedIds(config.baseChordIds, ['major-triad', 'minor-triad', 'major', 'dominant', 'minor']);
  const tensionIds = getSelectedIds(config.tensionIds, ['none']);
  const voicingMode = config.voicingMode ?? 'close-root';
  const voicingFamily = config.voicingFamily ?? 'close';

  return CHORD_DEFINITIONS
    .filter(definition => (
      baseChordIds.includes(definition.familyId) &&
      tensionIds.includes(definition.tensionId) &&
      supportsVoicingFamily(definition, voicingFamily) &&
      getAvailableInversions(definition.familyId, voicingMode, config.randomVoicingIds, voicingFamily).length > 0
    ))
    .sort((left, right) => {
      const baseComparison = BASE_ORDER.indexOf(left.familyId) - BASE_ORDER.indexOf(right.familyId);
      if(baseComparison !== 0) return baseComparison;
      return TENSION_ORDER.indexOf(left.tensionId) - TENSION_ORDER.indexOf(right.tensionId);
    })
    .map(definition => definition.id);
}

export function buildChordNotes(root, chordId, optionsOrBaseOctave = 3){
  const definition = getChordDefinition(chordId);
  const options = normalizeOptions(optionsOrBaseOctave);
  const rootSemitone = noteToSemitone(root);
  const baseMidi = ((options.baseOctave + 1) * 12) + rootSemitone;
  const inversionChoices = getAvailableInversions(
    definition.familyId,
    options.voicingMode,
    options.randomVoicingIds,
    options.voicingFamily,
  );
  const safeInversionChoices = inversionChoices.length ? inversionChoices : [0];
  const inversion = pickFromList(safeInversionChoices, options.randomFn);
  const voicedEntries = applyVoicingFamilyEntries(
    definition.intervals.map(interval => ({
      interval,
      label: formatIntervalLabel(interval),
    })),
    inversion,
    options.voicingFamily,
  );
  const voicedIntervals = voicedEntries.map(entry => entry.interval);
  const midiNotes = voicedIntervals.map(interval => baseMidi + interval);
  const intervalLabels = voicedEntries.map(entry => entry.label);
  const intervalLabelsTopDown = [...intervalLabels].reverse();
  const diagrams = getQuestionDiagrams(
    root,
    chordId,
    options.voicingFamily,
    inversion,
    midiNotes,
    intervalLabelsTopDown,
  );

  return {
    root,
    rootLabel: formatRootLabel(root),
    chordId,
    label: `${formatRootLabel(root)}${definition.symbol}`,
    definition,
    inversion,
    inversionLabel: getInversionLabel(inversion),
    voicingFamily: options.voicingFamily,
    voicingFamilyLabel: getVoicingFamilyLabel(options.voicingFamily),
    voicingMode: options.voicingMode,
    voicingLabel: getVoicingDisplayLabel(inversion, options.voicingFamily),
    noteLabels: midiNotes.map(midi => semitoneToDisplayNote(midi % 12)),
    intervalLabels,
    audioNotes: midiNotes.map(midiToPlaybackNoteName),
    diagrams,
    diagram: diagrams[0] ?? null,
  };
}

export function buildPlaybackEvents(noteNames, playbackMode = 'chord'){
  const noteDuration = 0.42;
  const stepDelay = 0.16;
  const chordDuration = 1.35;

  if(playbackMode === 'arpeggio'){
    return noteNames.map((note, index) => ({
      type: 'note',
      notes: [note],
      delay: Number((index * stepDelay).toFixed(2)),
      duration: noteDuration,
    }));
  }

  if(playbackMode === 'both'){
    const arpeggioEvents = buildPlaybackEvents(noteNames, 'arpeggio');
    return [
      ...arpeggioEvents,
      {
        type: 'chord',
        notes: noteNames,
        delay: Number(((noteNames.length + 1) * stepDelay).toFixed(2)),
        duration: chordDuration,
      },
    ];
  }

  return [{
    type: 'chord',
    notes: noteNames,
    delay: 0,
    duration: chordDuration,
  }];
}

export function createQuestion({
  config = {},
  rootMode = 'fixed',
  fixedRoot = 'C',
  previousSignature = null,
  randomFn = Math.random,
  baseOctave = 3,
}){
  const chordPool = buildChordPool(config);
  const safePool = chordPool.length ? chordPool : buildChordPool();
  const voicingFamily = config.voicingFamily ?? 'close';
  const voicingMode = config.voicingMode ?? 'close-root';
  const answerContext = getAnswerModeContext({ config, rootMode, fixedRoot });
  const rootCandidates = getRootCandidates(rootMode, fixedRoot, config.randomRootIds);

  let attempts = 0;
  let root = fixedRoot;
  let chordId = safePool[0];
  let chord = buildChordNotes(root, chordId, {
    baseOctave,
    voicingFamily,
    voicingMode,
    randomVoicingIds: config.randomVoicingIds,
    randomFn,
  });
  let signature = `${root}:${chordId}:${chord.inversion}`;

  do {
    root = rootMode === 'random'
      ? pickFromList(rootCandidates, randomFn)
      : fixedRoot;
    chordId = pickFromList(safePool, randomFn);
    chord = buildChordNotes(root, chordId, {
      baseOctave,
      voicingFamily,
      voicingMode,
      randomVoicingIds: config.randomVoicingIds,
      randomFn,
    });
    signature = `${root}:${chordId}:${chord.inversion}`;
    attempts++;
  } while(
    signature === previousSignature &&
    attempts < 16 &&
    getQuestionVariantCount(safePool, rootMode, fixedRoot, config) > 1
  );

  let correctOptionId = chordId;
  if(answerContext.answerMode === 'root'){
    correctOptionId = root;
  }
  if(answerContext.answerMode === 'inversion'){
    correctOptionId = Object.entries(VOICING_ID_TO_INVERSION)
      .find(([, inversion]) => inversion === chord.inversion)?.[0] ?? 'close-root';
  }

  return {
    ...chord,
    answerMode: answerContext.answerMode,
    promptLabel: answerContext.promptLabel,
    rootMode,
    signature,
    correctOptionId,
    optionIds: [...answerContext.optionIds],
    optionLabels: [...answerContext.optionLabels],
  };
}
