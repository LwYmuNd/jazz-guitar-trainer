## 1. 核心逻辑层 (core)

- [x] 1.1 在 `src/core/interval-ear-training.js` 中定义 `INTERVAL_DEFINITIONS` 常量，包含 12 个基础音程（m2 到 P8）的 id/semitones/label/jazzLabel/category/description/confusionIds
- [x] 1.2 定义 `INTERVAL_TRAINING_TEMPLATES` 常量，包含基础音程、三度与七度、爵士核心音程三个预设模板
- [x] 1.3 实现 `getIntervalDefinition(intervalId)` 函数，根据 id 返回音程定义
- [x] 1.4 实现 `buildIntervalPool(config)` 函数，根据配置过滤并返回合法的音程 id 列表
- [x] 1.5 实现 `buildIntervalNotes(root, intervalId, options)` 函数，计算根音与目标音的 MIDI 值并应用音区钳位
- [x] 1.6 实现 `buildIntervalPlaybackEvents(audioNotes, questionType, direction)` 函数，生成旋律或和声音程的播放事件
- [x] 1.7 实现 `buildOptions(correctId, pool, optionCount, labelMode, randomFn)` 函数，选项仅从当前题库（pool）中按顺序取，不添加外部干扰项
- [x] 1.8 实现 `createIntervalQuestion(config, rootMode, fixedRoot, previousSignature, randomFn, baseOctave)` 函数，生成完整题目对象并避免连续重复
- [x] 1.9 导出 `INTERVAL_OPTIONS`、`EAR_TRAINING_ROOTS` 等 UI 所需常量

## 2. UI 模块层 (modules)

- [x] 2.1 在 `src/modules/interval-training.js` 中实现配置面板渲染，包含模板选择、题型、方向、根音模式
- [x] 2.2 实现题目状态管理，包含 active/answered/correct/wrong/attempted/currentQuestion/rootMode/selectedTemplateId/config
- [x] 2.3 实现"开始训练"按钮逻辑，生成第一题并自动播放
- [x] 2.4 实现题目区域渲染，包含播放/重播按钮、提示文本与选项列表
- [x] 2.5 实现选项点击逻辑，提交答案并进入答题后状态
- [x] 2.6 实现答题后反馈渲染，标记正确/错误选项并显示音程描述
- [x] 2.7 实现答后试听功能，为每个选项绑定试听按钮并调用 `playOptionPreview(question, optionId)`
- [x] 2.8 实现"下一题"按钮逻辑，生成新题并重置选项状态
- [x] 2.9 实现统计区域实时更新，显示正确数/错误数/正确率
- [x] 2.10 实现配置面板展开/收起逻辑（可选）

## 3. 导航与页面集成

- [x] 3.1 在 `index.html` 中新增音程练耳模块的 HTML 结构，包含配置面板、题目区域与统计区域
- [x] 3.2 在主导航中新增"音程练耳"按钮，与现有和弦练耳并列
- [x] 3.3 在 `src/main.js` 中导入并初始化 `initIntervalTraining()` 函数
- [x] 3.4 调整导航切换逻辑，支持音程练耳模块的显示与隐藏

## 4. 样式

- [x] 4.1 在 `src/styles/modules.css` 中新增音程练耳模块样式，复用现有练耳卡片与选项样式
- [x] 4.2 新增答题后选项状态样式，包含 correct/incorrect/neutral 类
- [x] 4.3 新增试听按钮样式，包含 hover 与 playing 状态
- [x] 4.4 适配移动端布局，确保选项与试听按钮在小屏幕上可用

## 5. 测试

- [x] 5.1 在 `tests/interval-ear-training.test.js` 中测试 `getIntervalDefinition` 返回正确定义
- [x] 5.2 测试 `buildIntervalPool` 根据配置过滤音程
- [x] 5.3 测试 `buildIntervalNotes` 计算上行与下行目标音
- [x] 5.4 测试 `buildIntervalNotes` 应用音区钳位（低于 C3 或高于 C6）
- [x] 5.5 测试 `buildOptions` 选项仅从 pool 中取且保持顺序，不添加外部干扰项
- [x] 5.6 测试 `createIntervalQuestion` 避免连续重复题目
- [x] 5.7 测试 `buildIntervalPlaybackEvents` 生成旋律与和声播放事件
- [x] 5.8 运行 `npm test` 确保所有测试通过

## 6. 手动验证

- [x] 6.1 启动开发服务器 `npm run dev`，验证音程练耳入口可访问
- [x] 6.2 验证基础音程模板可正常生成题目并播放
- [x] 6.3 验证三度与七度模板可正常生成题目并播放
- [x] 6.4 验证爵士核心音程模板可正常生成题目并播放
- [x] 6.5 验证旋律音程与和声音程两种题型播放正确
- [x] 6.6 验证上行、下行、随机方向生成正确的目标音
- [x] 6.7 验证固定根音与随机根音模式工作正常
- [x] 6.8 验证答题后反馈显示正确，包含正确/错误标记与音程描述
- [x] 6.9 验证答后试听功能，点击任意选项可播放对应音程
- [x] 6.10 验证统计区域实时更新正确数/错误数/正确率
- [x] 6.11 验证移动端布局与交互正常

## 7. 后续优化（UI 对齐与体验改进）

- [x] 7.1 重构 UI 样式，全面对齐和弦练耳模块（card/ear-config-panel/choice-chip/opt-btn/ear-feedback 等）
- [x] 7.2 音程集合描述改为英文，音程名称使用标准英文（Major Third 等）
- [x] 7.3 答案选项仅从题库中取，不添加外部干扰项，按顺序排列
- [x] 7.4 toggle 按钮尺寸紧凑化，与和弦练耳模块统一视觉密度
- [x] 7.5 新增 Custom 默认模板，手动修改题库后自动回退到 Custom
- [x] 7.6 旋律音程播放间隔加快（delay 0.8 → 0.65s）
- [x] 7.7 默认随机根音 + 旋律音程，切换模板后保持此默认
- [x] 7.8 新增随机根音范围选择器（filter-chip-grid），与和弦练耳模块一致
- [x] 7.9 默认 Custom 模板不预选任何音程（空题库）
- [x] 7.10 题库为空时禁用"开始训练"按钮，与和弦练耳模块一致
- [x] 7.11 新增 Current Pool 预览区域，实时显示当前题库音程列表、题型、方向与根音范围