import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Emit a single self-contained HTML (JS/CSS inlined) so the viewer keeps
// working from file:// with zero runtime dependencies — the project's core virtue.
export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 100_000,
  },
});
