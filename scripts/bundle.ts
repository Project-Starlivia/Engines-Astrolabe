// Copy the Vite single-file build output to the canonical artifact path.
// Run by Bun after `vite build` (see package.json "build").
const SRC = 'dist/index.html';
const OUT = 'strune.html';

const html = await Bun.file(SRC).text();
await Bun.write(OUT, html);
console.log(`${OUT} written from ${SRC} (${html.length} bytes)`);
