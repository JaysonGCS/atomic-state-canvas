#!/usr/bin/env node
import { logMsg } from '@atomic-state-canvas/core';
import chokidar from 'chokidar';
import { cosmiconfig } from 'cosmiconfig';
import path from 'path';
import { createServer } from 'vite';
import {
  DEFAULT_EXTENSIONS,
  DEFAULT_METADATA_DIR_NAME,
  DEFAULT_PORT,
  DEFAULT_WATCH_DIR
} from './constants';
import { IAscConfig } from '@atomic-state-canvas/asc-viewer-libs';
import { loadConfig } from './configUtils';
import { generateMetadata } from './metadataUtils';

const explorer = cosmiconfig('asc');

const isDev = process.argv.includes('--dev');

const watchAndGenerateMetadata = (params: { watchDir: string; extensions: string[] }) => {
  const { watchDir, extensions } = params;
  logMsg(`Setting up file watcher on ${watchDir}`);
  const watcher = chokidar.watch(watchDir, {
    ignored: (path, stats) => {
      if (path.includes(DEFAULT_METADATA_DIR_NAME)) {
        return true;
      }
      return stats?.isFile() && !extensions.some((ext) => path.endsWith(ext));
    }
  });
  watcher.on('add', generateMetadata);
  watcher.on('change', generateMetadata);
};

async function main() {
  const config: IAscConfig = await loadConfig(explorer);
  const {
    port = DEFAULT_PORT,
    watchDir = path.resolve(process.cwd(), DEFAULT_WATCH_DIR),
    extensions = DEFAULT_EXTENSIONS
  } = config;
  watchAndGenerateMetadata({ watchDir, extensions });

  const viewerPath = isDev
    ? path.resolve(process.cwd(), 'apps/asc-viewer')
    : path.resolve(process.cwd(), 'dist/apps/asc-viewer');

  const server = await createServer({
    root: viewerPath,
    server: {
      port
    }
  });

  await server.listen();
  logMsg(
    `🚀 Atomic State Canvas Viewer running at http://localhost:${port} (${isDev ? 'dev' : 'prod'} mode)`
  );
}

void main();
