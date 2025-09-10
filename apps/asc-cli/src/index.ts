import {
  findAllCycles,
  generateAtomicStateGraph,
  generateGraphLayout,
  isSupportedDirection,
  isSupportedLayout,
  logMsg,
  setVerboseLevel
} from '@atomic-state-canvas/core';
import { program } from 'commander';
import figlet from 'figlet';
import { writeFile } from 'fs/promises';

program
  .description('A CLI tool for visualizing atomic state relationships using JSON Canvas')
  .option('-v, --verbose', 'Verbose mode')
  .option('-f, --file <value>', 'File')
  .option('-s, --search <value>', 'Search variable name')
  .option('-o, --output <value>', 'Output file name for JSON Canvas')
  .option('-e, --exclude <value>', 'Exclude glob pattern')
  .option('-d, --direction <value>', 'Supported direction: TB, LR')
  .option('-l, --layout <value>', 'Supported direction: SIMPLE_TOPOLOGY, FORCE_DIRECTED')
  .parse(process.argv);

// When no arguments are provided, display help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

const options = program.opts();

const isVerbose = Boolean(options.verbose);
setVerboseLevel(isVerbose);

const direction = String(options.direction ?? 'TB');
if (typeof direction === 'string' && !isSupportedDirection(direction)) {
  throw new Error(`Unsupported direction -d ${direction}`);
}

const layout = String(options.layout ?? 'SIMPLE_TOPOLOGY');
if (typeof layout === 'string' && !isSupportedLayout(layout)) {
  throw new Error(`Unsupported layout -l ${layout}`);
}

if (options.file && typeof options.file === 'string') {
  if (options.search && typeof options.search === 'string') {
    // eslint-disable-next-line no-console
    console.log(figlet.textSync('A-S-C'));
    const pathName = options.file;
    const searchVariableName = options.search;
    logMsg(`File: ${pathName}`);
    logMsg(`Variable: ${searchVariableName}`);
    const excludePattern = typeof options.exclude === 'string' ? options.exclude : undefined;
    if (excludePattern) {
      logMsg(`Exclude glob pattern: ${excludePattern}`);
    }
    const { graph, entryNodeId } = generateAtomicStateGraph(pathName, 'recoil', {
      searchVariableName,
      excludePatternInGlob: excludePattern
    });
    const { getReverseEdgeList } = graph.getInternalData();
    const { allCycles, cyclicDetailsMap, cyclicStatsMap } = findAllCycles(getReverseEdgeList());
    const jsonCanvas = generateGraphLayout({
      type: layout,
      graph,
      leafNodeId: entryNodeId,
      cyclicDetailsMap,
      options: { direction }
    });
    if (options.output && typeof options.output === 'string') {
      // If output file name is provided, write to file.
      void writeFile(options.output, JSON.stringify(jsonCanvas));
      logMsg(`Output to file: ${options.output}`);
    } else {
      logMsg(JSON.stringify(jsonCanvas, null, 2));
    }
    // eslint-disable-next-line no-console
    console.table({
      'Self Reference Cycles': { Stats: cyclicStatsMap.get('self-reference').length },
      'Cyclic Cycles': { Stats: cyclicStatsMap.get('cyclic').length },
      'Total Cycles': { Stats: allCycles.length }
    });
  } else {
    console.error('Missing search variable name. Please provide it via -s <variable_name>');
  }
} else {
  console.error('Missing file name. Please provide it via -f <file_name>');
}
