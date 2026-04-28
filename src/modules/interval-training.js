import { createCustomSelect } from '../components/custom-select.js';
import { playPlaybackEvents } from '../core/audio-engine.js';
import {
  INTERVAL_OPTIONS,
  INTERVAL_TRAINING_TEMPLATES,
  EAR_TRAINING_ROOTS,
  buildIntervalPool,
  buildIntervalPlaybackEvents,
  createIntervalQuestion,
  getIntervalDefinition,
} from '../core/interval-ear-training.js';

const QUESTION_TYPE_LABELS = { melodic: 'Melodic Interval', harmonic: 'Harmonic Interval' };
const DIRECTION_LABELS = { ascending: 'Ascending', descending: 'Descending', random: 'Random' };

function createInitialState() {
  return {
    active: false,
    answered: false,
    correct: 0,
    wrong: 0,
    attempted: 0,
    currentQuestion: null,
    rootMode: 'random',
    selectedTemplateId: 'custom',
    config: createCustomConfig(),
  };
}

function cloneTemplateConfig(template) {
  return {
    intervalIds: [...template.intervalIds],
    questionType: template.questionType,
    direction: template.direction,
    optionCount: template.optionCount ?? 4,
    labelMode: template.labelMode ?? 'basic',
    randomRootIds: [],
  };
}

function createCustomConfig() {
  return {
    intervalIds: [],
    questionType: 'melodic',
    direction: 'ascending',
    optionCount: 4,
    labelMode: 'basic',
    randomRootIds: [],
  };
}

function renderFilterChips(items, selectedIds) {
  return items.map(item => `
    <button type="button" class="filter-chip ${selectedIds.includes(item.id) ? 'active' : ''}" data-root-id="${item.id}">
      ${item.label}
    </button>
  `).join('');
}

function buildTemplateGroups() {
  return [{
    label: 'Quick Templates',
    options: [
      { value: 'custom', label: 'Custom' },
      ...INTERVAL_TRAINING_TEMPLATES.map(t => ({ value: t.id, label: t.label })),
    ],
  }];
}

function buildRootGroups() {
  return [{ label: 'Chromatic Roots', options: EAR_TRAINING_ROOTS }];
}

function renderIntervalChips(items, selectedIds) {
  return items.map(item => `
    <button
      type="button"
      class="choice-chip ${selectedIds.includes(item.id) ? 'active' : ''}"
      data-id="${item.id}"
    >
      <span class="choice-chip-title">${item.label}</span>
      <span class="choice-chip-subtitle">${getIntervalDefinition(item.id)?.description || item.shortLabel}</span>
    </button>
  `).join('');
}

