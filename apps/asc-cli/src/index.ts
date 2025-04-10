#! /usr/bin/env node

import { program } from 'commander';
import { textSync } from 'figlet';
import { writeFile } from 'fs/promises';
import { generateAtomicStateGraph, logMsg, setVerboseLevel } from '@atomic-state-canvas/core';

program
  .description('A CLI tool for visualizing atomic state relationships using JSON Canvas')
  .option('-v, --verbose', 'Verbose mode')
  .option('-f, --file <value>', 'File')
  .option('-s, --search <value>', 'Search variable name')
  .option('-o, --output <value>', 'Output file name for JSON Canvas')
  .option('-e, --exclude <value>', 'Exclude glob pattern')
  .parse(process.argv);

// When no arguments are provided, display help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

const options = program.opts();

const isVerbose = options.verbose;
setVerboseLevel(isVerbose);

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
    const jsonCanvas = graph.generateJsonCanvas(entryNodeId);
    if (options.output) {
      // If output file name is provided, write to file.
      writeFile(options.output, JSON.stringify(jsonCanvas));
    } else {
      logMsg(JSON.stringify(jsonCanvas, null, 2));
    }
    logMsg('Success');
  } else {
    console.error('Missing search variable name. Please provide it via -s <variable_name>');
  }
} else {
  console.error('Missing file name. Please provide it via -f <file_name>');
}
