## Why

和弦字典的首版以练耳模块的 voicing 数据为主数据源（仅 Drop2 / Drop3 + 4 种 quality），覆盖面有限：扩展任意新和弦类型都要在算法层加规则，连 Close family 都尚未真正接通；而项目目标用户实际要掌握的爵士指型远不止这些。

同时，项目里"和弦图表"模块已经静态引用了 45 张 PNG（约 200-250 个标准爵士和弦指型），这些 PNG 自带教学元数据：
- 明确的 voicing family 分类（Basic / Shell / Drop2 / Drop3 / Open / Altered / Sus / Extended）
- 每个音的 interval label（1 / 3 / b7 / 9 / b9 / 13 / #9 等）
- 转位（Cmaj7/E、Cmaj7/G）、bass note、rootless 标注、barre 弧线、可选音

这些信息正是算法层无法表达、又是教学价值最高的部分。因此本次将再次调整数据源策略：把 PNG 解析为自有 JSON 数据库，作为和弦字典的唯一数据源。这同时让原有的算法层（`jazz-voicing-library.js`）退役，而练耳模块继续保留 `chord-voicings.js` 自用。

**可扩展性**：有了这个和弦 JSON 数据库后，后续可以自行按照 JSON schema 添加新的和弦图表，无需依赖 PNG 解析流程。只需按照 `src/core/chord-png-db/*.json` 的数据结构编写新的 JSON 文件，系统即可自动识别并渲染。

## What Changes

- 数据源从"练耳模块 voicing 数据"切换到"PNG 解析数据库"，完全退役 `src/core/jazz-voicing-library.js`
- 解析流程：写多模态识别脚本 + 项目内校对页修正，将 44 张 PNG（跳过 quartal.png）转为结构化 JSON
- 模块筛选维度调整为 `Voicing Family -> Chord Quality`，family 扩为 9 类：basic / shell / extended-maj / extended-dom / sus / extended-min / altered / drop2 / drop3 / open
- 不做和声学根音平移，首版只展示 PNG 中已有根音
- 扩展共享 SVG 渲染器以支持 barre 弧线、灰色可选音、rootless 标注
- nav 双入口（"和弦图表" + "和弦字典"）保持不变，旧静态和弦图表模块原地保留作为 PNG 参考视图
- `chord-voicings.js` 保留（练耳模块仍依赖 `DROP2 / DROP3 / STRING_SETS / transposeVoicing`）

## Capabilities

### New Capabilities
- `chord-library`: 提供基于 PNG 解析数据库的动态和弦浏览能力，支持 9 类 family 的筛选、转位查看、SVG 指板渲染（含 barre / 可选音 / rootless 等高级语义）

### Modified Capabilities
<!-- 无现有 capability 的需求变更 -->

## Impact

- 新增文件：
  - `tools/chord-db-review.html` + `tools/chord-db-review-server.mjs` - PNG ↔ SVG 对照校对页与本地服务器
  - `src/core/chord-png-db/*.json` - 解析并校对后的运行时数据（44 个文件，229 个 diagrams）
  - `src/core/chord-png-database.js` - 运行时查询层
  - `tests/chord-png-database.test.js` - 数据查询测试
- 重构文件：
  - `src/modules/chord-library.js` - UI 数据源切到 chord-png-database
  - `src/core/chord-diagram-renderer.js` - 增加 barre / optional dot / rootless 渲染
  - `tests/chord-diagram-renderer.test.js` - 补充新渲染场景
- 删除文件：
  - `src/core/jazz-voicing-library.js` - 算法层完全退役
- 保持不变：
  - `src/modules/chord-diagrams.js` 继续作为旧静态和弦图表模块（PNG 视图）
  - `public/chords/*.png` 作为旧模块展示资源
  - `src/core/chord-voicings.js` 与 `src/core/chord-ear-training.js` 服务于练耳模块
  - `src/main.js` 与 `index.html` nav 双入口结构不变
