# dsh-operate-phone

给 **DeepSeek Harness（DSH）手机版**用的技能插件：让 AI **看手机屏幕并操作手机上的其他 App**。

**核心约束：调用前必须先问用户「前台还是后台」，不允许自行默认。**

| 模式 | 通道 | 前提 | 代价 |
|---|---|---|---|
| **前台** | 无障碍（a11y） | 在系统设置里开启「屏幕助手」无障碍服务 | 免 root、免 Shizuku，但会占用你的屏幕焦点 |
| **后台** | 虚拟屏（vscreen） | 已启动 Shizuku | 主屏不被打扰，但每次重启都要重新配对启动 Shizuku |

技能只负责**编排与纪律**，具体能力由你所用的 App 提供（例如 [woaiys3/deepseek-harness-android-app](https://github.com/woaiys3/deepseek-harness-android-app) 的 `dsh-tool-accessibility` 与 `dsh-tool-vscreen`）。本插件**零运行时依赖**，不读用户目录、不监听文件、不碰原生模块。

## 安装

### 方式一：直接丢 Markdown（最省事）

把 `SKILL.md` 放到下面任一路径，技能即被 dsh 的 `skill-filesystem` 自动扫到：

```
<你的工作区>/.agents/skills/operate-phone/SKILL.md
~/.agents/skills/operate-phone/SKILL.md
```

### 方式二：作为插件包安装

在你的 DSH 客户端/App 的插件管理里填入本仓库地址，或直接：

```sh
npm install github:WebExperiments-glitch/dsh-operate-phone
```

包声明了 `peerDependencies: @deepseek-ai/cordis`（optional），不需要额外安装依赖。

## 技能内容

`SKILL.md` 是唯一的答案来源，两条安装路径共用同一个文件。它规定了四件事：

1. **先问再做** —— 任何读屏/截图/点击之前，必须用 `ask_user_question` 让用户选前台或后台。
2. **按模式分通道** —— 前台走 `android_a11y_status` / `android_screen` / `android_tap` / `android_type` / `android_scroll` / `android_back` / `android_home` / `android_see`；后台走 `vscreen_*`。
3. **动作后必须校验** —— `pageChanged=false` 换定位方式；`changed=false` 且 `atEdge=true` 是「已经到底，别重复滑」；非 `atEdge` 是「手势没生效，改按文字点」。完成判定必须基于读到的屏幕状态。
4. **安全与保活** —— 不可逆操作二次确认；验证码/密码不复述；华为机型无障碍被自动关闭时的三条保活解法。

## 已知限制

- **本技能是提示层，不是强制层。** 它能"要求"模型先问，但无法硬性保证。若要强制，需要一个把 `mode` 列为必填参数的工具，让模型不填就调用失败。
- **技能名与工具名依赖宿主 App**：如宿主工具名有变化（如 `android_*` 前缀调整），同步更新 `SKILL.md`。
- 后台模式**不能脱离 Shizuku**：普通 App 建的虚拟屏无法启动第三方 App，那需要 shell 身份；这是系统限制，不是工程能绕的。

## License

MIT
