#! /usr/bin/env node

import { program } from 'commander';
import { textSync } from 'figlet';
import { writeFile } from 'fs/promises';
import {
  findAllCycles,
  generateAtomicStateGraph,
  generateGraphLayout,
  logMsg,
  setVerboseLevel
} from '@atomic-state-canvas/core';

const SUPPORTED_DIRECTION = ['TB', 'LR'];

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

const isVerbose = options.verbose;
setVerboseLevel(isVerbose);

const direction = options.direction ?? 'TB';
if (!SUPPORTED_DIRECTION.includes(direction)) {
  console.error(`Unsupported direction -d ${direction}`);
}

if (options.file) {
  if (options.search) {
    // eslint-disable-next-line no-console
    console.log(textSync('A-S-C'));
    const pathName = options.file;
    const searchVariableName = options.search;
    logMsg(`File: ${pathName}`);
    logMsg(`Variable: ${searchVariableName}`);
    options.exclude && logMsg(`Exclude glob pattern: ${options.exclude}`);
    const { graph, entryNodeId } = generateAtomicStateGraph(pathName, 'recoil', {
      searchVariableName,
      excludePatternInGlob: options.exclude
    });
    const { getReverseEdgeList } = graph.getInternalData();
    const { allCycles, cyclicDetailsMap, cyclicStatsMap } = findAllCycles(getReverseEdgeList());
    const jsonCanvas = generateGraphLayout({
      type: options.layout,
      graph,
      leafNodeId: entryNodeId,
      cyclicDetailsMap,
      options: { direction }
    });
    if (options.output) {
      // If output file name is provided, write to file.
      writeFile(options.output, JSON.stringify(jsonCanvas));
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
