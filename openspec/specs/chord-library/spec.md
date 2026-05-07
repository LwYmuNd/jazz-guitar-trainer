# Chord Library Capability

## Purpose

The chord library capability provides users with a browsable dictionary of jazz guitar chord voicings, organized by voicing family and chord quality. It serves as a reference tool for learning and exploring different chord shapes and fingerings.

## Requirements

### Requirement: 用户可以访问独立的爵士和弦字典模块
系统 SHALL 在主导航中提供独立的"和弦字典"入口，并保留现有静态和弦图表模块入口，使用户可以分别访问旧 PNG 视图模块与新的动态 voicing 浏览模块。

#### Scenario: 用户从主导航进入和弦字典
- **WHEN** 用户点击主导航中的"和弦字典"按钮
- **THEN** 系统显示基于 PNG 解析数据库的和弦字典内容区域

#### Scenario: 旧和弦图表模块继续可访问
- **WHEN** 用户点击主导航中的旧和弦图表入口
- **THEN** 系统仍显示现有静态和弦图表模块，不受新模块影响

### Requirement: 用户可以按 voicing family 浏览和弦字典
系统 SHALL 提供基于 voicing family 的一级筛选，覆盖 10 类 family：`basic`、`shell`、`extended-maj`、`extended-dom`、`sus`、`extended-min`、`altered`、`drop2`、`drop3`、`open`。

#### Scenario: 用户切换到 Drop 2
- **WHEN** 用户在和弦字典中选择 `Drop 2`
- **THEN** 系统只展示 `drop2` family 下来源 PNG 中已包含的和弦

#### Scenario: 用户切换到 Shell
- **WHEN** 用户在和弦字典中选择 `Shell`
- **THEN** 系统只展示 shell family 下的所有 voicing（如 1-3-7 / 1-7-3 ×（E / A 根弦））

#### Scenario: 用户切换到 Altered Dominant
- **WHEN** 用户在和弦字典中选择 `Altered`
- **THEN** 系统展示 altered dominant family 下来源 PNG 中已包含的所有 voicing

### Requirement: 用户可以按和弦质量浏览当前 family 的可用 voicing
系统 SHALL 根据当前 voicing family 动态展示该 family 在 PNG 解析数据库中实际存在的和弦质量选项，避免暴露当前 family 不包含的 quality。

#### Scenario: 用户查看 Drop 2 的可用质量
- **WHEN** 用户已选择 `Drop 2`
- **THEN** 系统展示 PNG 数据库中 drop2 family 实际存在的 quality（如 `Maj7`、`Dom7`、`Min7`、`Min7b5`）

#### Scenario: 用户查看 Extended (Major) 的可用质量
- **WHEN** 用户已选择 `Extended (Major)`
- **THEN** 系统展示 PNG 数据库中 extended-maj family 实际存在的 quality（如 `Maj6`、`Maj6/9`、`Maj9`、`Maj13`、`Maj7#11`、`Maj7#5`）

### Requirement: 系统按 PNG 数据库中已包含的根音展示 voicing
系统 SHALL 仅展示 PNG 解析数据库中已包含的根音对应的 voicing，不做和声学根音平移。

#### Scenario: 用户查看 Basic family 的 Maj7
- **WHEN** 用户在 Basic family 选中 `Maj7`
- **THEN** 系统展示 `Cmaj7` 的所有把位（PNG 中 Major 7 Chords 已涵盖的 6 个 voicing）

#### Scenario: 用户查看 Open Chords
- **WHEN** 用户在 Open family 选中 `E Root`
- **THEN** 系统展示 PNG 中已有的 E 根音 open voicing，不强行映射到其他根音

### Requirement: 用户可以查看转位与 bass note 维度的差异
系统 SHALL 在卡片上明确标识当前 voicing 的转位（如 `Cmaj7/E`、`Cmaj7/G`、`Cmaj7/B`）、bass note hint（如 "A-String Bass Note"）以及 rootless 状态。

#### Scenario: 当前 family / quality 存在多个转位
- **WHEN** 当前 family / quality 组合存在多个 inversion
- **THEN** 系统在卡片上分别显示 `Cmaj7`（根位）、`Cmaj7/E`（第一转位）等转位标签

#### Scenario: 当前 voicing 是 rootless
- **WHEN** 系统展示 `C13b9 (rootless)` 这类无根音 voicing
- **THEN** 卡片标题附加 "(rootless)" 标注，且无红色根音圆点

### Requirement: 系统使用与练耳模块一致的共享 SVG 渲染器
系统 SHALL 使用 `src/core/chord-diagram-renderer.js` 共享渲染器渲染 voicing，并扩展该渲染器以支持 PNG 中存在的 barre 弧线、灰色可选音、rootless 三类语义。

#### Scenario: 渲染含 barre 的 voicing
- **WHEN** voicing 数据中包含 `barre = { fromString, toString, fret }`
- **THEN** 渲染器在对应弦区间画一条横按弧线

#### Scenario: 渲染含可选音的 voicing
- **WHEN** voicing 数据中包含 `optionalDots = [{ string, fret }]`
- **THEN** 渲染器以浅灰色圆点（无 label）表示参考/可选音

#### Scenario: 渲染 rootless voicing
- **WHEN** voicing 数据 `rootless = true`
- **THEN** 渲染器不绘制红色根音圆点，标题区追加 "(rootless)" 文字

#### Scenario: 兼容历史调用
- **WHEN** 调用方未传入 `barre / optionalDots / rootless`
- **THEN** 渲染器按原有行为输出，不影响练耳模块现有渲染结果

### Requirement: 系统在显示层统一使用 ASCII 升降号符号
系统 SHALL 在和弦字典中使用 ASCII 形式展示升降号符号。

#### Scenario: 显示带降号的根音
- **WHEN** 系统展示 `Db` 或 `Bb` 等根音名称
- **THEN** 页面显示 ASCII 文本 `Db`、`Bb`

#### Scenario: 显示带变化音的质量标签
- **WHEN** 系统展示 `m7b5` 或 `7#9` 等名称
- **THEN** 页面显示 ASCII 文本 `#` 与 `b`

### Requirement: 首版以 PNG 解析数据库作为唯一运行时数据源
系统 SHALL 在首版和弦字典中以 `src/core/chord-png-db/*.json` 作为唯一运行时数据源，由 `src/core/chord-png-database.js` 暴露查询 API，不再依赖任何算法生成的 voicing 数据。

**可扩展性**：后续可以自行按照 JSON schema 添加新的和弦图表。只需按照 `src/core/chord-png-db/*.json` 的数据结构编写新的 JSON 文件放入该目录，Vite 的 `import.meta.glob` 会在构建时自动识别并聚合，系统即可渲染新的和弦图表，无需修改代码逻辑或重新跑 PNG 解析脚本。

#### Scenario: 查询 voicing 数据
- **WHEN** 用户在和弦字典中选择某个 family / quality
- **THEN** 系统通过 `chord-png-database.js` 暴露的 API 从已落地的 JSON 数据中读取对应 voicing，不再调用任何算法生成函数

#### Scenario: 与练耳模块的数据隔离
- **WHEN** 和弦字典做任何数据查询
- **THEN** 它不读取 `src/core/chord-voicings.js` 或 `src/core/chord-ear-training.js` 中的 DROP2/DROP3/Close 生成结果

#### Scenario: 扩展新的和弦数据
- **WHEN** 开发者按照现有 JSON schema 编写新的和弦数据文件并放入 `src/core/chord-png-db/` 目录
- **THEN** 系统在下次构建时自动识别并聚合新数据，用户可在和弦字典中浏览新添加的和弦
