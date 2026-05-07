## Context

和弦字典经历了两轮数据源选型。

第一版：以通用和弦字典 `guitar-chords-db-json` 为运行时数据源，按 root + suffix 检索。问题：缺少 voicing family 元数据，无法承载教学语义。

第二版（本 change 实施完成）：以练耳模块的 voicing 数据为主数据源，按 family 优先重构。问题：覆盖面太窄（仅 Drop2/Drop3 + 4 种 quality），扩展任意新和弦类型都要在算法层加和声学规则；Close family 也未真正落地。

第三版（本次修订）：以"和弦图表"模块已有的 45 张 PNG 为数据源——这些 PNG 是项目目标用户实际要掌握的标准爵士指型，自带 voicing family、interval label、转位、bass note、barre、rootless 等教学元数据。把它们解析成自有 JSON 数据库，让和弦字典直接消费这份数据，避免再走和声学算法。

约束：
- 练耳模块依赖的 `src/core/chord-voicings.js`（DROP2 / DROP3 / STRING_SETS / transposeVoicing）继续保留，其使用者 `chord-ear-training.js` 不动。
- 旧"和弦图表"模块（`chord-diagrams.js`）和 PNG 资源（`public/chords/*.png`）原地保留作为参考，nav 双入口不变。
- 共享 SVG 渲染器是和弦字典与练耳模块的共同基础设施，扩展但不分叉。
- Quartal 和弦的 PNG（`quartal.png`）是音级可视化而非传统 voicing，首版不收入。

## Goals / Non-Goals

**Goals:**
- 把"和弦字典"模块的数据底盘从算法生成切到 PNG 解析数据库。
- 完全退役 `src/core/jazz-voicing-library.js`。
- 9 类 family（basic / shell / extended-maj / extended-dom / sus / extended-min / altered / drop2 / drop3 / open）覆盖现有 PNG。
- 扩展 SVG 渲染器以支持 barre / optional dot / rootless 等 PNG 中存在的语义。
- 保持与练耳模块的渲染一致性。

**Non-Goals:**
- 不做和声学根音平移（首版只展示 PNG 中已有根音）。
- 不收入 quartal 类（音级可视化语义不同，后续单独建模）。
- 不动 nav 双入口结构。
- 不动 chord-voicings.js 与练耳模块。
- 不实现自动化 PNG 视觉差异回归（解析 pipeline 是一次性的，不进 CI）。

## Decisions

### 1. 将新模块重新定义为 Jazz Voicing Library，而不是继续做通用和弦字典
- 选择：保留模块名称 `和弦字典`，但内部数据组织与交互语义改成爵士 voicing family 优先。
- 原因：项目目标用户是学习现代爵士吉他的进阶初学者，对他们来说 `Drop 2 / Drop 3 / Close` 比 `Extended Major / Dominant` 更有学习价值。
- 备选方案：继续沿用当前 suffix / category 体系，只在 UI 文案上加一些爵士术语。
- 未采用原因：这只能改标签，不能真正把浏览体验变成基于 voicing 的训练工具。

### 2. 第三轮选型：以 PNG 解析数据库为运行时主数据源
- 选择：把 `public/chords/*.png`（44 张，跳过 quartal）通过多模态识别 + 校对页修正解析为 `src/core/chord-png-db/*.json`，作为和弦字典唯一数据源。
- 原因：
  - PNG 自带教学元数据（family / interval label / 转位 / bass / barre / optional / rootless），算法层无法表达
  - 覆盖面比算法层大一个量级（200-250 个 diagram vs 4 种 quality 的代数生成）
  - 与练耳模块的 voicing 数据彻底解耦，互不影响
  - PNG 本身就是项目用户日常对照学习的标准指型，数据语义对齐用户心智
- 备选方案：
  - A. 继续以练耳 voicing 数据为主源 → 覆盖面问题无解
  - B. 用 `guitar-chords-db-json` 通用数据库 → 没有 family/interval label 元数据
  - C. 由算法生成 + chord-db 补强 → 数据源混合，复杂度高，user-mental-model 不一致
- 未采用原因：以上方案都解决不了"PNG 中已有的教学语义无法表达"这个核心问题。

### 3. 将筛选顺序改成 family 优先，而不是根音优先
- 选择：主筛选顺序调整为 `Voicing Family -> Chord Quality -> Root -> Inversion / String Set`。
- 原因：用户来这个模块主要是为了学某类 voicing，而不是先随机找一个根音再看所有和弦类型。
- 备选方案：保留 `Root -> Category -> Type`，只替换分类名称。
- 未采用原因：这会让信息架构继续围绕"和弦百科"而不是"爵士语汇"组织。

