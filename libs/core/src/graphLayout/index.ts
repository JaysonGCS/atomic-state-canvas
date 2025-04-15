import { Graph } from '../dataStructure';
import { logMsg } from '../logUtils';
import { TCanvasDirection, TSimpleNode } from '../types';
import { generateForceGraphLayout } from './forceDirectedLayout';
import { generateSimpleTopolofyGraphLayout } from './simpleTopologyLayout';

export type TLayoutType = 'FORCE_DIRECTED' | 'SIMPLE_TOPOLOGY';

export type TLayoutProps = {
  graph: Graph<TSimpleNode>;
  leafNodeId: string;
  type?: TLayoutType;
  allCycles: string[][];
  options: { direction: TCanvasDirection };
};

const generateCyclicNodes = (
  allCycles: string[][]
): Map<string, { reason: 'self-reference' | 'cyclic' }> => {
  const cyclicNodes = new Map<string, { reason: 'self-reference' | 'cyclic' }>();
  allCycles.forEach((cycle) => {
    if (cycle.length === 1) {
      logMsg(`CYCLE - Self reference cycle detected for ${cycle}`);
      cyclicNodes.set(cycle[0], { reason: 'self-reference' });
    } else {
      logMsg(`CYCLE - Cyclic detected at ${cycle}`);
      cycle.forEach((nodeId) => {
        cyclicNodes.set(nodeId, { reason: 'cyclic' });
      });
    }
  });
  return cyclicNodes;
};

export const generateGraphLayout = (props: TLayoutProps) => {
  const { graph, leafNodeId, type = 'SIMPLE_TOPOLOGY', options, allCycles } = props;
  logMsg(`Generating JSON Canvas with direction ${options.direction} and layout type ${type}`);

  const cyclicNodes: Map<string, { reason: 'self-reference' | 'cyclic' }> =
    generateCyclicNodes(allCycles);

  if (type === 'FORCE_DIRECTED') {
    return generateForceGraphLayout(graph, leafNodeId, cyclicNodes, options);
  } else if (type === 'SIMPLE_TOPOLOGY') {
    return generateSimpleTopolofyGraphLayout(graph, leafNodeId, cyclicNodes, options);
  }
  throw new Error(`Unsupported layout type: ${type}`);
};
