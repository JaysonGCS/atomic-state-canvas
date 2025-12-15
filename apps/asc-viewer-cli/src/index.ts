#!/usr/bin/env node
import { Command } from 'commander';
import { logMsg } from '@atomic-state-canvas/core';
import { launchViewer } from './mcp/viewer';
import { startMcpServer } from './mcp/index';

const program = new Command();

program.name('asc-viewer').description('Atomic State Canvas Viewer CLI').version('0.0.1');

// Default command - launch viewer (serve)
program
  .command('serve', { isDefault: true })
  .description('Start the Atomic State Canvas viewer server')
  .option('-p, --port <port>', 'Port to run the viewer on')
  .option('-w, --watch-dir <dir>', 'Directory to watch for .asc files')
  .option('--dev', 'Run in development mode')
  .action(async (options: { port?: string; watchDir?: string; dev?: boolean }) => {
    try {
      const result = await launchViewer({
        port: options.port ? parseInt(options.port, 10) : undefined,
        watchDir: options.watchDir,
        isDev: options.dev
      });
      logMsg(
        `Atomic State Canvas Viewer running at ${result.url} (${options.dev ? 'dev' : 'prod'} mode)`
      );
    } catch (error) {
      console.error('Failed to start viewer:', error);
      process.exit(1);
    }
  });

// MCP subcommand
program
  .command('mcp')
  .description('Start the MCP server for AI assistant integration')
  .action(async () => {
    try {
      await startMcpServer();
    } catch (error) {
      console.error('Failed to start MCP server:', error);
      process.exit(1);
    }
  });

program.parse();
