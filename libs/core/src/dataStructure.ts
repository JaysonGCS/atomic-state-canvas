import { logMsg } from './logUtils';

const DEFAULT_NODE_WIDTH = 300;
const DEFAULT_NODE_HEIGHT = 150;
const DEFAULT_LR_X_OFFSET = 2 * DEFAULT_NODE_WIDTH;
const DEFAULT_LR_Y_OFFSET = 2 * DEFAULT_NODE_HEIGHT;
const DEFAULT_TB_Y_OFFSET = 250;
const DEFAULT_TB_X_OFFSET = 450;

/**
 * "1" red
 * "2" orange
 * "3" yellow
 * "4" green
 * "5" cyan
 * "6" purple
 */
type TCanvasColor = '1' | '2' | '3' | '4' | '5' | '6';

type TEdge = { source: string; target: string };

type TCanvasDirection = 'LR' | 'TB';

const generateEdgeId = (edge: TEdge): string => {
  return `${edge.source}-${edge.target}`;
};

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

const isLeafNodeAtLastLevel = (
  leafNodeId: string,
  nodeToLevelMap: Map<string, number>,
  maxLevel: number
): boolean => {
  let counter = 0;
  const currentLeafLevel = nodeToLevelMap.get(leafNodeId);
  for (const level of nodeToLevelMap.values()) {
    if (currentLeafLevel === level && level === maxLevel) {
      counter += 1;
    }
  }
  return counter === 1;
};

const compressNodeToLevelMap = (
  nodeToLevelMap: Map<string, number>,
  graph: Map<string, string[]>,
  leafNodeId: string
): Map<string, number> => {
  const finalNodeToLevelMap = new Map(nodeToLevelMap);
  const nodeIdsForEvaluation: string[] = Array.from(nodeToLevelMap.keys()).filter(
    (nodeId) => nodeId !== leafNodeId
  );
  nodeIdsForEvaluation.forEach((nodeId) => {
    const currentNodeLevel = nodeToLevelMap.get(nodeId);
    const neighbourNodes = graph.get(nodeId);
    const minLevel = Math.min(...neighbourNodes.map((nodeId) => nodeToLevelMap.get(nodeId)));
    if (minLevel - currentNodeLevel >= 2) {
      // If a node is 2 levels or more apart from closest neighbour node, move it to 1 level away
      finalNodeToLevelMap.set(nodeId, minLevel - 1);
    }
  });
  return finalNodeToLevelMap;
};

export type TJsonCanvasNode = {
  id: string;
  type: 'text';
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: TCanvasColor;
};

export type TJSonCanvas = {
  nodes: TJsonCanvasNode[];
  edges: {
    id: string;
    fromNode: string;
    fromSide?: 'top' | 'bottom' | 'left' | 'right';
    fromEnd?: 'none' | 'arrow';
    toNode: string;
    toSide?: 'top' | 'bottom' | 'left' | 'right';
    toEnd?: 'none' | 'arrow';
    color?: TCanvasColor;
    label?: string;
  }[];
};

export class Graph<T extends { id: string; name: string }> {
  private adjacencyList: Map<string, Set<string>>;
  private edgeMap: Map<string, TEdge>;
  private nodeMap: Map<string, T>;
  private cyclicNodeIdReference: Set<string>;

  constructor() {
    this.adjacencyList = new Map();
    this.edgeMap = new Map();
    this.nodeMap = new Map();
    this.cyclicNodeIdReference = new Set();
  }

  addEdge(source: T, target: T): void {
    if (!this.adjacencyList.has(source.id)) {
      this.adjacencyList.set(source.id, new Set());
    }
    if (!this.adjacencyList.has(target.id)) {
      this.adjacencyList.set(target.id, new Set());
    }
    this.adjacencyList.get(source.id).add(target.id);
    this.edgeMap.set(`${target.id}-${source.id}`, { source: source.id, target: target.id });
    this.nodeMap.set(source.id, source);
    this.nodeMap.set(target.id, target);
  }

  addNodeMetadata(param: {
    type: 'cyclic' | 'self-reference';
    sourceId: string;
    targetId: string;
  }): void {
    const { type } = param;
    if (type === 'cyclic' || type === 'self-reference') {
      const { sourceId, targetId } = param;
      this.cyclicNodeIdReference.add(sourceId);
      this.cyclicNodeIdReference.add(targetId);
    }
  }

