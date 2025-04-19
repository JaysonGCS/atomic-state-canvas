/**
 * "1" red
 * "2" orange
 * "3" yellow
 * "4" green
 * "5" cyan
 * "6" purple
 */
type TCanvasColor = '1' | '2' | '3' | '4' | '5' | '6';

export type TEdge = { source: string; target: string };

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

  constructor() {
    this.adjacencyList = new Map();
    this.edgeMap = new Map();
    this.nodeMap = new Map();
  }

  private getReverseEdgeList = (): TEdge[] => {
    return Array.from(this.edgeMap.values()).map(({ source, target }) => {
      return { source: target, target: source };
    });
  };

  private getEdgeList = (): TEdge[] => {
    return Array.from(this.edgeMap.values());
  };

  getInternalData() {
    return {
      edgeMap: this.edgeMap,
      nodeMap: this.nodeMap,
      adjacencyList: this.adjacencyList,
      getReverseEdgeList: this.getReverseEdgeList,
      getEdgeList: this.getEdgeList
    };
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

  generateLevelTopologyMapAndMetadata(leafNodeId: string, edges: TEdge[]) {
    const graph = new Map<string, string[]>();
    const indegreeMap = new Map<string, number>();
    const allNodeIds: string[] = Array.from(this.nodeMap.keys());

    for (const { source, target } of edges) {
      // Generate indegree map
      indegreeMap.set(target, (indegreeMap.get(target) ?? 0) + 1);
      // Generate the actual order adjacent list
      if (!graph.has(source)) {
        graph.set(source, []);
      }
      graph.get(source).push(target);
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
      const node = queue.shift();
      const level = nodeToLevelMap.get(node);
      visited.add(node);
      for (const neighbour of graph.get(node) || []) {
        if (!visited.has(neighbour)) {
          queue.push(neighbour);
          nodeToLevelMap.set(neighbour, level + 1);
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
      });
      const visited = new Set();
      while (queue.length) {
        const node = queue.shift();
        visited.add(node);
        for (const neighbor of graph.get(node) || []) {
          const level = nodeToLevelMap.get(node);
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
            nodeToLevelMap.set(neighbor, level + 1);
          }
        }
      }
    }

    const maxLevel = Math.max(...nodeToLevelMap.values());

    const isLeafNodeAlreadyLast = isLeafNodeAtLastLevel(leafNodeId, nodeToLevelMap, maxLevel);
    const leafNodeLevel = isLeafNodeAlreadyLast ? maxLevel : maxLevel + 1;

    // Since we only have 1 leaf node (entry node), make sure it's the only one at the last level
    nodeToLevelMap.set(leafNodeId, leafNodeLevel);

    const compactNodeToLevelMap = compressNodeToLevelMap(nodeToLevelMap, graph, leafNodeId);

    // Group nodes by level
    const levelToNodeIdMap: Map<number, string[]> = new Map();
    for (const node of allNodeIds) {
      const level = compactNodeToLevelMap.get(node);
      if (!levelToNodeIdMap.has(level)) levelToNodeIdMap.set(level, []);
      levelToNodeIdMap.get(level).push(node);
    }

    return {
      levelToNodeIdMap,
      leafNodeLevel
    };
  }
}
