#! /usr/bin/env node

import { program } from 'commander';
import { textSync } from 'figlet';
import fs from 'fs';
import { writeFile } from 'fs/promises';
import { setVerboseLevel } from './configUtils';
import { generateGraph, getEntryNode, getFileDetails } from './graphUtils';
import { logMsg } from './logUtils';
import { config } from './plugins/recoil';

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

const globToRegex = (pattern: string): RegExp => {
  const regex = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
  return new RegExp(`^${regex}$`);
};

if (options.file) {
  if (options.search) {
    // eslint-disable-next-line no-console
    console.log(textSync('A-S-C'));
    const pathName = options.file;
    const searchVariableName = options.search;
    logMsg(`File: ${pathName}`);
    logMsg(`Variable: ${searchVariableName}`);
    options.exclude && logMsg(`Exclude glob pattern: ${options.exclude}`);
    const entryFileDetails = getFileDetails(pathName, config, {
      excludePattern: options.exclude ? globToRegex(options.exclude) : undefined
    });

    const entryNode = getEntryNode(entryFileDetails, searchVariableName);
    if (!entryNode) {
      throw new Error(`Entry node ${searchVariableName} not found`);
    }
    const graph = generateGraph(entryFileDetails, searchVariableName, config, {
      excludePattern: options.exclude ? globToRegex(options.exclude) : undefined
    });
    const jsonCanvas = graph.generateJsonCanvas(entryNode.id);
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
