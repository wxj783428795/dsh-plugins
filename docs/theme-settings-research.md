# DSH 第三方主题设置页接入研究

> 调查日期：2026-09-04  
> DSH 官方源码基线：[`deepseek-ai/deepseek-harness@76fda729`](https://github.com/deepseek-ai/deepseek-harness/tree/76fda729799fe9b3848dbe2c211d4b231032b81e)  
> 本地源码：`/Users/xiaojie.wu/Documents/ChatGPT/dsh-workspace/deepseek-harness`

## 结论

截图中在原生「外观」下再增加一整行「黑洞主题」，从 Slot 契约看是合法的，但对只有一个第三方主题的插件来说，产品语义不自然：同一页出现两个主题选择器、重复出现「深色」，用户也很难判断两行谁是最终权威。

当前 DSH 没有“向原生外观卡片列表追加一项”的细粒度插槽。`ctx.theme.register()` 只把主题注册进运行时，不会让原生「外观」自动出现第四张卡。因此，黑洞插件更合适的方案不是继续追加第二行，而是用 DSH 正式提供的 Slot shadowing 替换原生 `appearance` 行，渲染统一的「浅色 / 深色 / 跟随系统 / 黑洞」四选一界面：

```ts
ctx.slots.inject('settings.general.item', () => ctx.slots.register({
  name: 'settings.general.item',
  id: 'appearance',
  order: 10,
  priority: -10,
  // store / locale / inject ...
}, UnifiedAppearanceRow))
```

官方原生行使用相同 `id: 'appearance'`、`order: 10`，且未指定 `priority`（即默认 `0`）。Slot 的正式规则是：list slot 中相同 `id` 是同一个 cell，不同优先级可以共存，数值更小的 live entry 胜出；插件卸载后，自带行会自然恢复。该方案不需要改 DSH 上游源码，也不需要用 DOM 查询隐藏原生控件。

黑洞选择仍必须写入插件自己的 settings namespace。官方 `ui-theme.preference` schema 只接受 `light | dark | system`；第三方 id 只存在于进程内注册表，不会由官方主题设置自动持久化。

## 官方实现事实

### 1. 原生「外观」不是动态主题目录

原生 `AppearanceRow` 把三张卡硬编码为 `light`、`dark`、`system`，渲染时只遍历这个常量，并不读取 `ThemeSnapshot.themes`。因此第三方调用 `ctx.theme.register()` 后，原生行不会自动增加卡片。

- 本地：`deepseek-harness/packages/client/ui-theme/src/client/AppearanceRow.tsx:30-60`
- 远端：[AppearanceRow.tsx#L30-L60](https://github.com/deepseek-ai/deepseek-harness/blob/76fda729799fe9b3848dbe2c211d4b231032b81e/packages/client/ui-theme/src/client/AppearanceRow.tsx#L30-L60)

原生行通过 `settings.general.item` 注册，cell id 为 `appearance`，显示顺序为 `10`。

- 本地：`deepseek-harness/packages/client/ui-theme/src/client/index.ts:415-461`
- 远端：[ui-theme/client/index.ts#L415-L461](https://github.com/deepseek-ai/deepseek-harness/blob/76fda729799fe9b3848dbe2c211d4b231032b81e/packages/client/ui-theme/src/client/index.ts#L415-L461)

### 2. 运行时支持第三方可选主题，但持久化只覆盖内置偏好

官方 `ThemeRuntime` 的公开能力已经足够完成第三方主题的运行时接入：

- `register({ id, colorScheme, tokens })` 注册主题并返回 disposer；
- `setTheme(id)` 接受 `system` 或任意已注册 id；
- `getTheme()` / `theme/change` 提供 `preference`、`active`、`themes`、`revision`；
- `overrideTokens(source, tokens)` 在当前主题上叠加可撤销的 token 层。

来源：

- 本地：`deepseek-harness/packages/client/ui-theme/src/client/index.ts:66-94,225-290,292-357`
- 远端：[ThemeRuntime 注册与切换](https://github.com/deepseek-ai/deepseek-harness/blob/76fda729799fe9b3848dbe2c211d4b231032b81e/packages/client/ui-theme/src/client/index.ts#L225-L357)
- 官方测试明确验证 `sepia` 可注册、可切换，但 custom id 不调用 Host settings 写入：[theme.client.spec.ts#L117-L128](https://github.com/deepseek-ai/deepseek-harness/blob/76fda729799fe9b3848dbe2c211d4b231032b81e/packages/client/ui-theme/tests/theme.client.spec.ts#L117-L128)

官方主题 schema 的联合类型只包含三个内置值；`setTheme()` 也只在 id 通过 `isThemePreference()` 时调用 Host scope 的 `set()`。

- 本地：`deepseek-harness/packages/client/ui-theme/src/theme-settings.ts:5-21,40-43`
- 远端：[theme-settings.ts#L5-L43](https://github.com/deepseek-ai/deepseek-harness/blob/76fda729799fe9b3848dbe2c211d4b231032b81e/packages/client/ui-theme/src/theme-settings.ts#L5-L43)
- 官方包文档也明确写明第三方主题 id 是进程内扩展，不跨越内置 settings schema：[ui-theme README.zh.md#L28-L36](https://github.com/deepseek-ai/deepseek-harness/blob/76fda729799fe9b3848dbe2c211d4b231032b81e/packages/client/ui-theme/README.zh.md#L28-L36)

### 3. General 行与完整页面是两个不同层级

`settings.general.item` 是“一个无需独立页面的紧凑偏好行”；行的文案、状态、写入路径和内部布局都归功能插件所有。复杂功能则应注册 `settings.section`，得到左侧导航中的独立页面。

- 本地：`deepseek-harness/packages/client/ui-settings/src/client/contract/slots.ts:44-89`
- 远端：[settings slot contract#L44-L89](https://github.com/deepseek-ai/deepseek-harness/blob/76fda729799fe9b3848dbe2c211d4b231032b81e/packages/client/ui-settings/src/client/contract/slots.ts#L44-L89)
- General 外壳只是行容器，不拥有任何内置行：[ui-settings-general README.zh.md#L28-L32](https://github.com/deepseek-ai/deepseek-harness/blob/76fda729799fe9b3848dbe2c211d4b231032b81e/packages/client/ui-settings-general/README.zh.md#L28-L32)

### 4. Slot shadowing 是正式扩展机制

list slot 注册项可以设置 `priority`。相同 `id`、不同优先级的项可以共存；升序排列后最低优先级的 live entry 渲染。相同 id、相同 priority 才会报重复注册。

- 本地：`deepseek-harness/packages/client/ui-slots/src/index.ts:507-526,737-755,818-850,892-900,956-980`
- 远端：[list priority 类型契约](https://github.com/deepseek-ai/deepseek-harness/blob/76fda729799fe9b3848dbe2c211d4b231032b81e/packages/client/ui-slots/src/index.ts#L507-L526)
- 远端：[shadowing 语义](https://github.com/deepseek-ai/deepseek-harness/blob/76fda729799fe9b3848dbe2c211d4b231032b81e/packages/client/ui-slots/src/index.ts#L737-L755)
- 远端：[注册与排序实现](https://github.com/deepseek-ai/deepseek-harness/blob/76fda729799fe9b3848dbe2c211d4b231032b81e/packages/client/ui-slots/src/index.ts#L818-L900)

这意味着第三方插件可以注册同一 `settings.general.item`、同一 `id: 'appearance'`、更低的 `priority`，完整替换原生三卡行；其 disposer 生效后，原生 entry 会重新成为 winner。

## 现有主题项目怎么做

以下是主题项目自身仓库和包元数据描述的行为；它们是各项目的一手来源，不代表 DSH 官方推荐。

| 项目 | 主题规模 | 设置入口 | 观察 |
| --- | ---: | --- | --- |
| [`@dshthemes/ui`](https://github.com/orxz/deepseek-harness-themes/tree/f83ad9980be8b8e47d02e1c3cf8443ab6a02bee3/packages/ui) | 11 个主题，并枚举其他插件主题 | 另注册 `settings.general.item`，`id: themes`、`order: 11` | 自己的行同时再次显示三种内置偏好和所有第三方主题，选择逻辑完整，但与宿主原生外观行在语义上重复。源码：[client.ts#L68-L137](https://github.com/orxz/deepseek-harness-themes/blob/f83ad9980be8b8e47d02e1c3cf8443ab6a02bee3/packages/ui/src/client.ts#L68-L137)、[ThemePickerRow.tsx#L22-L69](https://github.com/orxz/deepseek-harness-themes/blob/f83ad9980be8b8e47d02e1c3cf8443ab6a02bee3/packages/ui/src/ThemePickerRow.tsx#L22-L69)。Host 半侧注册自己的持久化 namespace：[index.ts#L31-L39](https://github.com/orxz/deepseek-harness-themes/blob/f83ad9980be8b8e47d02e1c3cf8443ab6a02bee3/packages/ui/src/index.ts#L31-L39)。 |
| [`dsh-catppuccin`](https://github.com/zhijun-dai/Catppuccin-dsh-theme/tree/f00241842e94c2a659aa0af47b3f1070c60f7a15) | 4 个主题 | 在原生外观下方另加 Catppuccin 行 | 项目文档明确描述为“外观下方提供一行”，属于常见但仍会形成第二个主题选择器的做法。[README.zh.md#L35-L48](https://github.com/zhijun-dai/Catppuccin-dsh-theme/blob/f00241842e94c2a659aa0af47b3f1070c60f7a15/README.zh.md#L35-L48) |
| [`dsh-themes`](https://github.com/EthanHannn/dsh-theme/tree/559781514c6ffb8252da91b21940522041be19cb) | 13 个主题家族 | General 中一行统一入口 | 项目把家族、浅/深/系统和壁纸浓度集中到同一主题行，并明确提醒同时安装旧独立主题会造成“设置页出现多行入口”。[README.md#L1-L4](https://github.com/EthanHannn/dsh-theme/blob/559781514c6ffb8252da91b21940522041be19cb/README.md#L1-L4)、[README.md#L44-L60](https://github.com/EthanHannn/dsh-theme/blob/559781514c6ffb8252da91b21940522041be19cb/README.md#L44-L60) |
| [`dsh-theme-plugin`](https://github.com/nevertoday/dsh-theme-plugin/tree/b85a37bc252ad423b2d3aee45fa4e2a72e15ca94) | 98 套传统色主题 | 独立顶级 `settings.section` | 主题数量已经超过紧凑行的承载能力，项目采用可搜索、分组、筛选的完整页面；这是 `settings.section` 合理使用的代表。[client/index.ts#L257-L312](https://github.com/nevertoday/dsh-theme-plugin/blob/b85a37bc252ad423b2d3aee45fa4e2a72e15ca94/src/client/index.ts#L257-L312) |
| [`dsh-ui-appearance`](https://github.com/TQSY114514/dsh-ui-appearance/tree/4b665e85287c167ddc12fbdb8d7dee20adb75d77) | 预设 + 颜色/壁纸/模糊等参数 | `settings.general.item` 的可折叠“个性化外观”行 | 它不是单纯的离散主题选择器，而是复杂外观编辑器，因此单独可折叠行有独立语义。[client/index.ts#L243-L257](https://github.com/TQSY114514/dsh-ui-appearance/blob/4b665e85287c167ddc12fbdb8d7dee20adb75d77/src/client/index.ts#L243-L257) |
| [`@donghuixin/dsh-client-ui-themes`](https://github.com/donghuixin/deepseek-harness-themes/tree/94764e8c22a2ada20b816d0e4077ef971fb2f494) | 5 个主题 | 会话头部右上角菜单 | 绕开设置页，在高频界面放主题切换入口；这更适合快速切换工具，不适合作为设置页一致性范例。[README.md#L1-L11](https://github.com/donghuixin/deepseek-harness-themes/blob/94764e8c22a2ada20b816d0e4077ef971fb2f494/README.md#L1-L11)、[README.md#L95-L107](https://github.com/donghuixin/deepseek-harness-themes/blob/94764e8c22a2ada20b816d0e4077ef971fb2f494/README.md#L95-L107) |

从这些项目可以看出，生态中“另加一行”是普遍的兼容实现，原因不是原生行会自动接纳第三方主题，而恰恰是原生行没有卡片级扩展点。它能工作，但不等于对单主题插件就是最佳交互。

## 对黑洞主题的建议设计

### 设置页

只保留一个标题为「外观」的四卡单选组：

1. 浅色
2. 深色
3. 跟随系统
4. 黑洞

黑洞卡与前三卡在同一组中，使用 `role="radiogroup"` / `role="radio"`、`aria-checked` 和方向键导航。黑洞可以用小型静态预览作为识别面，但卡片尺寸、边框、选中态和焦点态应沿用原生外观行。

### 注册与状态

- 用 `ctx.effect(() => ctx.theme.register(...))` 注册 `black-hole`，保证插件卸载或 HMR 时清理。
- 统一行的数据以 `ctx.theme.getTheme()` 和 `theme/change` 为单一运行时事实来源。
- 选中态读取 `snapshot.preference`，不能只比较 `snapshot.active.id`。当偏好是 `system` 时，`active.id` 会解析成 `light` 或 `dark`，只看 active 会把“跟随系统”错误显示成浅色或深色。
- 黑洞主题设置 `colorScheme: 'dark'`，并保持空 token 覆盖，完整复用 DSH Dark 调色板；黑洞视觉只存在于新会话背景层。
- WebGPU 背景的启动、暂停、资源回收仍跟随黑洞是否为活动 preference，与设置行替换相互独立。

### 持久化

- 保留插件自有 Host schema，例如 namespace `dsh-theme-black-hole`，字段可为 `theme: 'off' | 'black-hole'` 或现有等价结构。
- 用户点黑洞：先持久化插件选择，再 `ctx.theme.setTheme('black-hole')`。
- 用户点浅色 / 深色 / 跟随系统：清除插件选择（或写 `off`），再 `ctx.theme.setTheme(id)`，让官方 `ui-theme` scope 保存内置偏好。
- 启动恢复时先等插件自有 scope ready，确认黑洞主题已注册，再调用 `setTheme('black-hole')`；应继续保留 revision / pending-write 防竞态逻辑。
- 不要把 `black-hole` 写入 `ui-theme.preference`；官方 schema 会拒绝它。

### 插槽

- 目标：`settings.general.item`
- cell：`id: 'appearance'`
- 顺序：`order: 10`
- shadowing：显式 `priority: -10`（原生默认为 `0`）
- 通过 `ctx.slots.inject('settings.general.item', ...)` 等待 slot 声明，避免加载顺序依赖。
- 不查询或删除原生 DOM，不依赖 CSS Modules 生成类名。

## 可复用扩展点清单

| 扩展点 | 用途 | 黑洞主题是否使用 |
| --- | --- | --- |
| `ctx.theme.register()` | 注册一个有独立 id、明暗语义和 token 覆盖的可选主题 | 是 |
| `ctx.theme.setTheme()` | 切换内置或已注册主题 | 是 |
| `ctx.theme.getTheme()` | 读取 preference、解析后的 active、注册目录和 revision | 是 |
| `theme/change` | 同步 UI、背景生命周期和外部主题切换 | 是 |
| `ctx.theme.overrideTokens()` | 在当前主题上追加可撤销 token 层，不创建新主题身份 | 可选；黑洞已是独立主题时通常不必再用 |
| `settings.general.item` | 紧凑的 General 偏好行 | 是，并 shadow 原生 appearance cell |
| `settings.section` | 有搜索、分组、几十个主题或大量参数时的独立页面 | 否，单个黑洞主题过重 |
| `settingsScope` + Host `settings.register()` | 第三方选择的 schema 校验与跨重启持久化 | 是 |
| Slot `priority` shadowing | 无侵入替换同 id 的原生设置行，卸载后自动回退 | 是 |
| `ctx.effect()` | 绑定主题注册、事件、GPU 和 Slot 生命周期 | 是 |

## 决策

对当前 `dsh-theme-black-hole`：

- 不保留截图中的独立「黑洞主题」行；
- 不新建独立主题设置页面；
- 不修改 deepseek-harness 上游源码；
- 使用同 id + 更低 priority shadow 原生 `appearance` 行；
- 在一组四张卡里呈现内置三项和黑洞；
- 继续用插件自有 settings namespace 持久化黑洞选择。

这兼顾了当前官方能力边界、卸载可逆性和用户对“主题只有一个选择权威”的直觉。
