# Atomic State Canvas
This is a project for visualizing atomic state relationships using [JSON Canvas](https://jsoncanvas.org/). Currently, it only supports [Recoil.js](https://recoiljs.org/) by default.

## Development
```
npm build:watch
```

## Examples
```
# Standard
node dist/index.js -f /Users/jaysongcs/Projects/atomic-state-canvas/examples/standard/src/storeOne/entrySelector.ts -s entrySelector -o test.canvas

# Circular Dependency
node dist/index.js -f /Users/jaysongcs/Projects/atomic-state-canvas/examples/standard/src/storeTwo/entrySelector.ts -s entrySelector -o test.canvas

# Self Referencing Circular Dependency
node dist/index.js -f /Users/jaysongcs/Projects/atomic-state-canvas/examples/standard/src/storeThree/entrySelector.ts -s entrySelector -o test.canvas
```

## Roadmap
- [ ] Support more state management libraries such as [Jotai](https://jotai.org/)
- [ ] Add support for more features in JSON Canvas such as color indicator
- [ ] Better documentation
- [ ] More comprehensive unit tests
- [ ] Improve performance and scalability
