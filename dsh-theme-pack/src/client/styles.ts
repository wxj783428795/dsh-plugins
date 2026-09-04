const STYLE_ID = '@wxj783428795/dsh-theme-pack/theme.css'

const CSS = `
.dsh-theme-pack-row{display:flex;flex-direction:column;gap:10px}.dsh-theme-pack-title{font:var(--dsw-font-sm-14);font-weight:500;color:var(--dsw-alias-label-primary)}.dsh-theme-pack-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.dsh-theme-pack-option{display:flex;align-items:center;gap:10px;min-height:48px;padding:8px 10px;border:.5px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);cursor:pointer}.dsh-theme-pack-option:hover{background:var(--dsw-alias-interactive-bg-hover)}.dsh-theme-pack-option[aria-pressed=true]{border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-label-primary);box-shadow:inset 0 0 0 .5px var(--dsw-alias-state-business-primary)}.dsh-theme-pack-option:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.dsh-theme-pack-swatch{width:30px;height:24px;flex:none;border:.5px solid var(--dsw-alias-border-l2);border-radius:7px}.dsh-theme-pack-swatch-dark{background:linear-gradient(135deg,#151820 0 52%,#242a38 52%)}.dsh-theme-pack-swatch-black-hole{background:radial-gradient(circle at 63% 48%,#020208 0 14%,#ffb66d 15%,#9b4cff 22%,transparent 38%),#05070d}.dsh-theme-pack-hint{margin:0;color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xs-13)}
[data-dsh-black-hole-root][data-phase=hero]{background:#020309}[data-dsh-black-hole-root][data-phase=hero] [data-conversation-scroll]{position:relative;z-index:1;background:transparent}.dsh-black-hole-background{position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:radial-gradient(circle at 72% 42%,rgba(109,62,184,.23),transparent 25%),radial-gradient(circle at 76% 45%,#020208 0 11%,rgba(231,126,68,.15) 13%,transparent 28%),linear-gradient(135deg,#020309,#070b15 58%,#020309)}.dsh-black-hole-canvas{display:block;width:100%;height:100%;opacity:0;transition:opacity 500ms ease}.dsh-black-hole-background[data-mode=ready] .dsh-black-hole-canvas{opacity:.92}.dsh-black-hole-veil{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 55%,rgba(2,3,9,.2) 0,rgba(2,3,9,.08) 34%,rgba(2,3,9,.66) 100%),linear-gradient(90deg,rgba(2,3,9,.5),transparent 38%,rgba(2,3,9,.12));pointer-events:none}@media (prefers-reduced-motion:reduce){.dsh-black-hole-canvas{transition:none}}
`

/** Install the plugin-owned global stylesheet and return its disposer. */
export function installStyles(documentValue: Document = document): () => void {
  const existing = documentValue.querySelector<HTMLStyleElement>(`style[data-plugin-css="${STYLE_ID}"]`)
  if (existing !== null) return () => {}
  const style = documentValue.createElement('style')
  style.dataset.plugin = '@wxj783428795/dsh-theme-pack'
  style.dataset.pluginCss = STYLE_ID
  style.textContent = CSS
  documentValue.head.append(style)
  return () => { style.remove() }
}

