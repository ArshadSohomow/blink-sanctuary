// Blink build script — bundles src/ with esbuild and copies public/ into dist/.
// Usage: node build.mjs          → production build in dist/
//        node build.mjs --serve  → dev server on http://localhost:5173 with rebuild on change
import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';

const serve = process.argv.includes('--serve');
const outdir = 'dist';

rmSync(outdir, { recursive: true, force: true });
mkdirSync(`${outdir}/assets`, { recursive: true });
cpSync('public', outdir, { recursive: true });

const version = Date.now().toString(36);
const html = readFileSync('index.html', 'utf8').replaceAll('__V__', version);
writeFileSync(`${outdir}/index.html`, html);

const options = {
  entryPoints: { app: 'src/main.tsx' },
  bundle: true,
  outdir: `${outdir}/assets`,
  format: 'esm',
  jsx: 'automatic',
  target: ['es2020', 'safari15'],
  minify: !serve,
  sourcemap: serve,
  define: { 'process.env.NODE_ENV': serve ? '"development"' : '"production"' },
  loader: { '.svg': 'text' },
  logLevel: 'info',
};

if (serve) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: outdir, port: 5173 });
  console.log(`Blink dev server → http://localhost:${port}`);
} else {
  await esbuild.build(options);
  console.log('Built to dist/');
}
