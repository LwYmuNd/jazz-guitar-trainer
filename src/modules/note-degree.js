import { KEY_GROUPS, SCALE_TYPES, NOTES, NOTE_NAMES_FLAT, DEGREE_LABELS, DEGREE_LABELS_ROMAN, getScaleNotes, getSpelledScaleNotes, buildSemiToNameMap, shuffle } from '../core/music-theory.js';
import { createCustomSelect } from '../components/custom-select.js';

let state = { correct: 0, wrong: 0, currentAnswer: null, active: false, lastQuestion: null };
let degreeFormat = 'arabic';
let scaleRefVisible = false;
let selMode, selKey, selScale;

function getLabels(){ return degreeFormat === 'roman' ? DEGREE_LABELS_ROMAN : DEGREE_LABELS; }

function noteToSemitone(n){
  let idx = NOTES.indexOf(n);
  if(idx >= 0) return idx;
  return NOTE_NAMES_FLAT.indexOf(n);
}

function buildScaleGroups(){
  const cats = {};
  SCALE_TYPES.forEach(s => { if(!cats[s.cat]) cats[s.cat] = []; cats[s.cat].push(s); });
  return Object.entries(cats).map(([cat, scales]) => ({
    label: cat,
    options: scales.map(s => ({value: s.id, label: s.name}))
  }));
}

function buildKeyGroups(){
  return KEY_GROUPS.map(g => ({
    label: g.label,
    options: g.keys.map(k => ({value: k.root, label: k.name}))
  }));
}

