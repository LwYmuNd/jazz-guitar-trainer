const ZOOM_MIN = 80;
const ZOOM_MAX = 150;
const ZOOM_STEP = 10;
const ZOOM_STORAGE_KEY = 'appZoomLevel';

let currentZoom = 100;
let zoomValueBtn = null;
let zoomOutBtn = null;
let zoomInBtn = null;

// 从 localStorage 读取缩放级别
export function getZoomLevel() {
  const saved = localStorage.getItem(ZOOM_STORAGE_KEY);
  if (saved) {
    const level = parseInt(saved, 10);
    if (level >= ZOOM_MIN && level <= ZOOM_MAX) {
      return level;
    }
  }
  return 100;
}

// 设置缩放级别
export function setZoomLevel(level) {
  level = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, level));
  currentZoom = level;

  // 保存到 localStorage
  localStorage.setItem(ZOOM_STORAGE_KEY, level.toString());

  // 应用到 CSS 变量
  document.documentElement.style.setProperty('--app-scale', (level / 100).toString());

  // 更新按钮状态
  updateZoomButtons();
}

// 更新按钮状态
function updateZoomButtons() {
  if (!zoomValueBtn || !zoomOutBtn || !zoomInBtn) return;

  // 更新中间按钮文本
  zoomValueBtn.textContent = `${currentZoom}%`;

  // 更新边界按钮的禁用状态
  zoomOutBtn.disabled = currentZoom <= ZOOM_MIN;
  zoomInBtn.disabled = currentZoom >= ZOOM_MAX;
}

// 放大
function zoomIn() {
  setZoomLevel(currentZoom + ZOOM_STEP);
}

// 缩小
function zoomOut() {
  setZoomLevel(currentZoom - ZOOM_STEP);
}

// 重置或点击中间按钮 - 改为切换到输入模式
function handleValueClick() {
  if (!zoomValueBtn) return;

  // 创建输入框
  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'zoom-input';
  input.min = ZOOM_MIN;
  input.max = ZOOM_MAX;
  input.step = 1;
  input.value = currentZoom;

  // 替换按钮为输入框
  const parent = zoomValueBtn.parentElement;
  parent.replaceChild(input, zoomValueBtn);
  input.focus();
  input.select();

  // Enter 键确认
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const value = parseInt(input.value, 10);
      if (value >= ZOOM_MIN && value <= ZOOM_MAX) {
        setZoomLevel(value);
      }
      restoreButton(input);
    } else if (e.key === 'Escape') {
      restoreButton(input);
    }
  });

  // 失焦时恢复按钮
  input.addEventListener('blur', () => {
    restoreButton(input);
  });
}

// 恢复按钮
function restoreButton(input) {
  const parent = input.parentElement;
  parent.replaceChild(zoomValueBtn, input);
}

// 滚轮微调
function handleWheel(e) {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 1 : -1;
  setZoomLevel(currentZoom + delta);
}

// 初始化缩放控制
export function initZoomControl() {
  zoomValueBtn = document.getElementById('zoomValue');
  zoomOutBtn = document.getElementById('zoomOut');
  zoomInBtn = document.getElementById('zoomIn');

  if (!zoomValueBtn || !zoomOutBtn || !zoomInBtn) {
    console.warn('Zoom control elements not found');
    return;
  }

  // 恢复保存的缩放级别
  currentZoom = getZoomLevel();
  setZoomLevel(currentZoom);

  // 绑定按钮事件
  zoomOutBtn.addEventListener('click', zoomOut);
  zoomInBtn.addEventListener('click', zoomIn);
  zoomValueBtn.addEventListener('click', handleValueClick);

  // 绑定滚轮事件（仅桌面端）
  if (!('ontouchstart' in window)) {
    zoomValueBtn.addEventListener('wheel', handleWheel, { passive: false });
  }
}
