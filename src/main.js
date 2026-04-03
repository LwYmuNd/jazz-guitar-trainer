import './styles/theme.css';
import './styles/modules.css';
import { initNoteDegree } from './modules/note-degree.js';
import { initFretboard } from './modules/fretboard.js';
import { initChordDiagrams } from './modules/chord-diagrams.js';
import { initEarTraining } from './modules/ear-training.js';
import { initZoomControl } from './utils/zoom-control.js';

// 侧边栏切换
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const isOpen = sidebar.classList.contains('open');

  if (isOpen) {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.classList.remove('sidebar-open');
  } else {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    document.body.classList.add('sidebar-open');
  }
}

// 导航切换
document.getElementById('mainNav').addEventListener('click', e => {
  const btn = e.target.closest('.nav-btn');
  if(!btn) return;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
  document.getElementById('mod-' + btn.dataset.mod).classList.add('active');

  // 移动端点击导航后关闭侧边栏
  if (window.innerWidth <= 768) {
    toggleSidebar();
  }
});

// 汉堡按钮
document.getElementById('hamburgerBtn').addEventListener('click', toggleSidebar);

// 遮罩层点击关闭
document.getElementById('sidebarOverlay').addEventListener('click', toggleSidebar);

initZoomControl();
initNoteDegree();
initFretboard();
initChordDiagrams();
initEarTraining();
