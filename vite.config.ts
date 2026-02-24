import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import { resolve } from 'path';

// VS Code sets ELECTRON_RUN_AS_NODE=1 which breaks Electron's main process.
// Remove it so the plugin can launch Electron properly.
delete process.env.ELECTRON_RUN_AS_NODE;

export default defineConfig({
  root: 'src',
  publicDir: resolve(__dirname, 'assets'),
  plugins: [
    electron([
      {
        entry: resolve(__dirname, 'electron/main.ts'),
        onstart({ startup }) {
          startup();
        },
        vite: {
          build: {
            outDir: resolve(__dirname, 'dist-electron'),
          },
        },
      },
      {
        entry: resolve(__dirname, 'electron/preload.ts'),
        onstart({ reload }) {
          reload();
        },
        vite: {
          build: {
            outDir: resolve(__dirname, 'dist-electron'),
            rollupOptions: {
              output: {
                format: 'cjs',
              },
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    assetsInlineLimit: 0,
  },
});