### 4. ~~close family 复用生成逻辑，drop2/drop3 family 复用结构化数据库~~（已作废）
- 状态：第三轮选型后该决策完全作废。所有 family（含 close）统一从 PNG 解析数据库读取，不再依赖练耳模块的算法生成。
- 影响：`src/core/jazz-voicing-library.js` 完全删除；和弦字典与练耳模块在数据源上解耦。

### 5. 旧静态模块保留为 Shell / Open / Quartal 的过渡参考入口
- 选择：短期内不强行把 `Shell / Open / Quartal` 并入新的动态爵士和弦字典，而是继续保留旧模块供用户参考。
- 原因：当前练耳模块没有这些 family 的结构化动态数据库，强行并入会让这次重构范围失控。
- 备选方案：本次一次性把所有爵士 family 都动态化。
- 未采用原因：需要额外建模和整理大量新数据，不适合作为当前变更的首版范围。
- 第三轮修订：Shell / Open / Altered / Sus / Extended 全部进入新动态库（PNG 已覆盖）；旧静态模块继续保留作为 PNG 总览参考、以及收纳 quartal 这类暂未结构化的内容。

### 6. 共享渲染器继续作为底层基础设施，不回退为模块内私有逻辑
- 选择：继续让和弦字典与练耳模块共用 `src/core/chord-diagram-renderer.js`。
- 原因：渲染一致性是这次重构的重要前提；family 分类变化不应该导致渲染逻辑分叉。
- 备选方案：为新的爵士和弦字典重新复制一份渲染逻辑。
- 未采用原因：后续任何视觉调整又会回到双份维护问题。

### 7. 渲染器在共享层扩展 barre / optional dot / rootless 三类语义
- 选择：在 `chord-diagram-renderer.js` 增加可选输入 `barre`、`optionalDots`、`rootless`，并默认为 null/空数组/false 以兼容现有调用方。
- 原因：PNG 中这三类语义出现频率高（dom7b9.png / dom13b9-s9.png / sus4-13.png 等都有），不能在数据层降级丢弃；放在共享渲染器是因为练耳模块未来若用到也能直接受益。
- 备选方案：把 barre/optional 在数据层降级为普通圆点。
- 未采用原因：会丢失教学语义（barre 表达"横按"动作，optional 表达"参考音"），降低和弦图表的可学习性。

### 8. PNG 解析采用"识别 + 校对"两段式 pipeline
- 选择：先用多模态视觉模型批量生成 JSON 草稿（`scripts/chord-db-raw/*.json`），再通过项目内校对页（`tools/chord-db-review.html`）逐张比对修正，落地为 `src/core/chord-png-db/*.json`。
- 原因：纯人工标注 200+ 个 diagram 太重，纯识别准确率不可控；两段式让识别承担机械工作、人工承担判断工作，效率最高。
- 备选方案：纯人工标注 / 纯识别。
- 未采用原因：见上。
- 降级路径：若识别准确率过低，校对页支持纯手动编辑，等价于人工标注工具。

## Risks / Trade-offs

- **多模态识别准确率不可控** → 校对页是必经一步，且支持完全手动编辑，最坏退化为纯人工标注。
- **barre 弧线识别难度最高** → 首版可降级为"该弦视为按住但不画弧"，后续校对补全。
- **PNG 中和弦命名不规范**（"C6(9)" vs "C6/9" vs "Cmaj69"） → 校对阶段统一归一化为 `quality=6add9`、`6` 等 ASCII 标识。
- **解析 pipeline 不进 CI** → 解析正确性由一次性人工校对保证，不做自动化回归，避免每次构建都跑视觉 API。
- **quartal 暂不收入** → 用户在新模块看不到 quartal；旧"和弦图表"模块仍可访问 quartal.png，且 nav 入口保留。
- **chord-voicings.js 仍存在但仅服务于练耳** → 实施时需 grep 确认无任何外部依赖错入，避免遗留耦合。
- **PNG 视觉版权与教学引用** → 该模块仅在本地解析 PNG 转结构化数据，不分发原图；新模块输出的 SVG 是项目自有可视化。

## Future Work / Extensibility

**JSON 数据库可扩展性**：有了 `src/core/chord-png-db/*.json` 这个和弦数据库后，后续可以自行按照 JSON schema 添加新的和弦图表，无需依赖 PNG 解析流程。只需按照现有 JSON 文件的数据结构（包含 `source`、`title`、`family`、`qualityFamily`、`diagrams` 等字段）编写新的 JSON 文件放入 `src/core/chord-png-db/` 目录，Vite 的 `import.meta.glob` 会在构建时自动识别并聚合，系统即可渲染新的和弦图表。

这种设计让数据扩展变得简单：
- 不需要修改代码逻辑
- 不需要重新跑 PNG 解析脚本
- 只需要按照 schema 编写 JSON 即可
- 适合后续添加自定义和弦、实验性 voicing、或其他教学资源
