import { Graph, TJSonCanvas, TJsonCanvasNode } from '../dataStructure';
import { TCanvasDirection, TSimpleNode } from '../types';
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from './constants';
import { generateEdgeId } from './utils';

const DEFAULT_LR_X_OFFSET = 2 * DEFAULT_NODE_WIDTH;
const DEFAULT_LR_Y_OFFSET = 2 * DEFAULT_NODE_HEIGHT;
const DEFAULT_TB_Y_OFFSET = 250;
const DEFAULT_TB_X_OFFSET = 450;

const generatePosition = (
  level: number,
  index: number,
  direction: TCanvasDirection
): { x: number; y: number } => {
  if (direction === 'TB') {
    return {
      x: index * DEFAULT_TB_X_OFFSET,
      y: level * DEFAULT_TB_Y_OFFSET
    };
  } else {
    return { x: level * DEFAULT_LR_X_OFFSET, y: index * DEFAULT_LR_Y_OFFSET };
  }
};

export const generateSimpleTopolofyGraphLayout = (
  graph: Graph<TSimpleNode>,
  leafNodeId: string,
  cyclicNodes: Map<string, { reason: 'self-reference' | 'cyclic' }>,
  options?: { direction?: TCanvasDirection }
): TJSonCanvas => {
  const { direction = 'TB' } = options || {};
  const { nodeMap, getReverseEdgeList } = graph.getInternalData();
  const edges = getReverseEdgeList();
  const { levelToNodeIdMap } = graph.generateLevelTopologyMapAndMetadata(leafNodeId, edges);
  const nodes: TJsonCanvasNode[] = [];
  for (const [level, nodeIds] of levelToNodeIdMap.entries()) {
    nodeIds.forEach((nodeId, i) => {
      nodes.push({
        id: nodeId,
        type: 'text',
        text: nodeMap.get(nodeId).name,
        width: DEFAULT_NODE_WIDTH,
        height: DEFAULT_NODE_HEIGHT,
        color: cyclicNodes.has(nodeId) ? '1' : '4',
        ...generatePosition(level, i, direction)
      });
    });
  }
  return {
    nodes,
    edges: edges.map((edge) => {
      return {
        id: generateEdgeId(edge),
        fromNode: edge.source,
        toNode: edge.target,
        color: cyclicNodes.has(edge.target) && cyclicNodes.has(edge.source) ? '3' : '5'
      };
    })
  };
};
