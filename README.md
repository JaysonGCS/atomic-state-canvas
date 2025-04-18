# Atomic State Canvas
This is a project for visualizing atomic state relationships using [JSON Canvas](https://jsoncanvas.org/). Currently, it only supports [Recoil.js](https://recoiljs.org/) by default.

## Installation
```bash
npm install atomic-state-canvas -g
```

## Usage

### Prerequisite
- Make sure that you have [Node](https://nodejs.org/en) installed.

### Examples
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
node dist/apps/asc-cli/src/index.js -f examples/standard/src/store1/entrySelector.ts -s entrySelector -o test.canvas

# Circular Dependency
node dist/apps/asc-cli/src/index.js -f examples/standard/src/store2/entrySelector.ts -s entrySelector -o test.canvas

# Self Referencing Circular Dependency
node dist/apps/asc-cli/src/index.js -f examples/standard/src/store3/entrySelector.ts -s entrySelector -o test.canvas

# With glob exclusion
node dist/apps/asc-cli/src/index.js -f examples/standard/src/store4/entrySelector.ts -s entrySelector -o test.canvas -e "*.test.*"
```

## Roadmap
- [ ] Support more state management libraries such as [Jotai](https://jotai.org/)
- [ ] Add support for more features in JSON Canvas such as grouping
- [ ] Better documentation
- [ ] More comprehensive unit tests
- [ ] Support for alias import file walk