function renderFeedbackMarkup(question, isCorrect) {
  const toneClass = isCorrect ? 'is-correct' : 'is-wrong';
  const toneLabel = isCorrect ? 'Correct' : 'Answer';
  const def = question.definition;

  return `
    <div class="ear-feedback ${toneClass}">
      <div class="ear-feedback-head">
        <span class="ear-feedback-status">${toneLabel}</span>
        <strong>${def.label} (${def.shortLabel})</strong>
      </div>
      <p>${def.description}</p>
      <div class="ear-feedback-meta">
        <span><b>Root:</b> ${question.rootLabel}</span>
        <span><b>Target:</b> ${question.targetNote}</span>
        <span><b>Distance:</b> ${def.semitones} semitones</span>
        <span><b>Direction:</b> ${DIRECTION_LABELS[question.direction]}</span>
        <span><b>Type:</b> ${QUESTION_TYPE_LABELS[question.questionType]}</span>
      </div>
      <div class="ear-diagram-card">
        <div class="ear-diagram-head">
          <strong>试听所有选项</strong>
          <span>点击任意选项可播放对应音程</span>
        </div>
        <div class="ear-diagram-grid">
          ${question.optionIds.map((id, i) => {
            const optDef = question.optionDefinitions.find(d => d.id === id);
            const isCorrectOpt = id === question.correctOptionId;
            return `
              <div class="ear-diagram-option ${isCorrectOpt ? 'is-correct-option' : ''}">
                <div class="ear-diagram-option-head">
                  <strong>${question.optionLabels[i]}</strong>
                  <span>${optDef ? optDef.semitones + ' semitones' : ''}</span>
                </div>
                <button class="btn btn-secondary interval-preview-btn" data-option-id="${id}">🔊 试听</button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

export function initIntervalTraining() {
  const container = document.getElementById('mod-interval');
  if (!container) return;

  const state = createInitialState();
  let fixedRoot = 'C';

  if (state.config.questionType !== 'melodic') {
    state.config.questionType = 'melodic';
  }

  container.innerHTML = `
    <div class="card">
      <h2>音程练耳</h2>
      <p class="module-intro">训练音程距离感与和声色彩感，支持旋律音程与和声音程、上行/下行/随机方向、固定根音与随机根音。答题后可试听所有选项进行对比学习。</p>
      <div class="ear-config-panel">
        <div class="controls ear-controls" id="interval-controls"></div>
        <div class="ear-chip-section">
          <div class="ear-section-head">
            <h3>音程集合</h3>
            <span>Choose interval types for training</span>
          </div>
          <div class="choice-chip-grid" id="interval-pool-grid"></div>
        </div>
        <div class="ear-chip-section" id="interval-root-pool-section" hidden>
          <div class="ear-section-head">
            <h3>随机根音范围</h3>
            <span>不选则全随机</span>
          </div>
          <div class="filter-chip-grid" id="interval-root-pool-grid"></div>
        </div>
        <div class="ear-pool-preview" id="interval-preview"></div>
      </div>
      <div class="controls ear-action-controls">
        <button class="btn btn-primary" id="interval-start">开始训练</button>
        <button class="btn btn-secondary" id="interval-replay">重播</button>
        <button class="btn btn-secondary" id="interval-next" style="display:none">下一题</button>
      </div>
      <div class="stats">
        <span>正确: <b class="num" id="interval-correct">0</b></span>
        <span>错误: <b class="num" id="interval-wrong">0</b></span>
        <span>正确率: <b class="num" id="interval-rate">0%</b></span>
        <span>已答: <b class="num" id="interval-attempted">0</b></span>
      </div>
      <div class="question-display ear-question-display" id="interval-question"></div>
      <div class="options-grid ear-options-grid" id="interval-options"></div>
      <div class="ear-feedback-shell" id="interval-feedback">
        <div class="ear-feedback-placeholder">先配置题库，再开始训练。</div>
      </div>
    </div>
  `;

  const controls = document.getElementById('interval-controls');
  const poolGrid = document.getElementById('interval-pool-grid');
  const rootPoolSection = document.getElementById('interval-root-pool-section');
  const rootPoolGrid = document.getElementById('interval-root-pool-grid');
  const previewEl = document.getElementById('interval-preview');
  const questionEl = document.getElementById('interval-question');
  const optionsEl = document.getElementById('interval-options');
  const feedbackEl = document.getElementById('interval-feedback');
  const startButton = document.getElementById('interval-start');
  const replayButton = document.getElementById('interval-replay');
  const nextButton = document.getElementById('interval-next');

  const templateSelect = createCustomSelect('interval-template', buildTemplateGroups(), state.selectedTemplateId);
  controls.appendChild(templateSelect);

  const rootSelect = createCustomSelect('interval-root', buildRootGroups(), fixedRoot);
  controls.appendChild(rootSelect);

  const rootModeToggle = document.createElement('div');
  rootModeToggle.className = 'degree-toggle interval-toggle';
  rootModeToggle.innerHTML = `
    <button data-mode="fixed">固定根音</button>
    <button class="active" data-mode="random">随机根音</button>
  `;
  controls.appendChild(rootModeToggle);

  const questionTypeToggle = document.createElement('div');
  questionTypeToggle.className = 'degree-toggle interval-toggle';
  questionTypeToggle.innerHTML = `
    <button class="active" data-type="melodic">旋律音程</button>
    <button data-type="harmonic">和声音程</button>
  `;
  controls.appendChild(questionTypeToggle);

  const directionToggle = document.createElement('div');
  directionToggle.className = 'degree-toggle interval-toggle';
  directionToggle.innerHTML = `
    <button class="active" data-dir="ascending">上行</button>
    <button data-dir="descending">下行</button>
    <button data-dir="random">随机</button>
  `;
  controls.appendChild(directionToggle);

  function formatRandomRootSummary(selectedIds) {
    if (!selectedIds.length) return '全部根音';
    return EAR_TRAINING_ROOTS
      .filter(r => selectedIds.includes(r.value))
      .map(r => r.label)
      .join(' · ');
  }

  function updatePreview() {
    const pool = buildIntervalPool(state.config);
    startButton.disabled = state.config.intervalIds.length === 0;

    if (!state.config.intervalIds.length) {
      previewEl.innerHTML = `
        <div class="ear-preview-head"><strong>Current Pool</strong><span>0 intervals</span></div>
        <div class="ear-preview-empty">请至少选择一个音程开始训练。</div>
      `;
      return;
    }

    const labels = pool.map(id => getIntervalDefinition(id)?.label ?? id);
    const typeLabel = QUESTION_TYPE_LABELS[state.config.questionType] ?? state.config.questionType;
    const dirLabel = DIRECTION_LABELS[state.config.direction] ?? state.config.direction;
    previewEl.innerHTML = `
      <div class="ear-preview-head">
        <strong>Current Pool</strong>
        <span>${pool.length} intervals · ${typeLabel} · ${dirLabel}</span>
      </div>
      <div class="ear-preview-meta">
        ${state.rootMode === 'random' ? `<span>根音范围: ${formatRandomRootSummary(state.config.randomRootIds)}</span>` : `<span>固定根音: ${fixedRoot}</span>`}
      </div>
      <div class="ear-preview-list">${labels.join(' · ')}</div>
    `;
  }

  function refreshPoolGrid() {
    poolGrid.innerHTML = renderIntervalChips(INTERVAL_OPTIONS, state.config.intervalIds);
    rootPoolSection.hidden = state.rootMode !== 'random';
    if (state.rootMode === 'random') {
      rootPoolGrid.innerHTML = renderFilterChips(
        EAR_TRAINING_ROOTS.map(r => ({ id: r.value, label: r.label })),
        state.config.randomRootIds,
      );
    }
    updatePreview();
  }

  function updateStats() {
    const total = state.correct + state.wrong;
    const rate = total > 0 ? Math.round((state.correct / total) * 100) : 0;
    document.getElementById('interval-correct').textContent = state.correct;
    document.getElementById('interval-wrong').textContent = state.wrong;
    document.getElementById('interval-rate').textContent = rate + '%';
    document.getElementById('interval-attempted').textContent = state.attempted;
  }

  function playCurrentQuestion() {
    if (!state.currentQuestion) return;
    const events = buildIntervalPlaybackEvents(
      state.currentQuestion.audioNotes,
      state.currentQuestion.questionType,
    );
    playPlaybackEvents(events);
  }

  function playOptionPreview(question, optionId) {
    const optDef = question.optionDefinitions.find(d => d.id === optionId);
    if (!optDef) return;
    const rootMidi = question.rootMidi;
    const targetMidi = question.direction === 'descending'
      ? rootMidi - optDef.semitones
      : rootMidi + optDef.semitones;
    const PLAYBACK = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const toName = (midi) => `${PLAYBACK[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
    const audioNotes = [toName(rootMidi), toName(targetMidi)];
    const events = buildIntervalPlaybackEvents(audioNotes, question.questionType);
    playPlaybackEvents(events);
  }

  function renderQuestion() {
    const q = state.currentQuestion;
    if (!q) return;
    const dirLabel = DIRECTION_LABELS[q.direction] || q.direction;
    const typeLabel = QUESTION_TYPE_LABELS[q.questionType] || q.questionType;

    questionEl.innerHTML = `
      <div class="ear-prompt">
        <span class="ear-prompt-kicker">
          Question ${state.attempted + 1} · ${typeLabel} · ${dirLabel} · ${q.optionIds.length} 选项
        </span>
        <strong>Listen</strong>
        <p>听这两个音之间是什么音程？</p>
      </div>
    `;

    optionsEl.innerHTML = q.optionIds.map(id => {
      const label = q.optionLabels[q.optionIds.indexOf(id)];
      return `<button class="opt-btn" data-option-id="${id}">${label}</button>`;
    }).join('');

    feedbackEl.innerHTML = '<div class="ear-feedback-placeholder">先听，再选。</div>';
    nextButton.style.display = 'none';
  }

  function handleAnswer(selectedId) {
    if (state.answered) return;
    state.answered = true;
    state.attempted++;

    const q = state.currentQuestion;
    const isCorrect = selectedId === q.correctOptionId;

    if (isCorrect) { state.correct++; } else { state.wrong++; }
    updateStats();

    optionsEl.querySelectorAll('.opt-btn').forEach(btn => {
      const id = btn.dataset.optionId;
      btn.disabled = true;
      if (id === q.correctOptionId) {
        btn.classList.add('correct');
      } else if (id === selectedId && !isCorrect) {
        btn.classList.add('wrong');
      }
    });

    feedbackEl.innerHTML = renderFeedbackMarkup(q, isCorrect);

    feedbackEl.querySelectorAll('.interval-preview-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const optId = btn.dataset.optionId;
        playOptionPreview(q, optId);
      });
    });

    nextButton.style.display = '';
  }

  function startQuestion() {
    const prev = state.currentQuestion?.signature ?? null;
    state.currentQuestion = createIntervalQuestion({
      config: state.config,
      rootMode: state.rootMode,
      fixedRoot,
      previousSignature: prev,
    });
    state.answered = false;
    state.active = true;
    renderQuestion();
    playCurrentQuestion();
  }

  templateSelect.addEventListener('change', e => {
    const nextTemplateId = e.detail.value;
    state.selectedTemplateId = nextTemplateId;

    if (nextTemplateId === 'custom') {
      state.config = createCustomConfig();
    } else {
      const tpl = INTERVAL_TRAINING_TEMPLATES.find(t => t.id === nextTemplateId);
      if (!tpl) return;
      state.config = cloneTemplateConfig(tpl);
    }

    state.config.questionType = 'melodic';
    state.rootMode = 'random';
    refreshPoolGrid();

    rootModeToggle.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === 'random');
    });
    rootSelect.setDisabled(true);

    questionTypeToggle.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === 'melodic');
    });
    directionToggle.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.dir === state.config.direction);
    });
  });

  rootSelect.addEventListener('change', e => {
    fixedRoot = e.detail.value;
    updatePreview();
  });

  rootModeToggle.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    state.rootMode = btn.dataset.mode;
    rootModeToggle.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    rootSelect.setDisabled(state.rootMode === 'random');
    refreshPoolGrid();
  });

  questionTypeToggle.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    state.config.questionType = btn.dataset.type;
    questionTypeToggle.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updatePreview();
  });

  directionToggle.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    state.config.direction = btn.dataset.dir;
    directionToggle.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updatePreview();
  });

  poolGrid.addEventListener('click', e => {
    const btn = e.target.closest('.choice-chip');
    if (!btn) return;
    const id = btn.dataset.id;
    if (state.config.intervalIds.includes(id)) {
      state.config.intervalIds = state.config.intervalIds.filter(x => x !== id);
    } else {
      state.config.intervalIds.push(id);
    }
    btn.classList.toggle('active');
    updatePreview();

    if (state.selectedTemplateId !== 'custom') {
      state.selectedTemplateId = 'custom';
      templateSelect.setValue('custom');
    }
  });

  rootPoolGrid.addEventListener('click', e => {
    const btn = e.target.closest('.filter-chip');
    if (!btn) return;
    const id = btn.dataset.rootId;
    if (state.config.randomRootIds.includes(id)) {
      state.config.randomRootIds = state.config.randomRootIds.filter(x => x !== id);
    } else {
      state.config.randomRootIds.push(id);
    }
    btn.classList.toggle('active');
    updatePreview();

    if (state.selectedTemplateId !== 'custom') {
      state.selectedTemplateId = 'custom';
      templateSelect.setValue('custom');
    }
  });

  optionsEl.addEventListener('click', e => {
    const btn = e.target.closest('.opt-btn');
    if (!btn || state.answered) return;
    handleAnswer(btn.dataset.optionId);
  });

  startButton.addEventListener('click', () => {
    state.correct = 0;
    state.wrong = 0;
    state.attempted = 0;
    updateStats();
    startQuestion();
  });

  replayButton.addEventListener('click', () => {
    playCurrentQuestion();
  });

  nextButton.addEventListener('click', () => {
    startQuestion();
  });

  rootSelect.setDisabled(true);
  refreshPoolGrid();
  updateStats();

}
