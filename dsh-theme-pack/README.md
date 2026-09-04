# DSH Theme Pack

为 DeepSeek Harness Web 注册可切换主题。当前包含：

- **Black Hole**：继承 DSH Dark 模式，只调整少量深色 Token；在新会话 Hero 中显示 WebGPU 黑洞背景。
- **Dark**：一键切回 DSH 内置 Dark 主题。

黑洞动态层以 60 FPS 为目标，只在桌面宽屏、未启用“减少动态效果”且 WebGPU 可用时运行。其他环境保留静态深空渐变；离开新会话页或切换主题会释放 GPU 资源。

主题选择保存在 DSH Settings 的 `wxj-theme-pack` 命名空间中，可在页面重载后恢复。渲染层每秒更新一次 `data-fps` 与 `data-target-fps`，并通过 `data-target-resizes` 与 `data-target-size` 暴露中间纹理重建次数和尺寸，便于在真实页面检查动画是否维持目标帧率。

## 本地安装

在本仓库根目录执行：

```bash
pnpm install
pnpm --filter @wxj783428795/dsh-theme-pack verify
pnpm dlx @deepseek-ai/dsh@0.1.2-rc.1 plugin --profile web add ./dsh-theme-pack
```

安装或更新插件后用 pnpm 启动 DSH Web：

```bash
pnpm dlx @deepseek-ai/dsh@0.1.2-rc.1 web
```

然后在“设置 → 常规 → 主题包”中选择 Black Hole。

侧边栏收起/展开的性能回归可在已启用黑洞主题的 DSH Web 上验证：

```bash
DSH_PERF_URL='http://127.0.0.1:端口/?token=令牌' pnpm --filter @wxj783428795/dsh-theme-pack test:perf
```

该测试会确认侧边栏过渡期间最多只重建一次 WebGPU 中间纹理，且最终纹理尺寸与 0.7 DPR 的画布后备尺寸一致。

## 卸载

```bash
pnpm dlx @deepseek-ai/dsh@0.1.2-rc.1 plugin --profile web remove @wxj783428795/dsh-theme-pack
```

## 已知约束

当前 DSH 没有专门的新会话背景槽。插件只通过稳定的 `data-slot="conversation"` 和 `data-phase="hero"` 标记挂载装饰层，不读取 CSS Modules 的哈希类名；如果 DSH 后续提供正式 Hero 背景槽，应迁移到该槽位。
