#!/usr/bin/env node
import { logMsg } from '@atomic-state-canvas/core';
import chokidar from 'chokidar';
import { cosmiconfig } from 'cosmiconfig';
import path from 'path';
import fs from 'fs';
import { createServer, PluginOption } from 'vite';
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

const checkAndClearFolder = (folderPath: string) => {
  try {
    if (fs.existsSync(folderPath)) {
      const files = fs.readdirSync(folderPath);

      for (const file of files) {
        const filePath = path.join(folderPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          // Recursively delete subdirectories
          fs.rmdirSync(filePath, { recursive: true });
        } else {
          // Delete files
          fs.unlinkSync(filePath);
        }
      }
      logMsg(`Folder "${folderPath}" cleared successfully.`);
    } else {
      logMsg(`Folder "${folderPath}" does not exist.`);
    }
  } catch (error) {
    console.error(`An error occurred: ${error}`);
  }
};

const watchAndGenerateMetadata = (params: { watchDir: string; extensions: string[] }) => {
  const { watchDir, extensions } = params;
  checkAndClearFolder(DEFAULT_METADATA_DIR_NAME);
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

async function main() {
  const config: IAscConfig = await loadConfig(explorer);
  const {
    port = DEFAULT_PORT,
    watchDir = path.resolve(process.cwd(), DEFAULT_WATCH_DIR),
    extensions = DEFAULT_EXTENSIONS
  } = config;
  const viewerPath = isDev
    ? path.resolve(process.cwd(), 'apps/asc-viewer')
    : path.resolve(__dirname, 'asc-viewer');

  const server = await createServer({
    root: viewerPath,
    server: {
      port
    },
    plugins: [customPlugin()]
  });
  // TODO: Add server.restart() to watcher
  watchAndGenerateMetadata({ watchDir, extensions });

  await server.listen();
  logMsg(
    `🚀 Atomic State Canvas Viewer running at http://localhost:${port} (${isDev ? 'dev' : 'prod'} mode)`
  );
}

void main();
