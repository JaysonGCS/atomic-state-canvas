# Atomic State Canvas
This is a mono-repository that contains a collection of applications for analyzing and visualizing atomic state relationships using [JSON Canvas](https://jsoncanvas.org/) or a custom interactive "storybook"-like web application. Currently, it only supports [Recoil.js](https://recoiljs.org/) by default.

## Usage

| Application    | Description                                                                                                                                                                                                                              | Installation                                       |
|----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------|
| [asc-cli](./apps/asc-cli)        | CLI tool for visualizing atomic state relationships. It visualizes atomic state relationships using [JSON Canvas](https://jsoncanvas.org/)                                                                                               | npm install @atomic-state-canvas/asc-cli -g        |
| [asc-viewer-cli](./apps/asc-viewer-cli) | An interactive web application for analyzing and visualizing atomic state relationships. By launching the development tool, it looks for ".asc." files in the directory and automatically populates the atomic graphs in a "Storybook"-like experience. Also includes MCP server for AI assistant integration. | npm install @atomic-state-canvas/asc-viewer-cli -D |

## Configuration (asc-viewer-cli)

The viewer CLI uses [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig) for configuration. Create a config file in your project root:

**Supported files:** `.ascrc.json`, `.ascrc.js`, `.ascrc.yaml`, `asc.config.js`, `asc.config.ts`

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `watchDir` | `string` | `"src"` | Directory to watch for `.asc.` files |
| `port` | `number` | `1296` | Port to run the viewer server on |
| `extensions` | `string[]` | `[".asc.js", ".asc.ts"]` | File extensions to watch |
| `excludePatternInGlob` | `string` | `undefined` | Glob pattern to exclude files |

### Example `.ascrc.json`
```json
{
  "watchDir": "./src",
  "port": 3000,
  "extensions": [".asc.ts"],
  "excludePatternInGlob": "*.test.ts"
}
```

## Use Cases

### Asc CLI

Running CLI command to generate atomic state canvas file and summary.
![asc cli - console](./assets/asc-cli-console.png)

Generates atomic state canvas as [JSON Canvas](https://jsoncanvas.org/) and visualized using Obsidian.
![asc cli - obsidian](./assets/asc-cli-obsidian.png)

### Asc Viewer CLI

Visualize atomic state relationships in 2D.
![asc viewer - 2d](./assets/asc-viewer-2d.png)

Visualize atomic state relationships in 3D.
![asc viewer - 3d](./assets/asc-viewer-3d.png)

## MCP Server (AI Assistant Integration)

The `asc-viewer-cli` includes an MCP (Model Context Protocol) server that enables AI assistants like Claude to analyze your Recoil state and launch visualizations.

### Setup

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

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `analyze_state` | Generate dependency graph from entry file/variable |
| `find_cycles` | Detect cyclic dependencies and self-references |
| `list_atoms` | List all atoms/selectors in a file with dependencies |
| `launch_viewer` | Start the visualization server |

## Roadmap
- [ ] Support more state management libraries such as [Jotai](https://jotai.org/)
- [ ] Add support for more features in JSON Canvas such as grouping
- [ ] Better documentation
- [ ] More comprehensive unit tests
- [ ] Support for alias import file walk
