## 1. 数据与查询层重构

- [x] 1.1 新建 `src/core/jazz-voicing-library.js`，统一封装爵士 voicing family 查询接口
- [x] 1.2 复用 `src/core/chord-voicings.js` 中的 `DROP2 / DROP3` 数据，建立 `Drop 2 / Drop 3` 的运行时查询能力
- [x] 1.3 从 `src/core/chord-ear-training.js` 抽取 close voicing 所需的共享生成逻辑，避免和弦库直接依赖出题流程
- [x] 1.4 定义新的运行时数据模型，至少覆盖 `family / quality / inversion / stringSet / frets / intervalLabels / baseFret`
- [x] 1.5 在查询层实现按 family 动态收缩 quality 列表的能力，避免展示当前 family 不支持的和弦质量
- [x] 1.6 保留内部根音命名（Db/Eb/Gb/Ab/Bb）与显示层 ASCII 符号规则

## 2. 配置层调整

- [x] 2.1 重写 `src/core/chord-library-config.js`，将一级分类改为 `Close / Drop 2 / Drop 3`
- [x] 2.2 在配置层定义当前支持的 chord quality 列表，如 `Maj7 / Dom7 / Min7 / Min7b5 / Dim7 / MinMaj7`
- [x] 2.3 为不同 family 定义可用 quality 范围与展示优先级
- [x] 2.4 明确 close / drop2 / drop3 在 inversion 与 string set 维度上的展示规则

## 3. 和弦库 UI 重构

- [x] 3.1 重构 `src/modules/chord-library.js` 的模块状态，改为 `family / quality`（根音已移除，指型形状与根音无关）
- [x] 3.2 将当前 `根音 -> 分类 -> 和弦类型` 筛选顺序改为 `Voicing Family -> Chord Quality`
- [x] 3.3 展示所有 inversion 与 string set 的组合（按弦组优先、转位次之排序）
- [x] 3.4 更新卡片文案，明确显示当前 voicing 的 family、inversion 和 string set
- [x] 3.5 保留空状态提示，但改为适配新的 family-first 数据结构
- [x] 3.6 保持与全局模块样式一致，不引入割裂的独立视觉体系

## 4. 与练耳模块共享能力对齐

- [x] 4.1 保持 `src/core/chord-diagram-renderer.js` 作为和弦库与练耳模块共享的 SVG 渲染器
- [x] 4.2 重写渲染器为横向琴弦布局（1弦在上，6弦在下），统一6弦数组格式
- [x] 4.3 更新练耳模块 `buildDynamicDiagrams` 输出格式，与新渲染器接口对齐

## 5. 导航与页面集成

- [x] 5.1 保留主导航中的 `和弦库` 与旧 `和弦图表` 两个入口
- [x] 5.2 保证新和弦库模块仍挂载在现有页面结构中，不破坏其他模块切换逻辑
- [x] 5.3 在文案上明确新模块是爵士 voicing 浏览库，旧模块是静态参考图表

## 6. 测试

- [x] 6.1 为新的 voicing 查询层补测试，覆盖 family / quality 查询结果
- [x] 6.2 测试 family 与 quality 的联动逻辑，确保不会出现无效选项
- [x] 6.3 测试 close / drop2 / drop3 生成结果的关键字段格式
- [x] 6.4 运行 `npm test` 确保所有测试通过（47/47）
- [x] 6.5 运行 `npm run build` 确保构建通过

## 7. 手动验证

- [x] 7.1 启动开发服务器 `npm run dev`，验证新的爵士和弦库入口可访问
- [x] 7.2 验证 `Close / Drop 2 / Drop 3` family 切换正常
- [x] 7.3 验证 family 切换后 quality 选项会随支持范围动态变化
- [x] 7.4 移除根音选择器（指型形状与根音无关，固定用 C 根音生成）
- [x] 7.5 验证 inversion / string set 信息展示正确，排序为弦组优先、转位次之
- [x] 7.6 验证旧和弦图表模块继续可访问，不受新模块影响
- [x] 7.7 验证练耳模块反馈渲染在共享逻辑抽取后仍正常工作
- [~] 7.8 验证移动端布局与交互正常（已测试：当前应用未针对移动端做响应式设计，侧边栏在小屏幕上遮挡主内容。建议作为未来优化项，不阻塞当前发布）
- [x] 7.9 验证显示层升降号符号统一为 ASCII

## 8. 文档与清理

