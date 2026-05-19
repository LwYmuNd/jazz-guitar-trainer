# Guide Tone Line 训练模块

## Goal

为爵士吉他学习者提供 Guide Tone Line（引导音线）训练，通过指板可视化和逐步揭示的演奏练习方式，帮助用户理解和弦进行中 chord tones 的最小移动（voice leading）规律。定位偏视觉认知 + 演奏练习，而非答题式听辨训练。

## Requirements

### 和弦进行输入
- 提供预设模板：ii-V-I Major、ii-V-i Minor、I-vi-ii-V、12-Bar Blues
- 支持自定义文本输入和弦进行（如 "Dm7 G7 Cmaj7"）
- 支持调整根音（移调），所有预设和自定义进行均可自由变调
- 和弦名解析需容错处理（不合法输入给出提示）

### 声部配置
- 可选跟踪 root / 3rd / 5th / 7th 任意组合
- 默认选中 3rd + 7th（经典 guide tone line 定义）
- 用户可自由切换，实时更新指板显示

### 指板可视化 — 观察模式
- 静态展示完整 guide tone line 路径（所有和弦的 guide tone 位置同时可见）
- 用箭头/连线标注音的移动方向
- 视觉区分移动类型：半音下行、半音上行、全音移动、保持不动
- 每个音标注所属和弦和声部角色（3rd / 7th 等）

### 指板可视化 — 练习模式
- 逐步推进：显示当前和弦名，隐藏 guide tone 位置
- 用户在琴上自行寻找（或心中预判）→ 点击"揭示"按钮 → 显示正确位置
- 前一个和弦的 guide tone 保留为暗色/痕迹，便于对比移动距离
- 点击"下一步"推进到下一个和弦

### 指板范围
- 默认限定某个把位区间显示（如 fret 1-5），以最小移动原则选取位置
- 可切换到全指板视图，标注所有可能位置
- 把位区间可手动调整起始品格

### 多线叠加
- 默认单线跟踪（用户选定的一个声部）
- 提供"叠加"开关，可同时显示第二条线
- 不同线条用不同颜色区分

### 音频播放
- 模式 A：纯 guide tone 线——仅播放所选声部的单音序列
- 模式 B：和弦 + guide tone 突出——播放底层和弦同时突出 guide tone 单音
- 用户可切换两种模式
- 播放与指板高亮同步（逐和弦推进时播放对应音）

### Voice Leading 标注
- 清晰标注相邻和弦间 guide tone 的移动关系
- 半音下行（♭）、半音上行（♯）、全音移动、保持不动各有视觉标识
- 在观察模式中直接标注在连线上

## Acceptance Criteria

- [ ] 用户能从预设模板选择至少 4 种常见进行
- [ ] 用户能输入自定义和弦进行并正确解析
- [ ] 用户能调整进行的根音（移调）
- [ ] 声部选择器支持 root/3rd/5th/7th 任意组合，默认 3rd+7th
- [ ] 观察模式下指板静态展示完整 guide tone path + 连线 + 移动标注
- [ ] 练习模式下逐步推进，揭示前隐藏位置，揭示后显示正确位置
- [ ] 指板支持把位区间 ↔ 全指板切换
- [ ] 单线/叠加开关工作正常，不同线颜色区分清晰
- [ ] 音频播放两种模式均能正确发声且与视觉同步
- [ ] 不合法和弦输入有友好错误提示

## Definition of Done

- Tests added/updated (unit/integration where appropriate)
- Lint / typecheck / CI green
- Docs/notes updated if behavior changes
- UI 在桌面端和移动端均可正常使用

## Technical Approach

### 新增文件（预计）
- `src/core/guide-tone.js` — 纯逻辑：和弦名解析、chord tone 计算、voice leading 路径生成（最小移动算法）
- `src/modules/guide-tone-training.js` — UI 模块：指板渲染、模式切换、播放控制
- `tests/guide-tone.test.js` — core 层测试

### 复用现有能力
- `src/core/music-theory.js` — 音名、半音、CHORD_TYPES_EAR 等基础数据
- `src/core/chord-diagram-renderer.js` — SVG 指板渲染（需扩展支持连线/箭头）
- `src/core/audio-engine.js` — 单音与和弦播放
- `src/components/custom-select.js` — 下拉选择器

### 关键算法
- **和弦名解析**：文本 → (root, quality) → chord tones (intervals)
- **最小移动路径**：给定当前音在指板上的位置，计算下一个和弦对应 chord tone 在最近品格/弦的位置
- **全指板位置计算**：给定一个 MIDI 音高，计算所有弦上可弹奏的 (string, fret) 位置

### 指板标准调弦
- MIDI 值：`[64, 59, 55, 50, 45, 40]`（从 1 弦到 6 弦）
- Fret 范围：0-22

## Decision (ADR-lite)

**Context**: 需要选择模块的核心交互范式——答题验证 vs 自揭示
**Decision**: 采用自揭示模式（用户自行判断 → 点击揭示 → 对照），不做对错计分
**Consequences**: 更贴近真实练琴体验，降低心理压力；但无法量化用户进步，后续如需加统计需额外设计

## Phase 2 Improvements (post-initial commit)

### 2.1 样式统一
- 将 Guide Tone 模块中的原生 `<select>` 替换为项目统一的 `createCustomSelect` 组件
- 按钮样式与其他模块保持一致（使用 `.controls button` 样式类）
- 确保整体视觉风格一致

### 2.2 默认全指板展示
- 将默认视图改为全指板（而非 fret 1-5 限定把位）
- "把位限定"作为可选缩窄功能（勾选后才显示把位范围控件）
- 逻辑反转：默认 `fullFretboard = true`，checkbox 改为"限定把位"

### 2.3 吉他音色
- 使用 gleitz/midi-js-soundfonts CDN 的 FluidR3_GM `electric_guitar_jazz` 采样
- 在 `audio-engine.js` 中新增 `getGuitarSampler()` 函数
- CDN baseUrl: `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/electric_guitar_jazz-mp3/`
- 稀疏采样映射（每 3 半音取一个样本，E2-E5 范围，约 13 个文件 ~240KB）
- 注意：CDN 文件命名用 flat（Bb、Eb、Db 等），sample map key 必须用 flat 名
- Guide Tone 模块默认使用吉他音色（替代钢琴）
- 播放 fallback：加载失败时降级到 PolySynth

## Out of Scope (explicit)

- 多声部同时练习模式（复杂 2-voice comping 训练）
- 与其他模块的跳转联动（和弦字典、练耳模块）
- 进行导出/分享功能
- 节拍器 / BPM / 自动播放速度控制
- 标准曲完整 lead sheet 导入（初版仅支持文本输入和弦序列）

## Technical Notes

- `src/core/music-theory.js` 已有 `CHORD_TYPES_EAR` 定义了 10 种基础和弦的音程结构
- 和弦名解析需扩展支持更多 quality（如 alt、dim、aug、sus、6 等）
- `chord-diagram-renderer.js` 当前渲染竖向和弦图（小段指板），本模块需要横向全指板渲染——可能需要新建指板组件或大幅扩展
- 现有 `src/modules/fretboard.js` 已有横向指板渲染逻辑，可参考其实现
- 标准调弦 MIDI：`[64, 59, 55, 50, 45, 40]` (E4-B3-G3-D3-A2-E2)