  private getReverseEdgeList = (): TEdge[] => {
    return Array.from(this.edgeMap).map(([_, { source, target }]) => {
      return { source: target, target: source };
    });
  };

  generateJsonCanvas(leafNodeId: string, direction: 'TB' | 'LR'): TJSonCanvas {
    const edges: TEdge[] = this.getReverseEdgeList();
    const graph = new Map<string, string[]>();
    const indegreeMap = new Map<string, number>();
    const allNodeIds: string[] = Array.from(this.nodeMap.keys());
    const cyclicNodes = new Map<string, { reason: 'self-reference' | 'cyclic' }>();
    // Detect self referencing cycle
    edges.forEach(({ source, target }) => {
      if (source === target) {
        cyclicNodes.set(source, { reason: 'self-reference' });
        logMsg(`Self reference detected for ${source}`);
      }
    });

    for (const { source, target } of edges) {
      // Generate indegree map
      indegreeMap.set(target, (indegreeMap.get(target) ?? 0) + 1);
      // Generate the actual order adjacent list
      if (!graph.has(source)) {
        graph.set(source, []);
      }
      graph.get(source)!.push(target);
    }

    const queue: string[] = [];
    const nodeToLevelMap = new Map<string, number>();

    for (const node of allNodeIds) {
      if ((indegreeMap.get(node) || 0) === 0) {
        queue.push(node);
        nodeToLevelMap.set(node, 0);
      }
    }

    const visited = new Set();
    while (queue.length) {
      const node = queue.shift()!;
      const level = nodeToLevelMap.get(node)!;
      visited.add(node);
      for (const neighbor of graph.get(node) || []) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
          nodeToLevelMap.set(neighbor, level + 1);
        } else if (neighbor !== leafNodeId) {
          if (!cyclicNodes.has(node)) {
            cyclicNodes.set(node, { reason: 'cyclic' });
            logMsg(`Cycle detected at ${node}`);
          }
          if (!cyclicNodes.has(neighbor)) {
            cyclicNodes.set(neighbor, { reason: 'cyclic' });
            logMsg(`Cycle detected at ${neighbor}`);
          }
        }
      }
    }

    const visitedNodes = new Set(nodeToLevelMap.keys());
    if (allNodeIds.length !== visitedNodes.size) {
      // If not all nodes are visited, this is an indication that there is a cycle. We still need to add these nodes to the correct level.
      const unvisitedNodes = allNodeIds.filter((nodeId) => !visitedNodes.has(nodeId));
      unvisitedNodes.forEach((nodeId) => {
        queue.push(nodeId);
        nodeToLevelMap.set(nodeId, 0);
        if (nodeId !== leafNodeId && !cyclicNodes.has(nodeId)) {
          cyclicNodes.set(nodeId, { reason: 'cyclic' });
          logMsg(`Cycle detected at ${nodeId}`);
        }
      });
      const visited = new Set();
      while (queue.length) {
        const node = queue.shift()!;
        visited.add(node);
        for (const neighbor of graph.get(node) || []) {
          const level = nodeToLevelMap.get(node)!;
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
            nodeToLevelMap.set(neighbor, level + 1);
          }
        }
      }
    }

    const maxLevel = Math.max(...nodeToLevelMap.values());

    const isLeafNodeAlreadyLast = isLeafNodeAtLastLevel(leafNodeId, nodeToLevelMap, maxLevel);

    // Since we only have 1 leaf node (entry node), make sure it's the only one at the last level
    nodeToLevelMap.set(leafNodeId, isLeafNodeAlreadyLast ? maxLevel : maxLevel + 1);

    const compactNodeToLevelMap = compressNodeToLevelMap(nodeToLevelMap, graph, leafNodeId);

    // Group nodes by level
    const levelToNodeIdMap: Map<number, string[]> = new Map();
    for (const node of allNodeIds) {
      const level = compactNodeToLevelMap.get(node)!;
      if (!levelToNodeIdMap.has(level)) levelToNodeIdMap.set(level, []);
      levelToNodeIdMap.get(level)!.push(node);
    }

    const nodes: TJsonCanvasNode[] = [];
    direction;
    for (const [level, nodeIds] of levelToNodeIdMap.entries()) {
      nodeIds.forEach((nodeId, i) => {
        nodes.push({
          id: nodeId,
          type: 'text',
          text: this.nodeMap.get(nodeId).name,
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
  }
}
