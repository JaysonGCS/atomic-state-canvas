import { generateAtomicStateGraph, logMsg } from '@atomic-state-canvas/core';
import path from 'path';
import { findAscEntryDetails } from './utils';
import { promises as fs } from 'fs';
import { DEFAULT_METADATA_DIR_NAME } from './constants';

const OUT_DIR = path.resolve(process.cwd(), DEFAULT_METADATA_DIR_NAME);

export async function generateMetadata(ascFilePath: string) {
  try {
    const entryVariableToDetailsMap = await findAscEntryDetails(ascFilePath);
    for (const { pathName, ascObject } of entryVariableToDetailsMap.values()) {
      if (pathName !== undefined && ascObject !== undefined) {
        // @ts-expect-error -- Ignore type error for now
        const { graph, entryNodeId } = generateAtomicStateGraph(pathName, ascObject.plugin, {
          searchVariableName: ascObject.entry,
          excludePatternInGlob: undefined
        });
        const { getEdgeList } = graph.getInternalData();
        const reverseEdges = getEdgeList();

        const metadata = {
          ascFilePath,
          timestamp: Date.now(),
          ascObject,
          entryNodeId,
          pathName,
          reverseEdges: reverseEdges
        };
        console.log({ metadata });
        const outPath = path.join(OUT_DIR, path.basename(ascFilePath) + '.json');
        await fs.mkdir(OUT_DIR, { recursive: true });
        await fs.writeFile(outPath, JSON.stringify(metadata, null, 2), 'utf-8');
        logMsg(`Generated metadata: ${outPath}`);
      } else {
        console.error(`Unable to generate metadata for ${ascFilePath}`);
      }
    }
  } catch (error) {
    console.error(`Error generating metadata for ${ascFilePath}: ${error}`);
  }
}
