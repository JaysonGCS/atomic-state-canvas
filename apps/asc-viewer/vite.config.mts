/// <reference types='vitest' />
import { defineConfig, PluginOption, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

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
  resolve: {
    alias: {
      '@atomic-state-canvas/components': path.resolve(__dirname, './src/components')
    }
  },
  plugins: [react(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md']), tailwindcss()],
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
