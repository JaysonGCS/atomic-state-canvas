import { textSync } from 'figlet';
import { program } from 'commander';
import fs from 'fs';
import path from 'path';
import { parseSync } from 'oxc-parser';
import { getExtension } from './fileUtils';
import { convertToJSONCanvas, generateDependencyGraph } from './nodeUtils';
import { writeFile } from 'fs/promises';

program
  .version('1.0.0')
  .description('test')
  .option('-v, --verbose', 'Verbose mode')
  .option('-f, --file <value>', 'File')
  .option('-s, --search <value>', 'Search variable name')
  .option('-o, --output <value>', 'Output file name')
  .parse(process.argv);

const options = program.opts();

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
    console.log(textSync('A-S-C'));
    const pathName = options.file;
    const searchVariableName = options.search;
    console.log(`File: ${pathName}`);
    readStateFile(pathName).then((data) => {
      const result = parseSync(pathName, data);
      const graph = generateDependencyGraph(result, { searchVariableName });
      const jsonCanvas = convertToJSONCanvas(graph);
      if (options.output) {
        writeFile(options.output, JSON.stringify(jsonCanvas));
      } else {
        console.log(JSON.stringify(jsonCanvas));
      }
    });
  } else {
    console.error('Missing variable name.');
  }
}
