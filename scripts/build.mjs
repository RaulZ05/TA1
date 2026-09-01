import esbuild from 'esbuild';
import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

async function main() {
  await rm(dist, { recursive: true, force: true });
  await mkdir(path.join(dist, 'js'), { recursive: true });

  const jsSrc = path.join(root, 'js');
  for (const file of await readdir(jsSrc)) {
    if (!file.endsWith('.js')) continue;
    await esbuild.build({
      entryPoints: [path.join(jsSrc, file)],
      outfile: path.join(dist, 'js', file),
      bundle: false,
      minify: true,
      sourcemap: false,
      target: ['es2019']
    });
  }

  await cp(path.join(root, 'css'), path.join(dist, 'css'), { recursive: true });
  await cp(path.join(root, 'img'), path.join(dist, 'img'), { recursive: true });

  const html = (await readdir(root)).filter((f) => f.endsWith('.html'));
  for (const file of html) {
    await cp(path.join(root, file), path.join(dist, file));
  }

  console.log(`✅ Build completado en ${dist} (${html.length} HTML, JS minificado, CSS e imágenes copiadas)`);
}

main().catch((err) => {
  console.error('❌ Build fallido:', err);
  process.exit(1);
});