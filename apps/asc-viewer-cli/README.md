# Atomic State Canvas Viewer CLI

An interactive web application for analyzing and visualizing atomic state relationships. By launching the development tool, it looks for ".asc." files in the directory and automatically populates the atomic graphs in a "Storybook"-like experience.

## Installation
```bash
npm install @atomic-state-canvas/asc-viewer-cli -D
```

## Configuration

The CLI uses [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig) for configuration. Create one of the following files in your project root:

- `.ascrc.json`
- `.ascrc.js`
- `.ascrc.yaml`
- `asc.config.js`
- `asc.config.ts`

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `watchDir` | `string` | `"src"` | Directory to watch for `.asc.` files |
| `port` | `number` | `1296` | Port to run the viewer server on |
| `extensions` | `string[]` | `[".asc.js", ".asc.ts"]` | File extensions to watch |
| `excludePatternInGlob` | `string` | `undefined` | Glob pattern to exclude files |

### Example Configuration

`.ascrc.json`:
```json
{
  "watchDir": "./src",
  "port": 3000,
  "extensions": [".asc.ts"],
  "excludePatternInGlob": "*.test.ts"
}
```

`asc.config.js`:
```js
module.exports = {
  watchDir: './src/stores',
  port: 1296,
  extensions: ['.asc.ts', '.asc.js'],
  excludePatternInGlob: '**/*.test.*'
};
```

## Usage

### Start the Viewer
```bash
# Start the viewer (default command)
npx asc-viewer

# With options
npx asc-viewer serve --port 3000 --watch-dir ./src
```

### MCP Server (AI Assistant Integration)

Start the MCP server for AI assistant integration:
```bash
npx asc-viewer mcp
```

Add to your Claude Code config (`.mcp.json`):
```json
{
  "mcpServers": {
    "atomic-state-canvas": {
      "command": "npx",
      "args": ["@atomic-state-canvas/asc-viewer-cli", "mcp"]
    }
  }
}
```

#### Available MCP Tools

| Tool | Description |
|------|-------------|
| `analyze_state` | Generate dependency graph from entry file/variable |
| `find_cycles` | Detect cyclic dependencies and self-references |
| `list_atoms` | List all atoms/selectors in a file with dependencies |
| `launch_viewer` | Start the visualization server |