- [x] 8.1 更新 `README.md`，把动态和弦库描述改成爵士 voicing 浏览库
- [x] 8.2 更新 `CLAUDE.md`，补充新的数据来源与模块架构说明
- [x] 8.3 清理与旧 `guitar-chords-db-json` 主数据路线强耦合的过时文案或代码

## 实施备注（后续修复）

以下问题在实施过程中发现并修复，未在原始任务中列出：

- **SVG 渲染器接口统一**：将渲染器从竖向琴弦改为横向琴弦布局，并统一为6弦数组格式（index 0=6弦，index 5=1弦，-1表示静音）。练耳模块的 `buildDynamicDiagrams` 同步更新输出格式。
- **弦组索引方向修正**：`STRING_SETS.strings` 使用从高到低索引（0=1弦），而 `fullFrets` 使用从低到高索引（0=6弦），映射时需做 `5-stringIndex` 转换。
- **空弦提升修正**：`voicesToFrets` 在某些转位下会生成不合理的空弦（如 Maj7 Drop2 ①②③④弦第二转位），通过检测"空弦但其他弦在高把位"的情况，将空弦提升12品修正。
- **`forEach` 中 `continue` 语法错误**：Close voicing 生成逻辑中将 `forEach` 改为 `for` 循环。
- **根音选择器移除**：和弦指型形状与根音无关，移除根音筛选器，固定用 C 根音生成指型，卡片标题去掉根音前缀。

---

## 第三轮修订（PNG 解析数据库换底）

> 数据源从"练耳模块 voicing 数据"切到"PNG 解析数据库"，完全退役 `src/core/jazz-voicing-library.js`。

## 9. PNG 解析 pipeline

- [x] 9.1 PNG 数据已通过多模态识别 + 人工校对完成，44 个 JSON 文件（229 个 diagrams）已落地到 `src/core/chord-png-db/`
- [x] 9.2 prompt 明确：红/黑/灰圆语义、x/O/barre 弧线、rootless 标注、广告排除、ASCII 符号规范
- [x] 9.3 单 PNG 失败标记 `parseError: true`，不阻断其他 PNG
- [x] 9.4 写 `tools/chord-db-review.html` + `tools/chord-db-review-server.mjs`：左 PNG / 中 JSON 编辑器 / 右 SVG 实时渲染，支持上下张切换 + 保存
- [x] 9.5 用户已通过其他方式完成 PNG 识别并人工校对，数据已落地到 `src/core/chord-png-db/<source>.json`
- [x] 9.6 写 `src/core/chord-png-database.js`：用 `import.meta.glob` 聚合 JSON，导出 `getFamilies / getQualitiesByFamily / getDiagrams`（同时暴露纯 `createDatabase` 供 Node 测试注入 fixture）
- [x] 9.7 写 `tests/chord-png-database.test.js` 覆盖查询 API（不断言 PNG 解析准确性，那是一次性 pipeline）

## 10. 模块换底

- [x] 10.1 扩展 `src/core/chord-diagram-renderer.js`：支持 `barre`、`optionalDots`、`rootless` 三个可选输入，默认值兼容现有调用方
- [x] 10.2 扩展 `tests/chord-diagram-renderer.test.js`：新增 barre / optional / rootless 渲染场景
- [x] 10.3 重构 `src/modules/chord-library.js`：数据源从 `jazz-voicing-library.js` 切到 `chord-png-database.js`，family chip 扩为 9 类
- [x] 10.4 卡片元信息显示 chord name (含 /bass)、interval 文本、frets 文本、bass-note hint、rootless 标识
- [x] 10.5 删除 `src/core/jazz-voicing-library.js`（先 grep 确认无外部引用）
- [x] 10.6 跑 `npm test` 与 `npm run build` 验证通过
- [x] 10.7 `npm run dev` 手动验证 9 类 family 切换、barre 类（dom7b9 / sus4-13）、rootless 类（dom13b9-s9 第三图）、open 类（open-e）渲染与原 PNG 一致
- [x] 10.8 验证旧"和弦图表"模块继续可访问
- [x] 10.9 验证练耳模块"播放后渲染指型"功能未受影响

## 11. 文档同步

- [x] 11.1 更新 `CLAUDE.md` 的"动态和弦库"章节，把数据源从"以练耳模块 voicing 数据为主"改为"以 PNG 解析数据库为主"
- [x] 11.2 更新 `README.md` 的功能描述
- [x] 11.3 在 CLAUDE.md 中明确：`chord-voicings.js` 与 `chord-ear-training.js` 仅服务于练耳模块；`jazz-voicing-library.js` 已删除
