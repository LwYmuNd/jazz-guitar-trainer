import test from 'node:test';
import assert from 'node:assert/strict';
import { renderChordDiagramSVG } from '../src/core/chord-diagram-renderer.js';

test('renderChordDiagramSVG returns svg markup', () => {
  const svg = renderChordDiagramSVG({
    title: 'Cmaj7',
    frets: [-1, 3, 2, 0, 0, 0],
    intervalLabels: [null, '1', '3', '5', '7', '3'],
    baseFret: 1,
  });

  assert.match(svg, /^<svg/);
  assert.match(svg, /viewBox=/);
  assert.match(svg, /circle/);
  assert.match(svg, /text/);
  assert.match(svg, /Cmaj7/);
});

test('renderChordDiagramSVG renders muted and open strings', () => {
  const svg = renderChordDiagramSVG({
    title: 'Dm7',
    frets: [-1, 5, 5, 5, 6, -1],
    intervalLabels: [null, '1', '5', 'b7', 'b3', null],
    baseFret: 5,
  });

  assert.match(svg, />X</);
  assert.match(svg, />5</);
});

test('renderChordDiagramSVG paints root circle red and others dark', () => {
  const svg = renderChordDiagramSVG({
    title: 'Cmaj7',
    frets: [-1, 3, 2, 0, 0, 0],
    intervalLabels: [null, '1', '3', '5', '7', '3'],
    baseFret: 1,
  });

  // 红色根音圆 + 深色和弦音圆都应当出现
  assert.match(svg, /#DC2626/);
  assert.match(svg, /#1F2937/);
});

test('renderChordDiagramSVG draws barre arc when provided', () => {
  const svg = renderChordDiagramSVG({
    title: 'F',
    frets: [1, 3, 3, 2, 1, 1],
    intervalLabels: ['1', '5', '1', '3', '5', '1'],
    baseFret: 1,
    barre: { fret: 1, fromString: 1, toString: 6 },
  });

  // 弧线用 path d="M ... Q ..."
  assert.match(svg, /<path d="M /);
  assert.match(svg, /Q /);
});

test('renderChordDiagramSVG renders optional dots in light gray without label', () => {
  const svg = renderChordDiagramSVG({
    title: 'C13b9 (rootless)',
    frets: [-1, -1, 3, 2, 4, 3],
    intervalLabels: [null, null, '13', 'b9', 'b7', '3'],
    baseFret: 1,
    optionalDots: [{ string: 5, fret: 3 }],
  });

  // 浅灰圆点配色
  assert.match(svg, /#CBD5E1/);
});

test('renderChordDiagramSVG marks rootless in aria-label and skips red root', () => {
  const svg = renderChordDiagramSVG({
    title: 'C13b9',
    frets: [-1, -1, 3, 2, 4, 3],
    intervalLabels: [null, null, '13', 'b9', 'b7', '3'],
    baseFret: 1,
    rootless: true,
  });

  assert.match(svg, /\(rootless\)/);
  // rootless 时不应有红色根音圆
  assert.doesNotMatch(svg, /#DC2626/);
});

test('renderChordDiagramSVG expands to 5 frets when shape spans more than 4', () => {
  // 跨 1-5 品的指型（如 C9 高位声部）
  const svg = renderChordDiagramSVG({
    title: 'C9',
    frets: [-1, 3, 2, 4, 5, 5],
    intervalLabels: [null, '1', 'b7', '3', '5', '9'],
    baseFret: 1,
  });

  // marginLeft=36 + 5*fretGap(36) + marginRight=24 = 240
  assert.match(svg, /viewBox="0 0 240 200"/);
  // 品位编号 5 应出现
  assert.match(svg, /font-weight="700" text-anchor="middle">5</);
});

test('renderChordDiagramSVG keeps 4-fret board when shape fits within 4 frets', () => {
  const svg = renderChordDiagramSVG({
    title: 'Cmaj7',
    frets: [-1, 3, 2, 0, 0, 0],
    intervalLabels: [null, '1', '3', '5', '7', '3'],
    baseFret: 1,
  });
  // 36 + 4*36 + 24 = 204
  assert.match(svg, /viewBox="0 0 204 200"/);
});

test('renderChordDiagramSVG honors explicit numFrets override', () => {
  const svg = renderChordDiagramSVG({
    title: 'Cmaj7',
    frets: [-1, 3, 2, 0, 0, 0],
    intervalLabels: [null, '1', '3', '5', '7', '3'],
    baseFret: 1,
    numFrets: 6,
  });
  // 36 + 6*36 + 24 = 276
  assert.match(svg, /viewBox="0 0 276 200"/);
});

test('renderChordDiagramSVG expands when barre or optionalDots reach beyond 4 frets', () => {
  const svgBarre = renderChordDiagramSVG({
    title: 'X',
    frets: [5, 7, 7, 6, 9, 5],
    intervalLabels: ['1', '5', '1', '3', '5', '1'],
    baseFret: 5,
    barre: { fret: 5, fromString: 1, toString: 6 },
  });
  // 把位 5-9 共 5 品（rel max = 9-5+1 = 5）
  assert.match(svgBarre, /viewBox="0 0 240 200"/);

  const svgOpt = renderChordDiagramSVG({
    title: 'X',
    frets: [-1, 1, 2, 3, 4, -1],
    intervalLabels: [null, '1', '3', '5', '7', null],
    baseFret: 1,
    optionalDots: [{ string: 1, fret: 5 }],
  });
  assert.match(svgOpt, /viewBox="0 0 240 200"/);
});

test('renderChordDiagramSVG remains backwards compatible without new fields', () => {
  // 不传 barre / optionalDots / rootless 时应正常渲染
  const svg = renderChordDiagramSVG({
    title: 'Cmaj7',
    frets: [-1, 3, 2, 0, 0, 0],
    intervalLabels: [null, '1', '3', '5', '7', '3'],
    baseFret: 1,
  });

  assert.match(svg, /^<svg/);
  // 没有 barre 不应有 path
  assert.doesNotMatch(svg, /<path d="M /);
});
