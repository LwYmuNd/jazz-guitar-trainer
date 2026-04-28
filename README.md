# Jazz Guitar Trainer

一个面向现代爵士吉他练习的静态小工具。当前项目包含指板、音名/级数、和弦图，以及正在持续补强的和弦练耳模块。

在线地址：`https://lwymund.github.io/jazz-guitar-trainer`

## 本地开发

```bash
npm install
npm run dev
```

常用命令：

```bash
npm test
npm run build
npm run preview
```

## 当前模块

- `指板`：查看音名在指板上的位置。
- `音名 / 级数`：基础音高与级数识别训练。
- `和弦图`：查看当前项目内置的和弦图与排列。
- `和弦练耳`：面向爵士和声颜色听辨的简化版训练模块。

## 和弦练耳现状

当前版本已经支持：

- `Base Chords`
  - `Maj`
  - `m`
  - `dim`
  - `aug`
  - `6`
  - `m6`
  - `maj7`
  - `7`
  - `m7`
  - `m7♭5`
  - `dim7`
- `Single Tension`
  - `None`
  - `♭9`
  - `9`
  - `♯9`
  - `11`
  - `♯11`
  - `♭13`
  - `13`
- `Playback`
  - 和弦
  - 琶音
  - 先琶音后和弦
  - 单独的 `重播琶音` 按钮
- `Root Mode`
  - 固定根音
  - 随机根音
  - 随机根音时会禁用单根选择器，避免“随机但仍选单根”这种语义混乱
- `Voicing`
  - `Voicing Family`
    - `封闭`
    - `Drop 2`
    - `Drop 3`
  - `原位`
  - `一转位`
  - `二转位`
  - `三转位`
  - `随机转位`
- `Voicing Feedback`
  - 答题后显示当前 voicing family 的弹法参考图
  - 当前练耳模块已经统一改成动态和弦图
  - 会按当前 root、voicing family 和 inversion 渲染指板参考
  - 会给出多组可替代的 string-set 参考，而不是只显示一个按法
  - 圆点显示相对音程，左侧显示当前图内每一格对应的 fret

说明：

- 当前题库仍然是本地规则驱动，不是完整的 `My Ear Training` 替代品。
- 当前版本已经支持 `封闭 / Drop 2 / Drop 3` 三类 voicing family。
- `Drop 2 / Drop 3` 当前先覆盖最常用的四声音家族：`maj7 / 7 / m7 / m7♭5`。
- triad / 6 chord 的 tension 兼容先走保守规则，优先保证题目和命名不奇怪。
- 钢琴音色使用 `Tone.Sampler` 加载 Salamander piano samples；采样加载失败时会退回到内置 synth。

## 项目文档

- 需求文档：[`docs/练耳工具需求.md`](docs/练耳工具需求.md)
- 外部参考资源说明：[`resources/references/README.md`](resources/references/README.md)

## 外部参考资源

当前已经把两类开源参考资源同步到本地，放在 [`resources/references`](resources/references)：

1. `tonaljs/tonal`
   - 上游仓库：<https://github.com/tonaljs/tonal>
   - 本地路径：[`resources/references/tonal`](resources/references/tonal)
   - 用途：和弦命名、interval / chord / voicing 相关理论 API 与文档参考

2. `szaza/guitar-chords-db-json`
   - 上游仓库：<https://github.com/szaza/guitar-chords-db-json>
   - 本地路径：[`resources/references/guitar-chords-db-json`](resources/references/guitar-chords-db-json)
   - 用途：吉他和弦命名、和弦图、指型 JSON 结构参考

它们当前都不是运行时依赖，主要用于：

- 校对当前本地 hand-written 规则
- 后续扩 chord family / inversion / voicing 时做对照
- 准备进一步向 `My Ear Training` 式的可配置题库演进

## 额外产品参考

除了上面的理论 / 数据参考，这个项目后续也会持续参考一些开源练耳产品的交互方式，例如：

- `ShacharHarshuv/open-ear`
- `colxi/earteach`

这些产品参考当前没有同步到仓库里，只作为功能与交互层面的外部对照。
