#!/usr/bin/env node
import { generateAtomicStateGraph, logMsg } from '@atomic-state-canvas/core';
import chokidar from 'chokidar';
import { promises as fs } from 'fs';
import path from 'path';
import { createServer } from 'vite';
import { findAscEntryDetails, loadConfig } from './utils';
import { cosmiconfig } from 'cosmiconfig';
import { IAscConfig } from './types';

const explorer = cosmiconfig('asc');

const isDev = process.argv.includes('--dev');
const DEFAULT_PORT = 1296;
const DEFAULT_WATCH_DIR = path.resolve(process.cwd(), 'src');
const DEFAULT_EXTENSIONS = ['.asc.js', '.asc.ts'];

const OUT_DIR = path.resolve(process.cwd(), '.atomic-state-canvas');

async function generateMetadata(ascFilePath: string) {
  try {
    const { pathName, ascObject } = await findAscEntryDetails(ascFilePath);
    if (pathName !== undefined && ascObject !== undefined) {
      // @ts-expect-error -- Ignore type error for now
      const { graph, entryNodeId } = generateAtomicStateGraph(pathName, ascObject.plugin, {
        searchVariableName: ascObject.entry as string,
        excludePatternInGlob: undefined
      });
      const { getEdgeList } = graph.getInternalData();
      const reverseEdges = getEdgeList();

      const metadata = {
        ascFilePath,
        timestamp: Date.now(),
        ascObject,
        entryNodeId,
        pathName,
        reverseEdges: reverseEdges
      };
      const outPath = path.join(OUT_DIR, path.basename(ascFilePath) + '.json');
      await fs.mkdir(OUT_DIR, { recursive: true });
      await fs.writeFile(outPath, JSON.stringify(metadata, null, 2), 'utf-8');
      logMsg(`Generated metadata: ${outPath}`);
    } else {
      console.error(`Unable to generate metadata for ${ascFilePath}`);
    }
  } catch (error) {
    console.error(`Error generating metadata for ${ascFilePath}: ${error}`);
  }
}

const watchAndGenerateMetadata = (params: { watchDir: string; extensions: string[] }) => {
  const { watchDir, extensions } = params;
  logMsg(`Setting up file watcher on ${watchDir}`);
  // TODO: Implement metadata generation logic
  const watcher = chokidar.watch(watchDir, {
    ignored: (path, stats) => {
      if (path.includes('.atomic-state-canvas')) {
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
    watchDir = DEFAULT_WATCH_DIR,
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
