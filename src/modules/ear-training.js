import { renderChordDiagramSVG } from '../core/chord-diagram-renderer.js';
import { createCustomSelect } from '../components/custom-select.js';
import { playPlaybackEvents } from '../core/audio-engine.js';
import {
  BASE_CHORD_TYPES,
  TENSION_OPTIONS,
  TRAINING_TEMPLATES,
  VOICING_FAMILY_OPTIONS,
  VOICING_OPTIONS,
  buildChordPool,
  buildChordNotes,
  buildPlaybackEvents,
  createQuestion,
  EAR_TRAINING_ROOTS,
  getAnswerModeContext,
  getAvailableRandomVoicingOptionIds,
  getAvailableVoicingOptionIds,
  getChordDefinition,
} from '../core/chord-ear-training.js';

const QUESTION_DELAY_MS = 1400;
const PLAYBACK_MODE_LABELS = {
  chord: '和弦',
  arpeggio: '琶音',
  both: '先琶音后和弦',
};
const VOICING_FAMILY_LABELS = Object.fromEntries(
  VOICING_FAMILY_OPTIONS.map(option => [option.id, option.label]),
);
const ANSWER_MODE_LABELS = {
  chord: '和弦',
  root: '根音',
  inversion: '转位',
};
const VOICING_MODE_LABELS = Object.fromEntries(
  VOICING_OPTIONS.map(option => [option.id, option.label]),
);

function cloneTemplateConfig(template){
  return {
    baseChordIds: [...template.baseChordIds],
    tensionIds: [...template.tensionIds],
    playbackMode: template.playbackMode,
    voicingFamily: template.voicingFamily ?? 'close',
    voicingMode: template.voicingMode ?? 'close-root',
    randomRootIds: [],
    randomVoicingIds: [],
  };
}

function createCustomConfig(){
  return {
    baseChordIds: [],
    tensionIds: [],
    playbackMode: 'chord',
    voicingFamily: 'close',
    voicingMode: 'close-root',
    randomRootIds: [],
    randomVoicingIds: [],
  };
}

function createInitialState(){
  return {
    active: false,
    answered: false,
    correct: 0,
    wrong: 0,
    attempted: 0,
    currentQuestion: null,
    autoNext: false,
    rootMode: 'fixed',
    selectedTemplateId: 'custom',
    config: createCustomConfig(),
    nextTimer: null,
  };
}

function buildTemplateGroups(){
  return [{
    label: 'Quick Templates',
    options: [
      { value: 'custom', label: 'Custom' },
      ...TRAINING_TEMPLATES.map(template => ({
        value: template.id,
        label: template.label,
      })),
    ],
  }];
}

function buildRootGroups(){
  return [{
    label: 'Chromatic Roots',
    options: EAR_TRAINING_ROOTS,
  }];
}

function getPromptText(answerMode){
  return {
    chord: 'Identify the chord quality from the current configuration.',
    root: 'Identify the root from the current configuration.',
    inversion: 'Identify the inversion from the current configuration.',
  }[answerMode];
}

function renderQuestionPrompt(questionNumber, playbackMode, voicingFamily, voicingMode, answerMode, optionCount){
  return `
    <div class="ear-prompt">
      <span class="ear-prompt-kicker">
        Question ${questionNumber} · ${PLAYBACK_MODE_LABELS[playbackMode]} · ${VOICING_FAMILY_LABELS[voicingFamily]} · ${VOICING_MODE_LABELS[voicingMode]} · 识别${ANSWER_MODE_LABELS[answerMode]} · ${optionCount} Options
      </span>
      <strong>Listen</strong>
      <p>${getPromptText(answerMode)}</p>
    </div>
  `;
}

function renderDiagramFigure(diagram){
  const bodyMarkup = diagram.kind === 'dynamic'
    ? `
      <div class="ear-diagram-image-wrap is-dynamic">
        ${renderChordDiagramSVG(diagram)}
      </div>
    `
    : `
      <div class="ear-diagram-image-wrap">
        <img
          class="ear-diagram-image"
          src="${import.meta.env.BASE_URL}chords/${diagram.image}"
          alt="${diagram.title}"
        >
      </div>
    `;

  return `
    <article class="ear-diagram-option">
      <div class="ear-diagram-option-head">
        <strong>${diagram.stringSetLabel ? `${diagram.stringSetLabel} 弦组` : diagram.title}</strong>
        ${diagram.stringSetLabel ? `<span>${diagram.title}</span>` : ''}
      </div>
      ${bodyMarkup}
      <p class="ear-diagram-caption">${diagram.caption}</p>
    </article>
  `;
}

