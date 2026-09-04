# dsh-plugins

用于开发和维护 DeepSeek Harness 插件的多插件仓库。

## 插件

- [`dsh-theme-black-hole`](./dsh-theme-black-hole/)：基于 DSH Dark 模式的可切换动态黑洞主题。

## 开发

```bash
pnpm install
pnpm verify
```

各插件保持独立的 `package.json`、构建产物、安装说明和版本号。仓库根目录只负责统一依赖与批量校验。

开发与交付约束见 [`AGENTS.md`](./AGENTS.md)：统一使用 pnpm，并且插件必须通过隔离 profile 的真实 DSH Web 可视化验证后才能推送。