export function initNoteDegree(){
  const container = document.getElementById('mod-noteDegree');
  container.innerHTML = `
    <div class="card">
      <h2>固定调音名级数反应练习</h2>
      <div class="controls" id="nd-controls"></div>
      <div class="nd-scale-ref" id="nd-scale-ref" style="display:none"></div>
      <div class="stats">
        <span>\u6B63\u786E: <b class="num" id="nd-correct">0</b></span>
        <span>\u9519\u8BEF: <b class="num" id="nd-wrong">0</b></span>
        <span>\u6B63\u786E\u7387: <b class="num" id="nd-rate">0%</b></span>
      </div>
      <div class="question-display" id="nd-question">--</div>
      <div class="options-grid" id="nd-options"></div>
      <div id="nd-feedback" style="text-align:center;padding:8px;font-size:.9rem;min-height:28px"></div>
    </div>`;

  const controls = document.getElementById('nd-controls');

  selMode = createCustomSelect('nd-mode', [{options:[
    {value:'name2deg',label:'\u97F3\u540D \u2192 \u7EA7\u6570'},
    {value:'deg2name',label:'\u7EA7\u6570 \u2192 \u97F3\u540D'},
  ]}], 'name2deg');
  controls.appendChild(selMode);

  selKey = createCustomSelect('nd-key', buildKeyGroups(), 'C');
  controls.appendChild(selKey);

  selScale = createCustomSelect('nd-scale', buildScaleGroups(), 'major');
  controls.appendChild(selScale);

  const toggle = document.createElement('div');
  toggle.className = 'degree-toggle';
  toggle.id = 'nd-degfmt';
  toggle.innerHTML = '<button class="active" data-fmt="arabic">阿拉伯数字</button><button data-fmt="roman">罗马数字</button>';
  controls.appendChild(toggle);

  const scaleRefBtn = document.createElement('button');
  scaleRefBtn.className = 'btn btn-secondary';
  scaleRefBtn.textContent = '显示音阶';
  scaleRefBtn.addEventListener('click', () => {
    scaleRefVisible = !scaleRefVisible;
    scaleRefBtn.textContent = scaleRefVisible ? '隐藏音阶' : '显示音阶';
    const refEl = document.getElementById('nd-scale-ref');
    if(scaleRefVisible){
      refEl.style.display = '';
      updateScaleRef();
    } else {
      refEl.style.display = 'none';
    }
  });
  controls.appendChild(scaleRefBtn);

  function updateScaleRef(){
    const refEl = document.getElementById('nd-scale-ref');
    if(!scaleRefVisible) return;
    const root = selKey.getValue();
    const scale = SCALE_TYPES.find(s => s.id === selScale.getValue());
    const spelledNotes = getSpelledScaleNotes(root, scale);
    const labels = getLabels();
    const degreeLabels = scale.intervals.map(i => labels[i]);
    refEl.innerHTML =
      '<div class="nd-scale-ref-row nd-scale-ref-notes">' + spelledNotes.map(n => `<span>${n}</span>`).join('') + '</div>' +
      '<div class="nd-scale-ref-row nd-scale-ref-degrees">' + degreeLabels.map(d => `<span>${d}</span>`).join('') + '</div>';
  }

  const startBtn = document.createElement('button');
  startBtn.className = 'btn btn-primary';
  startBtn.textContent = '\u5F00\u59CB\u7EC3\u4E60';
  startBtn.addEventListener('click', start);
  controls.appendChild(startBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn-secondary';
  nextBtn.textContent = '\u4E0B\u4E00\u9898';
  nextBtn.addEventListener('click', next);
  controls.appendChild(nextBtn);

  toggle.addEventListener('click', e => {
    const btn = e.target.closest('button[data-fmt]');
    if(!btn) return;
    toggle.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    degreeFormat = btn.dataset.fmt;
    updateScaleRef();
    if(state.active) next();
  });

  selKey.addEventListener('change', updateScaleRef);
  selScale.addEventListener('change', updateScaleRef);

  function start(){
    state = { correct: 0, wrong: 0, currentAnswer: null, active: true, lastQuestion: null };
    updateStats();
    next();
  }

  function next(){
    if(!state.active) return;
    const root = selKey.getValue();
    const scale = SCALE_TYPES.find(s => s.id === selScale.getValue());
    const notes = getScaleNotes(root, scale);
    const rootSemi = noteToSemitone(root);
    const nameMap = buildSemiToNameMap(root, scale);
    const mode = selMode.getValue();
    const labels = getLabels();

    let idx;
    let attempts = 0;
    do {
      idx = Math.floor(Math.random() * notes.length);
      attempts++;
    } while(idx === state.lastQuestion && notes.length > 1 && attempts < 20);
    state.lastQuestion = idx;

    const note = notes[idx];
    const semi = NOTES.indexOf(note);
    const degreeIdx = (semi - rootSemi + 12) % 12;
    const degree = labels[degreeIdx];
    const displayNote = nameMap ? (nameMap[semi] || note) : note;

    const qEl = document.getElementById('nd-question');
    const optEl = document.getElementById('nd-options');
    document.getElementById('nd-feedback').textContent = '';
    optEl.innerHTML = '';

    if(mode === 'name2deg'){
      qEl.textContent = displayNote;
      state.currentAnswer = degree;
      scale.intervals.map(i => labels[i]).forEach(d => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn';
        btn.textContent = d;
        btn.addEventListener('click', () => check(d, btn));
        optEl.appendChild(btn);
      });
    } else {
      qEl.textContent = degree;
      state.currentAnswer = displayNote;
      notes.map(n => {
        const s = NOTES.indexOf(n);
        return nameMap ? (nameMap[s] || n) : n;
      }).forEach(n => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn';
        btn.textContent = n;
        btn.addEventListener('click', () => check(n, btn));
        optEl.appendChild(btn);
      });
    }
  }

  function check(answer, btn){
    const fbEl = document.getElementById('nd-feedback');
    document.querySelectorAll('#nd-options .opt-btn').forEach(b => {
      b.style.pointerEvents = 'none';
      if(b.textContent === state.currentAnswer) b.classList.add('correct');
    });
    if(answer === state.currentAnswer){
      state.correct++;
      btn.classList.add('correct');
      fbEl.innerHTML = '<span style="color:var(--success)">\u6B63\u786E!</span>';
    } else {
      state.wrong++;
      btn.classList.add('wrong');
      fbEl.innerHTML = `<span style="color:var(--danger)">\u9519\u8BEF! \u6B63\u786E\u7B54\u6848: ${state.currentAnswer}</span>`;
    }
    updateStats();
    setTimeout(next, 1200);
  }

  function updateStats(){
    document.getElementById('nd-correct').textContent = state.correct;
    document.getElementById('nd-wrong').textContent = state.wrong;
    const total = state.correct + state.wrong;
    document.getElementById('nd-rate').textContent = total ? Math.round(state.correct / total * 100) + '%' : '0%';
  }
}
