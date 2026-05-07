function computeNumFrets(diagram) {
  if (Number.isFinite(diagram.numFrets) && diagram.numFrets >= 4) {
    return Math.floor(diagram.numFrets);
  }
  const baseFret = Number.isFinite(diagram.baseFret) ? diagram.baseFret : 1;
  const toRel = (fret) => (baseFret === 1 ? fret : fret - baseFret + 1);

  let maxRel = 4;
  for (const fret of Array.isArray(diagram.frets) ? diagram.frets : []) {
    if (Number.isFinite(fret) && fret > 0) {
      const rel = toRel(fret);
      if (rel > maxRel) maxRel = rel;
    }
  }
  if (diagram.barre && Number.isFinite(diagram.barre.fret) && diagram.barre.fret > 0) {
    const rel = toRel(diagram.barre.fret);
    if (rel > maxRel) maxRel = rel;
  }
  for (const opt of Array.isArray(diagram.optionalDots) ? diagram.optionalDots : []) {
    if (opt && Number.isFinite(opt.fret) && opt.fret > 0) {
      const rel = toRel(opt.fret);
      if (rel > maxRel) maxRel = rel;
    }
  }
  return maxRel;
}

export function renderChordDiagramSVG(diagram) {
  const height = 200;
  const marginLeft = 36;
  const marginTop = 20;
  const marginRight = 24;
  const stringGap = 22;   // 弦间距（纵向）
  const fretGap = 36;     // 品格间距（横向）
  const numStrings = 6;
  const numFrets = computeNumFrets(diagram);
  const boardWidth = fretGap * numFrets;
  const boardHeight = stringGap * (numStrings - 1);
  const width = marginLeft + boardWidth + marginRight;

  // 弦从上到下：1弦(index 0) → 6弦(index 5)
  // diagram.frets 数组顺序：index 0 = 6弦, index 5 = 1弦（高到低）
  // 渲染时需要反转：1弦在最上面
  const stringOrder = [5, 4, 3, 2, 1, 0]; // 渲染行 → frets 数组索引
  const stringLabels = [1, 2, 3, 4, 5, 6]; // 渲染行 → 弦号

  const optionalDots = Array.isArray(diagram.optionalDots) ? diagram.optionalDots : [];
  const barre = diagram.barre && typeof diagram.barre === 'object' ? diagram.barre : null;
  const isRootless = Boolean(diagram.rootless);

  const ariaLabel = isRootless ? `${diagram.title} (rootless)` : diagram.title;
  let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${ariaLabel}">`;
  svg += `<rect width="${width}" height="${height}" rx="14" fill="#F8FAFC"/>`;

  // 绘制品格竖线
  for (let f = 0; f <= numFrets; f++) {
    const x = marginLeft + f * fretGap;
    const stroke = f === 0 && diagram.baseFret === 1 ? '#0F172A' : '#CBD5E1';
    const strokeWidth = f === 0 && diagram.baseFret === 1 ? 3 : 1.5;
    svg += `<line x1="${x}" y1="${marginTop}" x2="${x}" y2="${marginTop + boardHeight}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
  }

  // 绘制品位编号（竖线之间居中）
  for (let f = 1; f <= numFrets; f++) {
    const fretNumber = diagram.baseFret === 1 ? f : (diagram.baseFret + f - 1);
    const x = marginLeft + (f - 0.5) * fretGap;
    const y = marginTop + boardHeight + 14;
    svg += `<text x="${x}" y="${y}" fill="#64748B" font-size="10" font-weight="700" text-anchor="middle">${fretNumber}</text>`;
  }

  // 绘制琴弦横线 + 弦号标签
  for (let row = 0; row < numStrings; row++) {
    const y = marginTop + row * stringGap;
    svg += `<line x1="${marginLeft}" y1="${y}" x2="${marginLeft + boardWidth}" y2="${y}" stroke="#64748B" stroke-width="1.5"/>`;
    // 弦号标在右侧
    const label = stringLabels[row];
    svg += `<text x="${marginLeft + boardWidth + 12}" y="${y + 4}" fill="#64748B" font-size="10" font-weight="600" text-anchor="middle">${label}</text>`;
  }

  // 绘制 barre 弧线（在圆点之前画，避免遮盖圆点）
  if (barre && Number.isFinite(barre.fret)) {
    const relFret = diagram.baseFret === 1 ? barre.fret : (barre.fret - diagram.baseFret + 1);
    if (relFret >= 1 && relFret <= numFrets) {
      const fromString = Math.min(barre.fromString, barre.toString);
      const toString = Math.max(barre.fromString, barre.toString);
      // string 1 在最上行，string 6 在最下行；row = string - 1
      const yTop = marginTop + (fromString - 1) * stringGap;
      const yBot = marginTop + (toString - 1) * stringGap;
      const cx = marginLeft + (relFret - 0.5) * fretGap;
      // 弧线：连接两个端点，弧顶向左
      const ctrlX = cx - 14;
      const ctrlY = (yTop + yBot) / 2;
      svg += `<path d="M ${cx} ${yTop} Q ${ctrlX} ${ctrlY} ${cx} ${yBot}" fill="none" stroke="#0F172A" stroke-width="2.5" stroke-linecap="round"/>`;
    }
  }

  // 绘制可选/参考音（浅灰圆点，无 label）
  for (const opt of optionalDots) {
    if (!opt || typeof opt !== 'object') continue;
    const { string, fret } = opt;
    if (!Number.isFinite(string) || !Number.isFinite(fret) || fret <= 0) continue;
    if (string < 1 || string > 6) continue;
    const relFret = diagram.baseFret === 1 ? fret : (fret - diagram.baseFret + 1);
    if (relFret < 1 || relFret > numFrets) continue;
    const row = string - 1;
    const y = marginTop + row * stringGap;
    const cx = marginLeft + (relFret - 0.5) * fretGap;
    svg += `<circle cx="${cx}" cy="${y}" r="7" fill="#CBD5E1" stroke="#94A3B8" stroke-width="1"/>`;
  }

  // 绘制音符圆点、X、O
  for (let row = 0; row < numStrings; row++) {
    const freqIdx = stringOrder[row];
    const fret = diagram.frets[freqIdx];
    const intervalLabel = diagram.intervalLabels?.[freqIdx] ?? '';
    const y = marginTop + row * stringGap;

    if (fret < 0) {
      // 静音：X 标在左侧品格外
      svg += `<text x="${marginLeft - 12}" y="${y + 4}" fill="#94A3B8" font-size="12" font-weight="700" text-anchor="middle">X</text>`;
      continue;
    }

    if (fret === 0) {
      // 空弦：O 标在左侧
      svg += `<text x="${marginLeft - 12}" y="${y + 4}" fill="#16A34A" font-size="12" font-weight="700" text-anchor="middle">O</text>`;
      continue;
    }

    const relativeFret = diagram.baseFret === 1 ? fret : (fret - diagram.baseFret + 1);
    if (relativeFret < 1 || relativeFret > numFrets) continue;

    const cx = marginLeft + (relativeFret - 0.5) * fretGap;
    const isRoot = !isRootless && intervalLabel === '1';
    const fillColor = isRoot ? '#DC2626' : '#1F2937';
    svg += `<circle cx="${cx}" cy="${y}" r="9" fill="${fillColor}"/>`;
    svg += `<text x="${cx}" y="${y + 4}" fill="#FFFFFF" font-size="9" font-weight="700" text-anchor="middle">${intervalLabel}</text>`;
  }

  svg += `</svg>`;
  return svg;
}
