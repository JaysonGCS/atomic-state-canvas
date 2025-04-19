#!/usr/bin/env node
import { logMsg } from '@atomic-state-canvas/core';
import path from 'path';
import { createServer } from 'vite';

const isDev = process.argv.includes('--dev');

const watchAndGenerateMetadata = async () => {
  // TODO: Implement metadata generation logic
};

async function main() {
  await watchAndGenerateMetadata();

  const viewerPath = isDev
    ? path.resolve(process.cwd(), 'apps/asc-viewer')
    : path.resolve(process.cwd(), 'dist/apps/asc-viewer');

  const server = await createServer({
    root: viewerPath,
    server: {
      port: 1296
    }
  });

  await server.listen();
  logMsg(
    `🚀 Atomic State Canvas Viewer running at http://localhost:1296 (${isDev ? 'dev' : 'prod'} mode)`
  );
}

void main();
