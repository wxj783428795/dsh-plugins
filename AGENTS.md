# dsh-plugins 开发规范

## 仓库定位

- 本仓库是 DSH 多插件父仓库，每个插件放在独立的 `dsh-*` 子目录中。
- 插件应保持独立的 manifest、构建、测试、文档和发布边界。

## 包管理

- 本仓库及所有插件统一使用 pnpm。
- 禁止直接使用 npm 或 yarn 执行安装、构建、测试、打包和发布。

## DSH 插件加载

- 可发布插件必须声明 `dsh.bundle.patch`，通过 `dsh plugin --profile <name> add <package-or-path>` 安装到隔离 profile 后验证。
- 开发期临时覆盖可使用 `--patch`；不得向 `deepseek-harness/node_modules` 手工创建软链来冒充插件安装或加载成功。
- 本地集成验证优先使用 pnpm 启动与插件目标版本一致的官方 DSH CLI；只有在 `deepseek-harness` 已按上游要求完整构建后，才从源码仓库启动。
- 必须先用 `--dump-config` 确认组合包层已生效，再进行浏览器可视化验证。

## 交付门禁

- 至少通过类型检查、自动化测试、构建、pnpm 打包检查和真实 DSH Web 可视化验证。
- 涉及动画的插件必须验证降级路径、资源释放与目标帧率。
- 动态背景必须覆盖侧边栏收起/展开等常见布局过渡；不得在过渡的每一帧重建 GPU 纹理、surface 或其他重资源。
- 可视化验证和必要修复全部完成前，不得推送远端或发布。
