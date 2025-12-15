import { logMsg } from '@atomic-state-canvas/core';
import chokidar from 'chokidar';
import { cosmiconfig } from 'cosmiconfig';
import path from 'path';
import fs from 'fs';
import { createServer, PluginOption, ViteDevServer } from 'vite';
import {
  DEFAULT_EXTENSIONS,
  DEFAULT_METADATA_DIR_NAME,
  DEFAULT_PORT,
  DEFAULT_WATCH_DIR
} from '../constants';
import { IAscConfig } from '@atomic-state-canvas/asc-viewer-libs';
import { loadConfig } from '../configUtils';
import { generateMetadata } from '../metadataUtils';

const explorer = cosmiconfig('asc');

const checkAndClearFolder = (folderPath: string) => {
  try {
    if (fs.existsSync(folderPath)) {
      const files = fs.readdirSync(folderPath);

      for (const file of files) {
        const filePath = path.join(folderPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          fs.rmdirSync(filePath, { recursive: true });
        } else {
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

const watchAndGenerateMetadata = (params: {
  watchDir: string;
  extensions: string[];
  excludePatternInGlob: string | undefined;
}) => {
  const { watchDir, extensions, excludePatternInGlob } = params;
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
  watcher.on('add', (path) => generateMetadata(path, excludePatternInGlob));
  watcher.on('change', (path) => generateMetadata(path, excludePatternInGlob));
  return watcher;
};

const customPlugin = (): PluginOption => {
  return {
    name: 'configure-server',
    configureServer(server) {
      server.middlewares.use('/.atomic-state-canvas', async (req, res) => {
        const fs = await import('fs/promises');
        const path = await import('path');
        try {
          const files = await fs.readdir(DEFAULT_METADATA_DIR_NAME);
          const data = await Promise.all(
            files.map(async (f) =>
              JSON.parse(await fs.readFile(path.join(DEFAULT_METADATA_DIR_NAME, f), 'utf-8'))
            )
          );
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        } catch (err) {
          console.error(err);
          res.end(JSON.stringify([]));
        }
      });
    }
  };
};

export interface LaunchViewerOptions {
  port?: number;
  watchDir?: string;
  isDev?: boolean;
}

export interface LaunchViewerResult {
  server: ViteDevServer;
  port: number;
  url: string;
}

export async function launchViewer(options?: LaunchViewerOptions): Promise<LaunchViewerResult> {
  const config: IAscConfig = await loadConfig(explorer);
  const isDev = options?.isDev ?? process.argv.includes('--dev');
  const {
    port = options?.port ?? DEFAULT_PORT,
    watchDir = options?.watchDir ?? path.resolve(process.cwd(), DEFAULT_WATCH_DIR),
    extensions = DEFAULT_EXTENSIONS,
    excludePatternInGlob
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

  watchAndGenerateMetadata({ watchDir, extensions, excludePatternInGlob });

  await server.listen();

  const actualPort = server.config.server.port ?? port;
  const url = `http://localhost:${actualPort}`;

  return {
    server,
    port: actualPort,
    url
  };
}
