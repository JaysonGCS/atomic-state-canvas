/// <reference types='vitest' />
import { defineConfig, PluginOption, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import tailwindcss from '@tailwindcss/vite';

const customPlugin = (): PluginOption => {
  return {
    name: 'configure-server',
    configureServer(server) {
      server.middlewares.use('/.atomic-state-canvas', async (req, res) => {
        const fs = await import('fs/promises');
        const path = await import('path');
        const files = await fs.readdir('.atomic-state-canvas');
        const data = await Promise.all(
          files.map(async (f) =>
            JSON.parse(await fs.readFile(path.join('.atomic-state-canvas', f), 'utf-8'))
          )
        );
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      });
    }
  };
};

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../node_modules/.vite/asc-viewer',
  server: {
    port: 1296,
    host: 'localhost',
    fs: { allow: [searchForWorkspaceRoot(process.cwd()), '.atomic-state-canvas'] }
  },
  preview: {
    port: 1296,
    host: 'localhost'
  },
  plugins: [react(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md']), customPlugin(), tailwindcss()],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  build: {
    outDir: '../dist/asc-viewer',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../coverage/asc-viewer',
      provider: 'v8' as const
    }
  }
}));
