/**
 * Chord PNG Database
 *
 * 运行时和弦库数据源：从 `src/core/chord-png-db/<source>.json` 校对完成的 JSON
 * 聚合为查询接口。Vite 通过 `import.meta.glob` 在构建时静态打包；
 * 纯查询函数 (`createDatabase` / `getFamilies` / `getQualitiesByFamily` /
 * `getDiagrams`) 不依赖 Vite，便于 Node 测试单独覆盖。
 */

const FAMILY_LABEL_MAP = {
  basic: { label: 'Basic 7th', priority: 1 },
  shell: { label: 'Shell', priority: 2 },
  'extended-maj': { label: 'Extended Maj', priority: 3 },
  'extended-dom': { label: 'Extended Dom', priority: 4 },
  sus: { label: 'Sus', priority: 5 },
  'extended-min': { label: 'Extended Min', priority: 6 },
  altered: { label: 'Altered', priority: 7 },
  drop2: { label: 'Drop 2', priority: 8 },
  drop3: { label: 'Drop 3', priority: 9 },
  open: { label: 'Open', priority: 10 },
};

const QUALITY_LABEL_MAP = {
  maj7: 'Maj7',
  '7': 'Dom7',
  m: 'Min',
  m7: 'Min7',
  m7b5: 'Min7b5',
  dim7: 'Dim7',
  mmaj7: 'MinMaj7',
  mmaj9: 'MinMaj9',
  add9: 'Add9',
  madd9: 'MinAdd9',
  maj6: 'Maj6',
  maj69: 'Maj6/9',
  maj69s11: 'Maj6/9#11',
  maj9: 'Maj9',
  maj9s11: 'Maj9#11',
  maj13: 'Maj13',
  maj13s11: 'Maj13#11',
  maj7s11: 'Maj7#11',
  maj7s5: 'Maj7#5',
  '9': 'Dom9',
  '13': 'Dom13',
  sus47: '7sus4',
  sus49: '9sus4',
  sus413: '13sus4',
  m6: 'Min6',
  m9: 'Min9',
  m11: 'Min11',
  m11b6: 'Min11(b6)',
  m7b5add11: 'Min7b5(add11)',
  '7b9': '7b9',
  '7b9sus4': '7b9sus4',
  '7b9sus4b13': '7sus4(b9,b13)',
  '13b9': '13b9',
  '13sus4b9': '13sus4(b9)',
  '13s9': '13#9',
  '13s11': '13#11',
  '7s9': '7#9',
  '7s11': '7#11',
  '7b13': '7b13',
  '7b5b9': '7b5(b9)',
  '7b5s9': '7b5(#9)',
  '7s5b9': '7#5(b9)',
  '7s5s9': '7#5(#9)',
  altb5: 'Alt(b5)',
  alts5: 'Alt(#5)',
};

function qualityLabel(quality) {
  return QUALITY_LABEL_MAP[quality] ?? quality;
}

function familyLabel(family) {
  return FAMILY_LABEL_MAP[family]?.label ?? family;
}

function familyPriority(family) {
  return FAMILY_LABEL_MAP[family]?.priority ?? 999;
}

function normalizeDiagram(diagram, source, family, indexInFile) {
  if (!diagram || typeof diagram !== 'object') return null;
  const frets = Array.isArray(diagram.frets) ? diagram.frets : null;
  if (!frets || frets.length !== 6) return null;

  const intervalLabels = Array.isArray(diagram.intervalLabels) && diagram.intervalLabels.length === 6
    ? diagram.intervalLabels
    : [null, null, null, null, null, null];

  const baseFret = Number.isFinite(diagram.baseFret) ? diagram.baseFret : 1;
  const quality = typeof diagram.quality === 'string' ? diagram.quality : 'unknown';
  const root = typeof diagram.root === 'string' ? diagram.root : 'C';
  const bassNote = typeof diagram.bassNote === 'string' ? diagram.bassNote : null;
  const rootless = Boolean(diagram.rootless);
  const optionalDots = Array.isArray(diagram.optionalDots) ? diagram.optionalDots : [];
  const barre = diagram.barre && typeof diagram.barre === 'object' ? diagram.barre : null;
  const mutedStrings = Array.isArray(diagram.mutedStrings) ? diagram.mutedStrings : [];

  const fretsText = frets.map(f => (f < 0 ? 'x' : String(f))).join('-');
  const intervalsText = intervalLabels.filter(Boolean).join(' · ');

  return {
    id: `${source}#${indexInFile}`,
    source,
    family,
    name: diagram.name ?? `${root}${quality}`,
    root,
    quality,
    qualityLabel: qualityLabel(quality),
    bassNote,
    rootless,
    frets,
    intervalLabels,
    baseFret,
    mutedStrings,
    optionalDots,
    barre,
    fretsText,
    intervalsText,
  };
}

/**
 * 把 raw JSON 文件列表归一为查询友好的数据库。
 *
 * @param {Array<{ source?: string, family?: string, diagrams?: Array }>} files
 * @returns {{ diagrams: Array, families: Array<{id,label,priority,count}> }}
 */
export function createDatabase(files) {
  const diagrams = [];
  const familyCount = new Map();

  for (const file of files ?? []) {
    if (!file || typeof file !== 'object') continue;
    const source = typeof file.source === 'string' ? file.source : '';
    const family = typeof file.family === 'string' ? file.family : 'unknown';
    const list = Array.isArray(file.diagrams) ? file.diagrams : [];
    list.forEach((d, idx) => {
      const normalized = normalizeDiagram(d, source, family, idx);
      if (!normalized) return;
      diagrams.push(normalized);
      familyCount.set(family, (familyCount.get(family) ?? 0) + 1);
    });
  }

  const families = Array.from(familyCount.entries())
    .map(([id, count]) => ({
      id,
      label: familyLabel(id),
      priority: familyPriority(id),
      count,
    }))
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));

  return { diagrams, families };
}

/**
 * 列出所有有 diagram 的 family。
 */
export function getFamilies(db) {
  return db?.families ?? [];
}

/**
 * 列出指定 family 下出现过的 quality（按字典序）。
 */
export function getQualitiesByFamily(db, family) {
  if (!db || !family) return [];
  const map = new Map();
  for (const d of db.diagrams) {
    if (d.family !== family) continue;
    if (!map.has(d.quality)) {
      map.set(d.quality, {
        id: d.quality,
        label: qualityLabel(d.quality),
        count: 1,
      });
    } else {
      map.get(d.quality).count += 1;
    }
  }
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * 检索符合筛选条件的 diagram。
 *
 * @param {object} db
 * @param {{ family?: string, quality?: string }} filter
 */
export function getDiagrams(db, filter = {}) {
  if (!db) return [];
  const { family, quality } = filter;
  return db.diagrams.filter(d => {
    if (family && d.family !== family) return false;
    if (quality && d.quality !== quality) return false;
    return true;
  });
}

/**
 * 用 Vite 的 `import.meta.glob` 在构建时静态聚合所有已校对 JSON。
 * Vite 会把此调用替换为静态 import map；Node 原生 import.meta 没有 glob，
 * 用 try/catch 回退到空数据库供测试使用。
 */
function loadDefaultDatabase() {
  try {
    const modules = import.meta.glob('./chord-png-db/*.json', { eager: true, import: 'default' });
    const files = Object.values(modules);
    return createDatabase(files);
  } catch {
    return createDatabase([]);
  }
}

export const CHORD_PNG_DATABASE = loadDefaultDatabase();
