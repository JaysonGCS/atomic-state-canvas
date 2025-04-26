# Atomic State Canvas CLI
This is a CLI tool for analyzing and visualizing atomic state relationships using [JSON Canvas](https://jsoncanvas.org/).

## Installation
```bash
npm install @atomic-state-canvas/asc-cli -g
```

## CLI Command Examples
```bash
# Help
atomic-state-canvas -h

# Parse file and traverse based on search variable, then print JSON Canvas
atomic-state-canvas -f ./src/storeOne/entrySelector.ts -s entrySelector

# Parse file and traverse based on search variable, then output JSON Canvas to file
atomic-state-canvas -f ./src/storeOne/entrySelector.ts -s entrySelector -o test.canvas
```

## Local Development
### Get Started
```bash
npm build:watch
```

### Examples
```bash
# Standard
node dist/asc-cli/index.js -f examples/standard/src/store1/entrySelector.ts -s entrySelector -o test.canvas

# Circular Dependency
node dist/asc-cli/index.js -f examples/standard/src/store2/entrySelector.ts -s entrySelector -o test.canvas

# Self Referencing Circular Dependency
node dist/asc-cli/index.js -f examples/standard/src/store3/entrySelector.ts -s entrySelector -o test.canvas

# With glob exclusion
node dist/asc-cli/index.js -f examples/standard/src/store4/entrySelector.ts -s entrySelector -o test.canvas -e "*.test.*"
```
