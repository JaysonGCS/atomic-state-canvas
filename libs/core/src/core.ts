import { Graph } from './dataStructure';
import { globToRegex } from './generalUtils';
import { generateGraph, getEntryNode, getFileDetails } from './graphUtils';
import { config } from './plugins/recoil';
import { TSimpleNode } from './types';

export const generateAtomicStateGraph = (
  pathName: string,
  framework: 'recoil',
  options: { searchVariableName: string; excludePatternInGlob?: string }
): { graph: Graph<TSimpleNode>; entryNodeId: string } => {
  const { excludePatternInGlob, searchVariableName } = options;
  const selectedConfig = framework === 'recoil' ? config : undefined;
  const excludePattern = excludePatternInGlob ? globToRegex(excludePatternInGlob) : undefined;
  const entryFileDetails = getFileDetails(pathName, selectedConfig, {
    excludePattern
  });

  const entryNode = getEntryNode(entryFileDetails, searchVariableName);
  if (!entryNode) {
    throw new Error(`Entry node ${searchVariableName} not found`);
  }
  const graph = generateGraph(
    entryFileDetails,
    searchVariableName,
    config,
    {
      excludePattern
    },
    null
  );

  return {
    graph,
    entryNodeId: entryNode.id
  };
};
