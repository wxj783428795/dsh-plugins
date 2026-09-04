const STYLE_ID = '@wxj783428795/dsh-theme-black-hole/theme.css'

const CSS = `
.dsh-theme-black-hole-appearance{display:flex;flex-direction:column;gap:8px;padding:16px 0;border-bottom:.5px solid var(--dsw-alias-border-l2)}.dsh-theme-black-hole-appearance-title{font-size:14px;font-weight:400;line-height:22px;color:var(--dsw-alias-label-primary)}.dsh-theme-black-hole-cubes{display:flex;align-items:stretch;gap:8px;flex-wrap:wrap}.dsh-theme-black-hole-cube{box-sizing:border-box;flex:1 1 120px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:20px 18px;border:.5px solid var(--dsw-alias-border-l4);border-radius:20px;background:transparent;font:inherit;font-size:14px;line-height:22px;color:var(--dsw-alias-label-primary);cursor:pointer}.dsh-theme-black-hole-cube:hover:not([aria-checked=true]){background:var(--dsw-alias-interactive-bg-hover)}.dsh-theme-black-hole-cube[aria-checked=true]{background:var(--dsw-alias-bg-module-platform);border-color:var(--dsw-static-neutral-bluish-400)}.dsh-theme-black-hole-cube:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.dsh-theme-black-hole-icon{display:block;width:16px;height:16px;border-radius:50%;background:radial-gradient(circle,#020208 0 27%,#ffc46b 30%,#9b4cff 43%,#111522 61%,#05070d 100%);box-shadow:0 0 5px rgba(155,76,255,.5)}
[data-dsh-black-hole-root][data-phase=hero]{background:#020309}[data-dsh-black-hole-root][data-phase=hero] [data-conversation-scroll]{position:relative;z-index:1;background:transparent}.dsh-black-hole-background{position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:#020309}.dsh-black-hole-canvas{display:block;width:100%;height:100%;opacity:0;transition:opacity 500ms ease}.dsh-black-hole-background[data-mode=ready] .dsh-black-hole-canvas{opacity:.92}.dsh-black-hole-veil{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 55%,rgba(2,3,9,.2) 0,rgba(2,3,9,.08) 34%,rgba(2,3,9,.66) 100%),linear-gradient(90deg,rgba(2,3,9,.5),transparent 38%,rgba(2,3,9,.12));pointer-events:none}@media (prefers-reduced-motion:reduce){.dsh-black-hole-canvas{transition:none}}
`

/** Install the plugin-owned global stylesheet and return its disposer. */
export function installStyles(documentValue: Document = document): () => void {
  const existing = documentValue.querySelector<HTMLStyleElement>(`style[data-plugin-css="${STYLE_ID}"]`)
  if (existing !== null) return () => {}
  const style = documentValue.createElement('style')
  style.dataset.plugin = '@wxj783428795/dsh-theme-black-hole'
  style.dataset.pluginCss = STYLE_ID
  style.textContent = CSS
  documentValue.head.append(style)
  return () => { style.remove() }
}
