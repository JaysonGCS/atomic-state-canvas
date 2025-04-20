import { generateAtomicStateGraph, logMsg } from '@atomic-state-canvas/core';
import path from 'path';
import { findAscEntryDetails, generateHash, generateId } from './utils';
import { promises as fs } from 'fs';
import { DEFAULT_METADATA_DIR_NAME } from './constants';
import { IAscEntry, IAscMetadata } from '@atomic-state-canvas/asc-viewer-libs';

const OUT_DIR = path.resolve(process.cwd(), DEFAULT_METADATA_DIR_NAME);

export async function generateMetadata(ascFilePath: string) {
  try {
    const entryVariableToDetailsMap = await findAscEntryDetails(ascFilePath);
    const entries: IAscEntry[] = [];
    for (const { pathName, ascObject } of entryVariableToDetailsMap.values()) {
      if (pathName !== undefined && ascObject !== undefined) {
        // @ts-expect-error -- Ignore type error for now
        const { graph, entryNodeId } = generateAtomicStateGraph(pathName, ascObject.plugin, {
          searchVariableName: ascObject.entry,
          excludePatternInGlob: undefined
        });
        const { getEdgeList } = graph.getInternalData();
        const reverseEdges = getEdgeList();
        entries.push({
          id: generateId(ascObject, entryNodeId),
          ascObject,
          entryNodeId,
          pathName,
          reverseEdges: reverseEdges
        });
      } else {
        console.error(`Unable to generate metadata for ${ascObject.entry} at ${ascFilePath}`);
      }
    }
    const metadata: IAscMetadata = {
      timestamp: Date.now(),
      ascFilePath,
      entries
    };
    const outPath = path.join(OUT_DIR, `${generateHash(ascFilePath)}.json`);
    await fs.mkdir(OUT_DIR, { recursive: true });
    await fs.writeFile(outPath, JSON.stringify(metadata, null, 2), 'utf-8');
    logMsg(`Generated metadata: ${outPath}`);
  } catch (error) {
    console.error(`Error generating metadata for ${ascFilePath}: ${error}`);
  }
}
