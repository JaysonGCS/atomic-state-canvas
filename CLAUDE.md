# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Build
npm run build                    # Build asc-cli
npm run build:all               # Build all apps (asc-cli, asc-viewer, asc-viewer-cli)
npm run build:viewer-cli        # Build asc-viewer and asc-viewer-cli together

# Development
npm run viewer:dev              # Run asc-viewer dev server
npm run viewer-cli:dev          # Run asc-viewer-cli in dev mode (uses --dev flag)
npm run build:watch             # Watch mode for asc-cli
npx nx mcp asc-viewer-cli       # Run MCP server in dev mode

# Test
npm run test                    # Run all tests once
npm run test:watch              # Run tests in watch mode
npm run test:ui                 # Run tests with Vitest UI

# Lint
npm run lint                    # Run ESLint on all projects

# Release
npm run release-all:dry-run     # Dry run multi-package semantic release
npm run release-all             # Release all packages
```

## Project Structure

This is an Nx monorepo with three main applications and two library packages:

### Apps
- **asc-cli** (`apps/asc-cli`): CLI that generates JSON Canvas files for Recoil state visualization. Entry: `atomic-state-canvas` command.
- **asc-viewer** (`apps/asc-viewer`): React web app for 2D/3D visualization using react-force-graph. Uses Jotai for state, Tailwind for styling.
- **asc-viewer-cli** (`apps/asc-viewer-cli`): CLI that starts a Vite dev server, watches `.asc.` files, and serves the viewer. Also includes MCP server for AI assistant integration. Entry: `asc-viewer` command with subcommands `serve` (default) and `mcp`.

### Libs
- **core** (`libs/core`): Core parsing and graph logic - AST parsing with oxc-parser, graph data structures, layout algorithms, cycle detection.
- **asc-viewer-libs** (`libs/asc-viewer-libs`): Shared types and utilities for the viewer.

## Architecture

### Core Parsing Flow (`libs/core`)
1. **graphUtils.ts**: Reads files, parses AST with oxc-parser, walks with acorn-walk to extract imports and Recoil declarations
2. **plugins/recoil.ts**: Plugin that identifies `atom`, `selector`, `atomFamily`, `selectorFamily` calls and extracts dependencies from `get()` calls
3. **core.ts**: `generateAtomicStateGraph()` builds a dependency graph from an entry file/variable
4. **dataStructure.ts**: `Graph` class maintains adjacency list, edge map, and generates level topology for layout
5. **cycleDetection/index.ts**: DFS-based cycle detection for self-references and cyclic dependencies
6. **graphLayout/**: Two layout algorithms - `SIMPLE_TOPOLOGY` (level-based) and `FORCE_DIRECTED` (d3-force)

### asc-viewer-cli Flow
1. Loads config via cosmiconfig (`.ascrc`, `asc.config.js`, etc.)
2. Uses chokidar to watch for `.asc.` files
3. Generates metadata JSON files in `.atomic-state-canvas/` directory
4. Starts Vite server with custom middleware to serve metadata at `/.atomic-state-canvas`

### MCP Server (`apps/asc-viewer-cli/src/mcp/`)
The MCP server enables AI assistants to interact with the codebase analysis tools:
- **index.ts**: Server setup using `@modelcontextprotocol/sdk` with stdio transport
- **tools.ts**: Defines 4 MCP tools (`analyze_state`, `find_cycles`, `list_atoms`, `launch_viewer`) with Zod schemas
- **viewer.ts**: Extracted viewer launcher logic for reuse by both CLI and MCP

### Plugin System
The `TPluginConfig` interface in `libs/core/src/types.ts` defines how to parse AST nodes for different state libraries. Currently only Recoil is implemented via `libs/core/src/plugins/recoil.ts`.

## Key Patterns

- Uses oxc-parser for fast TypeScript/JavaScript parsing
- Uses acorn-walk for AST traversal (with mock handlers for TS-specific nodes like `TSAsExpression`)
- Graph output follows [JSON Canvas](https://jsoncanvas.org/) spec for Obsidian compatibility
- Config uses cosmiconfig pattern: `.ascrc.json`, `asc.config.js`, `asc.config.ts`
