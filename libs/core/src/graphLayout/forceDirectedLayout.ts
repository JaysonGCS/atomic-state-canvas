import { Graph, TEdge, TJSonCanvas, TJsonCanvasNode } from '../dataStructure';
import { TCanvasDirection, TSimpleNode } from '../types';
import {
  SimulationLinkDatum,
  SimulationNodeDatum,
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY
} from 'd3-force';
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from './constants';
import { generateEdgeId } from './utils';

const DEFAULT_LINK_DISTANCE = 3 * DEFAULT_NODE_WIDTH;
const DEFAULT_POSITION_STRENGTH = 0.15;

interface ID3ForceNode extends SimulationNodeDatum {
  id: TSimpleNode['id'];
}

interface ID3ForceLink extends SimulationLinkDatum<ID3ForceNode> {}

const calculateCenterForce = (direction: TCanvasDirection, leafNodeLevel: number) => {
  if (direction === 'TB') {
    return forceCenter(300, 600 - leafNodeLevel * DEFAULT_NODE_HEIGHT);
  } else if (direction === 'LR') {
    return forceCenter(600 - leafNodeLevel * DEFAULT_NODE_WIDTH, 300);
  }
  return forceCenter(300, 300);
};

const convertNodeMapToD3ForceNodes = (
  levelToNodeIdMap: Map<number, string[]>,
  leafNodeLevel: number,
  leafNodeId: string,
  direction: TCanvasDirection
): ID3ForceNode[] => {
  return Array.from(levelToNodeIdMap.entries()).flatMap<ID3ForceNode>(([level, nodeIds]) => {
    const evaluateOffset = () => {
      if (direction === 'TB') {
        return { xOffset: 300, yOffset: 600 - (leafNodeLevel - level) * DEFAULT_NODE_HEIGHT };
      } else if (direction === 'LR') {
        return { xOffset: 600 - (leafNodeLevel - level) * DEFAULT_NODE_WIDTH, yOffset: 300 };
      }
    };
    const { xOffset, yOffset } = evaluateOffset();

    return nodeIds.map((nodeId: string) => {
      if (leafNodeId === nodeId) {
        if (direction === 'TB') {
          return { id: nodeId, fx: 300, fy: 600 } satisfies ID3ForceNode;
        } else if (direction === 'LR') {
          return { id: nodeId, fx: 600, fy: 300 } satisfies ID3ForceNode;
        }
      }
      // Utilise topology information to pre-arrange the nodes, so that d3 force layout can converge in a more organic and natural way
      return { id: nodeId, x: xOffset, y: yOffset } satisfies ID3ForceNode;
    });
  });
};

const convertID3ForceNodesToTJSonCanvasNodes = (
  nodes: ID3ForceNode[],
  nodeMap: Map<string, TSimpleNode>,
  cyclicNodes: Map<string, { reason: 'self-reference' | 'cyclic' }>
): TJsonCanvasNode[] => {
  return nodes.map((node: ID3ForceNode) => {
    return {
      id: node.id,
      x: node.x ?? 0,
      y: node.y ?? 0,
      color: cyclicNodes.has(node.id) ? '1' : '4',
      type: 'text',
      text: nodeMap.get(node.id).name,
      width: DEFAULT_NODE_WIDTH,
      height: DEFAULT_NODE_HEIGHT
    } satisfies TJsonCanvasNode;
  });
};

const convertEdgeMapToD3ForceLinks = (edgeMap: Map<string, TEdge>): ID3ForceLink[] => {
  return Array.from(edgeMap.values()).map((edge: TEdge) => {
    return {
      source: edge.source,
      target: edge.target
    } satisfies ID3ForceLink;
  });
};

export const generateForceGraphLayout = (
  graph: Graph<TSimpleNode>,
  leafNodeId: string,
  options?: { simulationCycle?: number; direction?: TCanvasDirection }
): TJSonCanvas => {
  const { simulationCycle = 300, direction = 'TB' } = options || {};
  const { edgeMap, nodeMap, getReverseEdgeList } = graph.getInternalData();
  const edges = getReverseEdgeList();
  const { levelToNodeIdMap, leafNodeLevel, cyclicNodes } =
    graph.generateLevelTopologyMapAndMetadata(leafNodeId, edges);
  const nodes = convertNodeMapToD3ForceNodes(
    levelToNodeIdMap,
    leafNodeLevel,
    leafNodeId,
    direction
  );

  const simulation = forceSimulation<ID3ForceNode>(nodes)
    .force('charge', forceManyBody().strength(-200))
    .force('collide', forceCollide().radius(DEFAULT_NODE_WIDTH / 1.5))
    .force(
      'link',
      forceLink<ID3ForceNode, ID3ForceLink>(convertEdgeMapToD3ForceLinks(edgeMap))
        .id((d) => d.id)
        .distance(DEFAULT_LINK_DISTANCE)
    )
    .force('center', calculateCenterForce(direction, leafNodeLevel))
    .force(
      'position',
      direction === 'TB'
        ? forceY(50).strength(DEFAULT_POSITION_STRENGTH)
        : forceX(100).strength(DEFAULT_POSITION_STRENGTH)
    );

  for (let i = 0; i < simulationCycle; i++) {
    simulation.tick();
  }
  return {
    nodes: convertID3ForceNodesToTJSonCanvasNodes(nodes, nodeMap, cyclicNodes),
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
