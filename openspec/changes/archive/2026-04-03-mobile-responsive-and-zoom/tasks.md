## 1. 全局缩放功能 - CSS 和 HTML 结构

- [x] 1.1 在 `src/styles/theme.css` 中添加 `--app-scale` CSS 变量，默认值为 1
- [x] 1.2 在 `src/styles/theme.css` 中为 `.app-main-inner` 添加 `zoom: var(--app-scale)`（最终方案：zoom 仅作用于主内容区，侧边栏独立不受影响）
- [x] 1.3 在 `index.html` 的侧边栏底部（`.sidebar-footer` 内）添加缩放控制按钮组的 HTML 结构
- [x] 1.4 在 `src/styles/theme.css` 中添加缩放控制按钮的样式（`.zoom-controls` 和 `.zoom-btn`）

## 2. 全局缩放功能 - JavaScript 逻辑

- [x] 2.1 创建 `src/utils/zoom-control.js` 文件，实现缩放逻辑模块
- [x] 2.2 实现 `getZoomLevel()` 函数，从 localStorage 读取缩放级别，默认返回 100
- [x] 2.3 实现 `setZoomLevel(level)` 函数，保存缩放级别到 localStorage 并应用到 CSS 变量
- [x] 2.4 实现 `initZoomControl()` 函数，初始化缩放控制（恢复保存的缩放级别，绑定按钮事件）
- [x] 2.5 在 `src/main.js` 中导入并调用 `initZoomControl()`

## 3. 全局缩放功能 - 按钮交互

- [x] 3.1 实现放大按钮点击事件，缩放级别 +10%，最大 150%
- [x] 3.2 实现缩小按钮点击事件，缩放级别 -10%，最小 80%
- [x] 3.3 实现中间按钮点击时转换为精确输入模式（替代重置，见 3.5）
- [x] 3.4 实现 `updateZoomButtons()` 函数，根据当前缩放级别更新按钮状态（禁用边界按钮，更新中间按钮文本）

## 3.5. 全局缩放功能 - 精确输入

- [x] 3.5.1 实现中间按钮点击时转换为输入框的逻辑（替换按钮为 `<input type="number">`）
- [x] 3.5.2 输入框自动聚焦并全选文本，设置 min=80 max=150 step=1
- [x] 3.5.3 实现 Enter 键确认输入，验证范围（80-150），有效则应用，无效则恢复
- [x] 3.5.4 实现 Esc 键或失焦时取消输入，恢复为按钮显示
- [x] 3.5.5 添加输入框样式，与按钮保持一致的视觉效果

## 3.6. 全局缩放功能 - 滚轮微调

- [x] 3.6.1 为中间按钮添加 `wheel` 事件监听器
- [x] 3.6.2 实现滚轮向上时缩放级别 +1%，向下时 -1%，限制在 80%-150% 范围内
- [x] 3.6.3 调用 `event.preventDefault()` 防止页面滚动
- [x] 3.6.4 在移动端（触摸设备）禁用滚轮事件监听

## 4. 移动端响应式 - 汉堡菜单和抽屉式侧边栏 HTML

- [x] 4.1 在 `index.html` 中添加汉堡菜单按钮（`.hamburger-btn`），放置在 `#app` 的顶层
- [x] 4.2 在 `index.html` 中添加遮罩层元素（`.sidebar-overlay`），用于移动端侧边栏打开时的背景遮罩

## 5. 移动端响应式 - 汉堡菜单和抽屉式侧边栏 CSS

- [x] 5.1 在 `src/styles/theme.css` 中添加汉堡按钮样式（`.hamburger-btn`），默认隐藏，≤768px 时显示
- [x] 5.2 在 `src/styles/theme.css` 中添加遮罩层样式（`.sidebar-overlay`），默认隐藏，侧边栏打开时显示
- [x] 5.3 修改 `src/styles/theme.css` 中的 `.sidebar` 样式，在 ≤768px 时默认隐藏在屏幕左侧外（`transform: translateX(-100%)`）
- [x] 5.4 添加 `.sidebar.open` 样式，使用 `transform: translateX(0)` 实现侧边栏滑入效果
- [x] 5.5 添加 `body.sidebar-open` 样式，设置 `overflow: hidden` 防止滚动穿透

## 6. 移动端响应式 - 汉堡菜单和抽屉式侧边栏 JavaScript

- [x] 6.1 在 `src/main.js` 中实现 `toggleSidebar()` 函数，切换侧边栏的 `.open` 类和 body 的 `.sidebar-open` 类
- [x] 6.2 为汉堡按钮绑定点击事件，调用 `toggleSidebar()`
- [x] 6.3 为遮罩层绑定点击事件，关闭侧边栏
- [x] 6.4 为侧边栏导航按钮绑定点击事件，在移动端点击后自动关闭侧边栏

## 7. 移动端响应式 - 断点优化（480px）

- [x] 7.1 在 `src/styles/modules.css` 中添加 `@media (max-width: 480px)` 断点
- [x] 7.2 在 480px 断点中优化问题显示区域字体大小（从 2.5rem 缩小到 2rem）
- [x] 7.3 在 480px 断点中优化选项按钮尺寸（最小宽度从 72px 缩小到 60px）
- [x] 7.4 在 480px 断点中优化练耳模块的提示文字大小（从 2.2rem 缩小到 1.9rem）

## 8. 移动端响应式 - 断点优化（640px）

- [x] 8.1 检查并优化 `src/styles/modules.css` 中现有的 640px 断点样式
- [x] 8.2 确保卡片内边距在 640px 时从 28px 减少到 18px
- [x] 8.3 确保和弦图表网格在 640px 时列宽从 170px 缩小到 140px
- [x] 8.4 确保练耳模块的和弦选择网格在 640px 时改为单列布局

## 9. 移动端响应式 - 断点优化（768px）

- [x] 9.1 检查并优化 `src/styles/theme.css` 和 `src/styles/modules.css` 中现有的 768px 断点样式
- [x] 9.2 确保主内容区域（`.app-main`）在 768px 时移除左边距
- [x] 9.3 确保下拉选择器在 768px 时最小宽度从 120px 减少到 100px
- [x] 9.4 确保按钮和控件在 768px 时尺寸适当缩小

## 10. 移动端响应式 - 和弦图表模块优化

- [x] 10.1 在 `src/styles/modules.css` 的 640px 断点中，将和弦图表模块的侧边栏（`.cd-sidebar`）改为水平排列（`flex-direction: row`）
- [x] 10.2 在 640px 断点中，将和弦分类按钮组（`.chord-cat-btns`）改为水平排列并支持换行

## 11. 移动端响应式 - 触摸交互优化

- [x] 11.1 检查所有按钮的最小触摸区域，确保至少为 44x44px
- [x] 11.2 为移动端的按钮添加 `:active` 伪类样式，提供触摸反馈

## 12. 性能优化

- [x] 12.1 检查 `src/styles/theme.css` 中的 `@media (prefers-reduced-motion: reduce)` 规则，确保覆盖所有动画
- [x] 12.2 在移动端断点中简化阴影效果（减少模糊半径和层数）
- [x] 12.3 为侧边栏滑入动画添加 `will-change: transform` 提示浏览器优化

## 13. 测试和验证

- [x] 13.1 在 Chrome DevTools 中测试 375px、414px、768px 等常见屏幕尺寸
- [x] 13.2 测试缩放功能在 80% - 150% 范围内的表现
- [x] 13.3 测试移动端侧边栏的打开/关闭动画和滚动穿透防护
- [x] 13.4 测试所有模块在移动端的布局和交互
- [x] 13.5 构建验证通过（npm run build）