function renderDiagramMarkup(question){
  const diagrams = question.diagrams?.length
    ? question.diagrams
    : (question.diagram ? [question.diagram] : []);

  if(!diagrams.length){
    return '';
  }

  return `
    <div class="ear-diagram-card">
      <div class="ear-diagram-head">
        <strong>Voicing Reference</strong>
        <span>${diagrams.length} Variations · 圆点显示音程，左侧显示品位</span>
      </div>
      <div class="ear-diagram-grid">
        ${diagrams.map(renderDiagramFigure).join('')}
      </div>
    </div>
  `;
}

function renderFeedbackMarkup(question, isCorrect){
  const toneClass = isCorrect ? 'is-correct' : 'is-wrong';
  const toneLabel = isCorrect ? 'Correct' : 'Answer';
  const tensionText = question.definition.tensions.length
    ? question.definition.tensions.join(' / ')
    : 'None';

  return `
    <div class="ear-feedback ${toneClass}">
      <div class="ear-feedback-head">
        <span class="ear-feedback-status">${toneLabel}</span>
        <strong>${question.label}</strong>
      </div>
      <p>${question.definition.description}</p>
      <div class="ear-feedback-meta">
        <span><b>Notes:</b> ${question.noteLabels.join(' · ')}</span>
        <span><b>Tensions:</b> ${tensionText}</span>
        <span><b>Voicing Family:</b> ${question.voicingFamilyLabel}</span>
        <span><b>Voicing:</b> ${question.voicingLabel}</span>
        <span><b>Target:</b> ${ANSWER_MODE_LABELS[question.answerMode]}</span>
      </div>
      <div class="ear-feedback-context">${PLAYBACK_MODE_LABELS[question.playbackMode]} playback · ${question.voicingLabel}</div>
      ${renderDiagramMarkup(question)}
      <div class="ear-diagram-card">
        <div class="ear-diagram-head">
          <strong>试听所有选项</strong>
          <span>点击任意选项可播放对应和弦</span>
        </div>
        <div class="ear-diagram-grid">
          ${question.optionIds.map((id, i) => {
            const isCorrectOpt = id === question.correctOptionId;
            return `
              <div class="ear-diagram-option ${isCorrectOpt ? 'is-correct-option' : ''}">
                <div class="ear-diagram-option-head">
                  <strong>${question.optionLabels[i]}</strong>
                </div>
                <button class="btn btn-secondary chord-preview-btn" data-option-id="${id}">🔊 试听</button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderChipButtons(items, selectedIds, kind){
  return items.map(item => `
    <button
      type="button"
      class="choice-chip ${selectedIds.includes(item.id) ? 'active' : ''}"
      data-kind="${kind}"
      data-id="${item.id}"
    >
      <span class="choice-chip-title">${item.label}</span>
      <span class="choice-chip-subtitle">${item.description}</span>
    </button>
  `).join('');
}

function renderFilterChips(items, selectedIds, kind){
  return items.map(item => `
    <button
      type="button"
      class="filter-chip ${selectedIds.includes(item.id) ? 'active' : ''}"
      data-kind="${kind}"
      data-id="${item.id}"
    >
      ${item.label}
    </button>
  `).join('');
}

function toggleRequiredListValue(list, value){
  if(list.includes(value)){
    if(list.length === 1) return list;
    return list.filter(item => item !== value);
  }
  return [...list, value];
}

function toggleOptionalListValue(list, value){
  if(list.includes(value)){
    return list.filter(item => item !== value);
  }
  return [...list, value];
}

function formatRandomRootSummary(selectedIds){
  if(!selectedIds.length) return '全部根音';
  return EAR_TRAINING_ROOTS
    .filter(root => selectedIds.includes(root.value))
    .map(root => root.label)
    .join(' · ');
}

function formatRandomVoicingSummary(selectedIds){
  if(!selectedIds.length) return '全部可用转位';
  return VOICING_OPTIONS
    .filter(option => selectedIds.includes(option.id))
    .map(option => option.label)
    .join(' · ');
}

export function initEarTraining(){
  const container = document.getElementById('mod-earTraining');
  const state = createInitialState();

  container.innerHTML = `
    <div class="card">
      <h2>和弦练耳</h2>
      <p class="module-intro">模板只是起点，核心是自己配置 base chord、单个 tension、播放方式、voicing family 和转位。当前版本先支持封闭、Drop 2、Drop 3，并在答题后给出对应弹法参考图。</p>
      <div class="ear-config-panel">
        <div class="controls ear-controls" id="et-controls"></div>
        <div class="ear-chip-section">
          <div class="ear-section-head">
            <h3>Base Chords</h3>
            <span>三和弦、6 和弦、7 和弦都可以进题库</span>
          </div>
          <div class="choice-chip-grid" id="et-base-grid"></div>
        </div>
        <div class="ear-chip-section">
          <div class="ear-section-head">
            <h3>Tension</h3>
            <span>每道题只会取一个 tension，比如 none、♭9、9、♯9</span>
          </div>
          <div class="choice-chip-grid" id="et-ext-grid"></div>
        </div>
        <div class="ear-chip-section" id="et-root-pool-section" hidden>
          <div class="ear-section-head">
            <h3>随机根音范围</h3>
            <span>不选则全随机；如果当前只剩一个和弦答案，会改成根音辨识</span>
          </div>
          <div class="filter-chip-grid" id="et-root-pool-grid"></div>
        </div>
        <div class="ear-chip-section" id="et-voicing-pool-section" hidden>
          <div class="ear-section-head">
            <h3>随机转位范围</h3>
            <span>不选则当前可用转位全随机；如果当前只剩一个和弦答案，会改成转位辨识</span>
          </div>
          <div class="filter-chip-grid" id="et-voicing-pool-grid"></div>
        </div>
        <div class="ear-pool-preview" id="et-preview"></div>
      </div>
      <div class="controls ear-action-controls">
        <button class="btn btn-primary" id="et-start">开始训练</button>
        <button class="btn btn-secondary" id="et-replay">重播</button>
        <button class="btn btn-secondary" id="et-replay-arpeggio">重播琶音</button>
        <button class="btn btn-secondary" id="et-next">下一题</button>
      </div>
      <div class="stats">
        <span>正确: <b class="num" id="et-correct">0</b></span>
        <span>错误: <b class="num" id="et-wrong">0</b></span>
        <span>正确率: <b class="num" id="et-rate">0%</b></span>
        <span>已答: <b class="num" id="et-attempted">0</b></span>
      </div>
      <div class="question-display ear-question-display" id="et-question"></div>
      <div class="options-grid ear-options-grid" id="et-options"></div>
      <div class="ear-feedback-shell" id="et-feedback">
        <div class="ear-feedback-placeholder">先配置题库，再开始训练。</div>
      </div>
    </div>
  `;

  const controls = document.getElementById('et-controls');
  const baseGrid = document.getElementById('et-base-grid');
  const extGrid = document.getElementById('et-ext-grid');
  const rootPoolSection = document.getElementById('et-root-pool-section');
  const rootPoolGrid = document.getElementById('et-root-pool-grid');
  const voicingPoolSection = document.getElementById('et-voicing-pool-section');
  const voicingPoolGrid = document.getElementById('et-voicing-pool-grid');
  const previewEl = document.getElementById('et-preview');
  const questionEl = document.getElementById('et-question');
  const optionsEl = document.getElementById('et-options');
  const feedbackEl = document.getElementById('et-feedback');

  const templateSelect = createCustomSelect('et-template', buildTemplateGroups(), state.selectedTemplateId);
  controls.appendChild(templateSelect);

  const rootSelect = createCustomSelect('et-root', buildRootGroups(), 'C');
  controls.appendChild(rootSelect);

  const rootModeToggle = document.createElement('div');
  rootModeToggle.className = 'degree-toggle';
  rootModeToggle.id = 'et-root-mode';
  rootModeToggle.innerHTML = `
    <button class="active" data-mode="fixed">固定根音</button>
    <button data-mode="random">随机根音</button>
  `;
  controls.appendChild(rootModeToggle);

  const playbackToggle = document.createElement('div');
  playbackToggle.className = 'degree-toggle degree-toggle-wide';
  playbackToggle.id = 'et-playback-mode';
  playbackToggle.innerHTML = `
    <button class="active" data-playback="chord">和弦</button>
    <button data-playback="arpeggio">琶音</button>
    <button data-playback="both">先琶音后和弦</button>
  `;
  controls.appendChild(playbackToggle);

  const voicingFamilyToggle = document.createElement('div');
  voicingFamilyToggle.className = 'degree-toggle degree-toggle-wide';
  voicingFamilyToggle.id = 'et-voicing-family';
  voicingFamilyToggle.innerHTML = `
    <button class="active" data-family="close">封闭</button>
    <button data-family="drop2">Drop 2</button>
    <button data-family="drop3">Drop 3</button>
  `;
  controls.appendChild(voicingFamilyToggle);

  const voicingToggle = document.createElement('div');
  voicingToggle.className = 'degree-toggle degree-toggle-wide';
  voicingToggle.id = 'et-voicing-mode';
  voicingToggle.innerHTML = `
    <button class="active" data-voicing="close-root">原位</button>
    <button data-voicing="close-first">一转</button>
    <button data-voicing="close-second">二转</button>
    <button data-voicing="close-third">三转</button>
    <button data-voicing="close-random">随机</button>
  `;
  controls.appendChild(voicingToggle);

  const autoNextToggle = document.createElement('div');
  autoNextToggle.className = 'degree-toggle';
  autoNextToggle.id = 'et-auto-next';
  autoNextToggle.innerHTML = `
    <button class="active" data-auto="off">手动下一题</button>
    <button data-auto="on">自动下一题</button>
  `;
  controls.appendChild(autoNextToggle);

  const startButton = document.getElementById('et-start');
  const replayButton = document.getElementById('et-replay');
  const replayArpeggioButton = document.getElementById('et-replay-arpeggio');
  const nextButton = document.getElementById('et-next');

  function clearNextTimer(){
    if(state.nextTimer){
      clearTimeout(state.nextTimer);
      state.nextTimer = null;
    }
  }

  function getCurrentPool(){
    return buildChordPool(state.config);
  }

  function getAnswerContext(){
    return getAnswerModeContext({
      config: state.config,
      rootMode: state.rootMode,
      fixedRoot: rootSelect.getValue(),
    });
  }

  function normalizeConfig(nextConfig){
    const availableVoicingIds = getAvailableVoicingOptionIds(nextConfig);
    const availableRandomVoicingIds = getAvailableRandomVoicingOptionIds(nextConfig);
    const fallbackVoicingId = availableVoicingIds[0] ?? 'close-root';

    return {
      ...nextConfig,
      voicingFamily: nextConfig.voicingFamily ?? 'close',
      voicingMode: availableVoicingIds.includes(nextConfig.voicingMode)
        ? nextConfig.voicingMode
        : fallbackVoicingId,
      randomRootIds: (nextConfig.randomRootIds ?? [])
        .filter(rootId => EAR_TRAINING_ROOTS.some(root => root.value === rootId)),
      randomVoicingIds: (nextConfig.randomVoicingIds ?? [])
        .filter(optionId => availableRandomVoicingIds.includes(optionId)),
    };
  }

  function setTemplateSelection(templateId){
    state.selectedTemplateId = templateId;
    templateSelect.setValue(templateId);
  }

  function markAsCustom(){
    setTemplateSelection('custom');
  }

  function updateStats(){
    document.getElementById('et-correct').textContent = state.correct;
    document.getElementById('et-wrong').textContent = state.wrong;
    document.getElementById('et-attempted').textContent = state.attempted;
    const rate = state.attempted
      ? Math.round((state.correct / state.attempted) * 100)
      : 0;
    document.getElementById('et-rate').textContent = `${rate}%`;
  }

  function updatePreview(){
    const pool = getCurrentPool();
    const answerContext = getAnswerContext();
    rootSelect.setDisabled(state.rootMode === 'random');
    startButton.disabled = pool.length === 0;

    if(!pool.length){
      previewEl.innerHTML = `
        <div class="ear-preview-head">
          <strong>Current Pool</strong>
          <span>0 chords · ${PLAYBACK_MODE_LABELS[state.config.playbackMode]} · 识别${ANSWER_MODE_LABELS[answerContext.answerMode]}</span>
        </div>
        <div class="ear-preview-empty">当前选择没有生成出有效题目，请至少保留一个兼容的 base chord + tension + voicing family 组合。</div>
      `;
      return;
    }

    const labels = pool.map(chordId => getChordDefinition(chordId).answerLabel);
    previewEl.innerHTML = `
      <div class="ear-preview-head">
        <strong>Current Pool</strong>
        <span>${pool.length} chords · ${PLAYBACK_MODE_LABELS[state.config.playbackMode]} · 识别${ANSWER_MODE_LABELS[answerContext.answerMode]}</span>
      </div>
      <div class="ear-preview-meta">
        <span>Voicing Family: ${VOICING_FAMILY_LABELS[state.config.voicingFamily]}</span>
        <span>转位: ${VOICING_MODE_LABELS[state.config.voicingMode]}</span>
        ${state.rootMode === 'random' ? `<span>根音范围: ${formatRandomRootSummary(state.config.randomRootIds)}</span>` : ''}
        ${state.config.voicingMode === 'close-random' ? `<span>转位范围: ${formatRandomVoicingSummary(state.config.randomVoicingIds)}</span>` : ''}
      </div>
      <div class="ear-preview-list">${labels.join(' · ')}</div>
    `;
  }

  function renderConfigChips(){
    const availableVoicingIds = getAvailableVoicingOptionIds(state.config);
    const availableRandomVoicingIds = getAvailableRandomVoicingOptionIds(state.config);

    baseGrid.innerHTML = renderChipButtons(BASE_CHORD_TYPES, state.config.baseChordIds, 'base');
    extGrid.innerHTML = renderChipButtons(TENSION_OPTIONS, state.config.tensionIds, 'tension');

    rootPoolSection.hidden = state.rootMode !== 'random';
    rootPoolGrid.innerHTML = state.rootMode === 'random'
      ? renderFilterChips(
        EAR_TRAINING_ROOTS.map(root => ({ id: root.value, label: root.label })),
        state.config.randomRootIds,
        'random-root',
      )
      : '';

    voicingPoolSection.hidden = state.config.voicingMode !== 'close-random';
    voicingPoolGrid.innerHTML = state.config.voicingMode === 'close-random'
      ? renderFilterChips(
        VOICING_OPTIONS
          .filter(option => availableRandomVoicingIds.includes(option.id))
          .map(option => ({ id: option.id, label: option.label })),
        state.config.randomVoicingIds,
        'random-voicing',
      )
      : '';

    playbackToggle.querySelectorAll('button').forEach(button => {
      button.classList.toggle('active', button.dataset.playback === state.config.playbackMode);
    });

    voicingFamilyToggle.querySelectorAll('button').forEach(button => {
      button.classList.toggle('active', button.dataset.family === state.config.voicingFamily);
    });

    voicingToggle.querySelectorAll('button').forEach(button => {
      const isAvailable = availableVoicingIds.includes(button.dataset.voicing);
      button.disabled = !isAvailable;
      button.classList.toggle('is-disabled', !isAvailable);
      button.classList.toggle('active', button.dataset.voicing === state.config.voicingMode);
    });

    updatePreview();
  }

  function renderOptions(question){
    optionsEl.innerHTML = '';

    question.optionIds.forEach((optionId, index) => {
      const button = document.createElement('button');
      button.className = 'opt-btn';
      button.type = 'button';
      button.textContent = question.optionLabels[index];
      button.dataset.optionId = optionId;
      button.addEventListener('click', () => handleAnswer(optionId, button));
      optionsEl.appendChild(button);
    });
  }

  function renderQuestion(question){
    questionEl.innerHTML = renderQuestionPrompt(
      state.attempted + 1,
      state.config.playbackMode,
      question.voicingFamily,
      question.voicingMode,
      question.answerMode,
      question.optionIds.length,
    );
    feedbackEl.innerHTML = '<div class="ear-feedback-placeholder">先听，再选。</div>';
    renderOptions(question);
  }

  async function playCurrentQuestion(playbackMode = state.config.playbackMode){
    if(!state.currentQuestion) return;
    const events = buildPlaybackEvents(state.currentQuestion.audioNotes, playbackMode);
    await playPlaybackEvents(events);
  }

  function showEmptyPoolState(){
    clearNextTimer();
    state.active = false;
    state.answered = false;
    state.currentQuestion = null;
    const answerContext = getAnswerContext();
    questionEl.innerHTML = renderQuestionPrompt(
      1,
      state.config.playbackMode,
      state.config.voicingFamily,
      state.config.voicingMode,
      answerContext.answerMode,
      0,
    );
    optionsEl.innerHTML = '';
    feedbackEl.innerHTML = '<div class="ear-feedback-placeholder">当前配置没有可用题目，请先调整题库。</div>';
  }

  async function loadNextQuestion(){
    clearNextTimer();
    state.answered = false;
    state.currentQuestion = createQuestion({
      config: state.config,
      rootMode: state.rootMode,
      fixedRoot: rootSelect.getValue(),
      previousSignature: state.currentQuestion?.signature ?? null,
    });
    state.currentQuestion.playbackMode = state.config.playbackMode;
    renderQuestion(state.currentQuestion);
    await playCurrentQuestion();
  }

  async function startSession(){
    if(!getCurrentPool().length){
      showEmptyPoolState();
      return;
    }

    clearNextTimer();
    state.active = true;
    state.answered = false;
    state.correct = 0;
    state.wrong = 0;
    state.attempted = 0;
    state.currentQuestion = null;
    updateStats();
    await loadNextQuestion();
  }

  function lockOptionButtons(){
    optionsEl.querySelectorAll('.opt-btn').forEach(button => {
      button.disabled = true;
      button.style.pointerEvents = 'none';
    });
  }

  function markCorrectAnswer(question){
    optionsEl.querySelectorAll('.opt-btn').forEach(button => {
      if(button.dataset.optionId === question.correctOptionId){
        button.classList.add('correct');
      }
    });
  }

  function scheduleNextQuestion(){
    if(!state.autoNext) return;
    clearNextTimer();
    state.nextTimer = setTimeout(() => {
      state.nextTimer = null;
      loadNextQuestion();
    }, QUESTION_DELAY_MS);
  }

  function handleAnswer(optionId, button){
    if(!state.active || state.answered || !state.currentQuestion) return;

    state.answered = true;
    state.attempted += 1;

    const isCorrect = optionId === state.currentQuestion.correctOptionId;
    if(isCorrect){
      state.correct += 1;
      button.classList.add('correct');
    } else {
      state.wrong += 1;
      button.classList.add('wrong');
    }

    lockOptionButtons();
    markCorrectAnswer(state.currentQuestion);
    updateStats();
    feedbackEl.innerHTML = renderFeedbackMarkup(state.currentQuestion, isCorrect);

    feedbackEl.querySelectorAll('.chord-preview-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const optId = btn.dataset.optionId;
        playOptionPreview(state.currentQuestion, optId);
      });
    });

    scheduleNextQuestion();
  }

  async function playOptionPreview(question, optionId){
    const { answerMode, root, chordId, voicingFamily, voicingMode, inversion, playbackMode } = question;

    let previewRoot = root;
    let previewChordId = chordId;
    let previewVoicingMode = voicingMode;

    if(answerMode === 'root'){
      previewRoot = optionId;
    } else if(answerMode === 'inversion'){
      previewVoicingMode = optionId;
    } else {
      previewChordId = optionId;
    }

    const chord = buildChordNotes(previewRoot, previewChordId, {
      baseOctave: 3,
      voicingFamily,
      voicingMode: previewVoicingMode,
      randomVoicingIds: state.config.randomVoicingIds,
      randomFn: Math.random,
    });

    const events = buildPlaybackEvents(chord.audioNotes, playbackMode);
    await playPlaybackEvents(events);
  }

  function restartIfActive(){
    if(!getCurrentPool().length){
      updatePreview();
      showEmptyPoolState();
      return;
    }

    if(state.active){
      startSession();
      return;
    }

    updatePreview();
    const answerContext = getAnswerContext();
    questionEl.innerHTML = renderQuestionPrompt(
      1,
      state.config.playbackMode,
      state.config.voicingFamily,
      state.config.voicingMode,
      answerContext.answerMode,
      answerContext.optionIds.length,
    );
  }

  function applyTemplate(templateId){
    const template = TRAINING_TEMPLATES.find(item => item.id === templateId);
    if(!template) return;
    state.config = normalizeConfig(cloneTemplateConfig(template));
    setTemplateSelection(template.id);
    renderConfigChips();
    restartIfActive();
  }

  function handleConfigMutation(updater){
    state.config = normalizeConfig(updater(state.config));
    markAsCustom();
    renderConfigChips();
    restartIfActive();
  }

  startButton.addEventListener('click', () => {
    startSession();
  });

  replayButton.addEventListener('click', () => {
    playCurrentQuestion();
  });

  replayArpeggioButton.addEventListener('click', () => {
    playCurrentQuestion('arpeggio');
  });

  nextButton.addEventListener('click', () => {
    if(!state.active){
      startSession();
      return;
    }
    loadNextQuestion();
  });

  templateSelect.addEventListener('change', event => {
    const nextValue = event.detail?.value ?? templateSelect.getValue();
    if(nextValue === 'custom'){
      setTemplateSelection('custom');
      state.config = normalizeConfig(createCustomConfig());
      renderConfigChips();
      restartIfActive();
      return;
    }
    applyTemplate(nextValue);
  });

  rootSelect.addEventListener('change', () => {
    restartIfActive();
  });

  rootModeToggle.addEventListener('click', event => {
    const toggleButton = event.target.closest('button[data-mode]');
    if(!toggleButton) return;
    state.rootMode = toggleButton.dataset.mode;
    rootModeToggle.querySelectorAll('button').forEach(button => {
      button.classList.toggle('active', button === toggleButton);
    });
    renderConfigChips();
    restartIfActive();
  });

  playbackToggle.addEventListener('click', event => {
    const toggleButton = event.target.closest('button[data-playback]');
    if(!toggleButton) return;
    handleConfigMutation(config => ({
      ...config,
      playbackMode: toggleButton.dataset.playback,
    }));
  });

  voicingFamilyToggle.addEventListener('click', event => {
    const toggleButton = event.target.closest('button[data-family]');
    if(!toggleButton) return;
    handleConfigMutation(config => ({
      ...config,
      voicingFamily: toggleButton.dataset.family,
    }));
  });

  voicingToggle.addEventListener('click', event => {
    const toggleButton = event.target.closest('button[data-voicing]');
    if(!toggleButton || toggleButton.disabled) return;
    handleConfigMutation(config => ({
      ...config,
      voicingMode: toggleButton.dataset.voicing,
    }));
  });

  autoNextToggle.addEventListener('click', event => {
    const toggleButton = event.target.closest('button[data-auto]');
    if(!toggleButton) return;
    state.autoNext = toggleButton.dataset.auto === 'on';
    autoNextToggle.querySelectorAll('button').forEach(button => {
      button.classList.toggle('active', button === toggleButton);
    });
    if(!state.autoNext){
      clearNextTimer();
    }
  });

  baseGrid.addEventListener('click', event => {
    const button = event.target.closest('button[data-kind="base"]');
    if(!button) return;
    handleConfigMutation(config => ({
      ...config,
      baseChordIds: toggleRequiredListValue(config.baseChordIds, button.dataset.id),
    }));
  });

  extGrid.addEventListener('click', event => {
    const button = event.target.closest('button[data-kind="tension"]');
    if(!button) return;
    handleConfigMutation(config => ({
      ...config,
      tensionIds: toggleRequiredListValue(config.tensionIds, button.dataset.id),
    }));
  });

  rootPoolGrid.addEventListener('click', event => {
    const button = event.target.closest('button[data-kind="random-root"]');
    if(!button) return;
    handleConfigMutation(config => ({
      ...config,
      randomRootIds: toggleOptionalListValue(config.randomRootIds, button.dataset.id),
    }));
  });

  voicingPoolGrid.addEventListener('click', event => {
    const button = event.target.closest('button[data-kind="random-voicing"]');
    if(!button) return;
    handleConfigMutation(config => ({
      ...config,
      randomVoicingIds: toggleOptionalListValue(config.randomVoicingIds, button.dataset.id),
    }));
  });

  renderConfigChips();
  updateStats();
  restartIfActive();
}
