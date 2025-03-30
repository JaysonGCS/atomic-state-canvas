#! /usr/bin/env node

import { textSync } from 'figlet';
import { program } from 'commander';
import fs from 'fs';
import path from 'path';
import { parseSync } from 'oxc-parser';
import { getExtension } from './fileUtils';
import { generateDependencyGraph } from './nodeUtils';
import { writeFile } from 'fs/promises';
import { convertToJSONCanvas } from './jsonCanvasUtils';
import { logMsg } from './logUtils';
import { setVerboseLevel } from './configUtils';

program
  .description('A CLI tool for visualizing atomic state relationships using JSON Canvas')
  .option('-v, --verbose', 'Verbose mode')
  .option('-f, --file <value>', 'File')
  .option('-s, --search <value>', 'Search variable name')
  .option('-o, --output <value>', 'Output file name for JSON Canvas')
  .parse(process.argv);

// When no arguments are provided, display help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

const options = program.opts();

const isVerbose = options.verbose;
setVerboseLevel(isVerbose);

const readStateFile = async (pathName: string): Promise<string> => {
  try {
    const extension = getExtension(pathName);
    if (!(extension === 'ts' || extension === 'js')) {
      throw new Error(`Unsupported file extension: ${extension}`);
    }
    const data = await fs.promises.readFile(pathName, 'utf8');
    return data;
  } catch (error) {
    throw new Error(`Error reading file: ${error}`);
  }
};

if (options.file) {
  if (options.search) {
    // eslint-disable-next-line no-console
    console.log(textSync('A-S-C'));
    const pathName = options.file;
    const searchVariableName = options.search;
    logMsg(`File: ${pathName}`);
    logMsg(`Variable: ${searchVariableName}`);
    readStateFile(pathName).then((data) => {
      const result = parseSync(pathName, data);
      const entryDirectoryName = path.dirname(pathName);
      const graph = generateDependencyGraph(result, { searchVariableName, entryDirectoryName });
      const jsonCanvas = convertToJSONCanvas(graph);
      if (options.output) {
        // If output file name is provided, write to file.
        writeFile(options.output, JSON.stringify(jsonCanvas));
      } else {
        logMsg(JSON.stringify(jsonCanvas, null, 2));
      }
    });
  } else {
    console.error('Missing search variable name. Please provide it via -s <variable_name>');
  }
} else {
  console.error('Missing file name. Please provide it via -f <file_name>');
}
