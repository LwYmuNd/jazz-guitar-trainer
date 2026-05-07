import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDatabase,
  getFamilies,
  getQualitiesByFamily,
  getDiagrams,
} from '../src/core/chord-png-database.js';

const FIXTURE = [
  {
    source: 'maj7.png',
    family: 'basic',
    title: 'Major 7',
    diagrams: [
      {
        name: 'Cmaj7', root: 'C', quality: 'maj7', baseFret: 1,
        frets: [-1, 3, 2, 0, 0, 0],
        intervalLabels: [null, '1', '3', '5', '7', '3'],
        mutedStrings: [6],
      },
      {
        name: 'Cmaj7/E', root: 'C', quality: 'maj7', bassNote: 'E', baseFret: 3,
        frets: [-1, 7, 5, 4, 5, -1],
        intervalLabels: [null, '1', '5', '7', '3', null],
        mutedStrings: [1, 6],
      },
    ],
  },
  {
    source: 'min7.png',
    family: 'basic',
    title: 'Minor 7',
    diagrams: [
      {
        name: 'Cm7', root: 'C', quality: 'm7', baseFret: 3,
        frets: [-1, 3, 5, 3, 4, 3],
        intervalLabels: [null, '1', '5', 'b7', 'b3', '5'],
      },
    ],
  },
  {
    source: 'drop2-maj7.png',
    family: 'drop2',
    diagrams: [
      {
        name: 'Cmaj7', root: 'C', quality: 'maj7', baseFret: 3,
        frets: [-1, 3, 5, 4, 5, -1],
        intervalLabels: [null, '1', '5', '7', '3', null],
      },
    ],
  },
  {
    source: 'altered-rootless.png',
    family: 'altered',
    diagrams: [
      {
        name: 'C13b9 (rootless)', root: 'C', quality: '13b9', baseFret: 1,
        rootless: true,
        frets: [-1, -1, 3, 2, 4, 3],
        intervalLabels: [null, null, '13', 'b9', 'b7', '3'],
        barre: { fret: 2, fromString: 2, toString: 5 },
        optionalDots: [{ string: 5, fret: 5 }],
      },
    ],
  },
  {
    source: 'broken.png',
    family: 'basic',
    diagrams: [
      // 缺 frets，应被忽略
      { name: 'Bad', root: 'C', quality: 'maj7' },
      // frets 长度不对，应被忽略
      { name: 'Bad2', root: 'C', quality: 'maj7', frets: [1, 2, 3] },
    ],
  },
];

test('createDatabase normalizes valid diagrams and skips broken ones', () => {
  const db = createDatabase(FIXTURE);
  assert.equal(db.diagrams.length, 5);
  // broken.png 的两条都应被过滤
  assert.equal(db.diagrams.filter(d => d.source === 'broken.png').length, 0);
});

test('createDatabase aggregates families with counts and stable ordering', () => {
  const db = createDatabase(FIXTURE);
  const families = getFamilies(db);
  // basic 应排在 drop2 / altered 前（priority 顺序）
  assert.deepEqual(families.map(f => f.id), ['basic', 'altered', 'drop2']);
  const basic = families.find(f => f.id === 'basic');
  assert.equal(basic.count, 3);
  assert.equal(basic.label, 'Basic 7th');
});

test('getQualitiesByFamily lists distinct qualities only within that family', () => {
  const db = createDatabase(FIXTURE);
  const basic = getQualitiesByFamily(db, 'basic');
  const ids = basic.map(q => q.id).sort();
  assert.deepEqual(ids, ['m7', 'maj7']);
  // basic 中 maj7 出现 2 次
  assert.equal(basic.find(q => q.id === 'maj7').count, 2);
});

test('getDiagrams filters by family and quality', () => {
  const db = createDatabase(FIXTURE);
  const all = getDiagrams(db);
  assert.equal(all.length, 5);

  const basicMaj7 = getDiagrams(db, { family: 'basic', quality: 'maj7' });
  assert.equal(basicMaj7.length, 2);
  assert.ok(basicMaj7.every(d => d.family === 'basic' && d.quality === 'maj7'));

  const drop2 = getDiagrams(db, { family: 'drop2' });
  assert.equal(drop2.length, 1);
  assert.equal(drop2[0].source, 'drop2-maj7.png');
});

test('getDiagrams returns rootless and barre data unchanged', () => {
  const db = createDatabase(FIXTURE);
  const altered = getDiagrams(db, { family: 'altered' });
  assert.equal(altered.length, 1);
  const d = altered[0];
  assert.equal(d.rootless, true);
  assert.deepEqual(d.barre, { fret: 2, fromString: 2, toString: 5 });
  assert.deepEqual(d.optionalDots, [{ string: 5, fret: 5 }]);
});

test('getDiagrams produces fretsText and intervalsText for UI display', () => {
  const db = createDatabase(FIXTURE);
  const [first] = getDiagrams(db, { family: 'basic', quality: 'maj7' });
  assert.equal(first.fretsText, 'x-3-2-0-0-0');
  assert.equal(first.intervalsText, '1 · 3 · 5 · 7 · 3');
});

test('createDatabase returns empty structure on no input', () => {
  const db = createDatabase([]);
  assert.equal(db.diagrams.length, 0);
  assert.equal(getFamilies(db).length, 0);
  assert.equal(getQualitiesByFamily(db, 'basic').length, 0);
  assert.deepEqual(getDiagrams(db), []);
});

test('createDatabase preserves bassNote for slash chords', () => {
  const db = createDatabase(FIXTURE);
  const slash = db.diagrams.find(d => d.name === 'Cmaj7/E');
  assert.equal(slash.bassNote, 'E');
});
