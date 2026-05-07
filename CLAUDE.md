# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Jazz Guitar Trainer 是一个面向现代爵士吉他练习的静态 Web 应用，包含指板可视化、音名/级数训练、和弦图查看、和弦字典、和弦练耳以及音程练耳模块。

在线地址：https://lwymund.github.io/jazz-guitar-trainer

## 开发命令

```bash
# 安装依赖
npm install

# 本地开发（启动 Vite 开发服务器）
npm run dev

# 运行测试
npm test

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 技术栈

- **构建工具**: Vite
- **音频引擎**: Tone.js (用于音频合成和采样播放)
- **测试框架**: Node.js 内置 test runner
- **部署**: GitHub Pages (base path: `/jazz-guitar-trainer/`)

## 代码架构

### 目录结构

```
src/
├── main.js              # 应用入口，初始化所有模块
├── core/                # 核心业务逻辑（不依赖 DOM）
│   ├── music-theory.js       # 音乐理论基础（音符、音阶、调式）
│   ├── chord-ear-training.js # 和弦练耳题库生成与规则
│   ├── interval-ear-training.js # 音程练耳题库生成与规则
│   ├── chord-png-database.js  # 和弦字典运行时查询层（聚合 chord-png-db/*.json）
│   ├── chord-png-db/          # PNG 解析校对后的和弦数据（每张原图一个 JSON）
│   ├── chord-diagram-renderer.js # 共享 SVG 和弦图渲染器（支持 barre / optionalDots / rootless）
│   ├── chord-voicings.js     # Drop2/Drop3 voicing 数据库（仅练耳模块使用）
│   └── audio-engine.js       # Tone.js 音频播放封装
├── modules/             # UI 模块（对应页面中的各个功能区）
│   ├── note-degree.js        # 音名/级数训练模块
│   ├── fretboard.js          # 指板可视化模块
│   ├── chord-diagrams.js     # 静态和弦图查看模块
│   ├── chord-library.js      # 和弦字典模块
│   ├── ear-training.js       # 和弦练耳 UI 与交互
│   └── interval-training.js  # 音程练耳 UI 与交互
├── components/          # 可复用 UI 组件
│   └── custom-select.js      # 自定义下拉选择器
├── utils/               # 工具函数
│   └── zoom-control.js       # 全局缩放控制
└── styles/              # 全局样式
```

### 架构原则

1. **核心逻辑与 UI 分离**
   - `core/` 目录中的模块是纯逻辑，不操作 DOM，可独立测试
   - `modules/` 目录中的模块负责 UI 渲染和用户交互
   - 测试只针对 `core/` 层，UI 层通过手动测试验证

2. **音频系统**
   - 使用 Tone.js 的 Sampler 加载 Salamander 钢琴采样
   - 采样加载失败时自动降级到 PolySynth
   - 所有音频播放前需调用 `ensureStarted()` 以符合浏览器 AudioContext 启动策略

3. **和弦练耳核心逻辑**
   - `chord-ear-training.js` 包含完整的题库生成规则
   - 支持 Base Chords (三和弦、六和弦、七和弦) + Single Tension (♭9/9/♯9/11/♯11/♭13/13)
   - 支持三种 Voicing Family: 封闭 (close)、Drop 2、Drop 3
   - 每种 voicing family 支持四个转位 + 随机转位
   - Drop2/Drop3 数据库在 `chord-voicings.js` 中，包含三组弦集 (①②③④、②③④⑤、③④⑤⑥)

4. **Voicing 反馈系统**
   - 答题后动态渲染当前 voicing family 的指板参考图
   - 根据当前 root、voicing family、inversion 生成多组可替代的弦集按法
   - 圆点显示相对音程，左侧显示 fret 编号

5. **和弦字典（PNG 解析数据库路线）**
   - 数据来源：`public/chords/*.png` 中的 44 张教学和弦图（quartal 暂不收入）
   - 数据生成：PNG 已通过多模态识别 + 人工校对转换为结构化 JSON，存放在 `src/core/chord-png-db/<source>.json`（44 个文件，229 个 diagrams）
   - 校对工具：`node tools/chord-db-review-server.mjs` 启动本地服务器，浏览器打开后可逐张比对 PNG 与 SVG 渲染并修正 JSON
   - 运行时聚合：`src/core/chord-png-database.js` 用 Vite 的 `import.meta.glob` 在构建时收集所有校对后的 JSON
   - 查询 API：`getFamilies / getQualitiesByFamily / getDiagrams`，支持 9 类 family（basic / shell / extended-maj / extended-dom / sus / extended-min / altered / drop2 / drop3 / open）
   - 显示层统一 ASCII 升降号（`Db`、`7#9`、`m7b5`）
   - `src/core/chord-diagram-renderer.js` 为和弦字典与练耳模块共享 SVG 指板渲染器，支持 `barre` 弧线、`optionalDots` 灰色参考音、`rootless` 标识
   - 注意：`chord-voicings.js` 与 `chord-ear-training.js` 仅服务于练耳模块的 voicing 反馈，不再供和弦字典使用；`jazz-voicing-library.js` 已删除

6. **音程练耳核心逻辑**
   - `interval-ear-training.js` 包含 12 个基础音程定义（m2 到 P8）
   - 支持旋律音程（先后播放）与和声音程（同时播放）两种题型
   - 支持上行/下行/随机方向、固定根音/随机根音（可限定范围）
   - 选项仅从当前题库中取，按顺序排列，不添加外部干扰项
   - 答题后可试听所有选项对应的音程，用于对比学习
   - 提供 Custom（默认空题库）及三个预设模板，手动修改题库后自动回退 Custom

## 重要约定

### 音符命名

- 内部使用 Unicode 符号：`♯` (sharp) 和 `♭` (flat)
- 与外部库交互时转换为 ASCII：`#` 和 `b`
- 播放音频时使用 Tone.js 标准命名：`C#4`, `Bb3` 等

### Voicing 数据结构

- Drop2/Drop3 voicing 按 "从高到低" 顺序存储音符
- String 1 = 最高音弦 (细弦)
- Fret 编号从 0 开始 (0 = 空弦)
- 标准调弦 MIDI 值：`[64, 59, 55, 50, 45, 40]` (E-A-D-G-B-E)

### 题库规则

- Triad 和 6 chord 的 tension 兼容规则较保守，优先保证题目命名合理
- Drop2/Drop3 当前仅覆盖四声音家族：maj7 / 7 / m7 / m7♭5
- 题库由本地规则驱动，不是完整的 My Ear Training 替代品

## 外部参考资源

项目在 `resources/references/` 中同步了两个开源参考资源（非运行时依赖）：

1. **tonaljs/tonal** - 和弦命名、interval/chord/voicing 理论 API 参考
2. **szaza/guitar-chords-db-json** - 吉他和弦图与指型 JSON 结构参考

这些资源用于：
- 校对本地 hand-written 规则
- 扩展 chord family / inversion / voicing 时做对照
- 准备向可配置题库演进

## 需求文档

详细的产品需求和设计思路见 `docs/练耳工具需求.md`。

## 测试策略

- 测试文件位于 `tests/` 目录
- 仅测试 `core/` 层的纯逻辑函数
- UI 功能通过本地开发服务器手动验证
- 重点测试和弦题库生成、voicing 计算、音符转换、音程题库生成等核心逻辑

## 部署配置

- Vite base path 设置为 `/jazz-guitar-trainer/`（见 `vite.config.js`）
- 构建产物输出到 `dist/` 目录
- 通过 GitHub Pages 部署
