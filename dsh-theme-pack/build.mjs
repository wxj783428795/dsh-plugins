import { readFile } from 'node:fs/promises'
import { build } from 'esbuild'
import { transformWgsl } from '@vgpu/wgsl/loader-vite'

const packageId = '@wxj783428795/dsh-theme-pack'

const wgslPlugin = {
  name: 'vgpu-wgsl',
  setup(builder) {
    builder.onLoad({ filter: /\.wgsl$/ }, async ({ path }) => {
      const source = await readFile(path, 'utf8')
      const watchFiles = []
      const transformed = await transformWgsl({
        id: path,
        source,
        minify: true,
        onDependency: dependency => { watchFiles.push(dependency) },
      })
      return { contents: transformed.code, loader: 'js', watchFiles }
    })
  },
}

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  legalComments: 'eof',
})

const banner = [
  '/** Generated browser bundle for @wxj783428795/dsh-theme-pack. */',
  'window.__ModuleLoader__.load({',
  `  id: ${JSON.stringify(packageId)},`,
  '  factory: (require) => {',
  '    var module = { exports: {} };',
  '    var exports = module.exports;',
  '    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });',
].join('\n')

const footer = [
  '',
  '    return module.exports;',
  '  }',
  '});',
  '',
].join('\n')

await build({
  entryPoints: ['src/client/index.tsx'],
  outfile: 'lib/client.js',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  external: [
    'react',
    'react/jsx-runtime',
    '@deepseek-ai/dsh-client-store',
  ],
  plugins: [wgslPlugin],
  banner: { js: banner },
  footer: { js: footer },
  sourcemap: true,
  minify: true,
  legalComments: 'eof',
})

