const DEFAULT_NODE_WIDTH = 300;
const DEFAULT_NODE_HEIGHT = 150;
const DEFAULT_X_OFFSET = 2 * DEFAULT_NODE_WIDTH;
const DEFAULT_Y_OFFSET = 2 * DEFAULT_NODE_HEIGHT;

/**
 * "1" red
 * "2" orange
 * "3" yellow
 * "4" green
 * "5" cyan
 * "6" purple
 */
type TCanvasColor = '1' | '2' | '3' | '4' | '5' | '6';

type TCanvasDirection = 'left-to-right' | 'right-to-left';

const DEFAULT_DIRECTION: TCanvasDirection = 'left-to-right';

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
  private edgeMap: Map<string, { source: string; target: string }>;
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

  hasCycle(sourceId: string, targetId: string): boolean {
    if (sourceId === targetId) {
      return true;
    }
    // Use DFS to find potential cycle
    const visited = new Set<string>();
    const stack = [sourceId];
    while (stack.length > 0) {
      const node = stack.pop()!;
      if (visited.has(node)) {
        return true;
      }
      visited.add(node);
      const adjacentNodes = this.adjacencyList.get(node);
      if (!adjacentNodes) continue;
      for (const neighbor of adjacentNodes) {
        if (neighbor === targetId) {
          return true;
        }
        stack.push(neighbor);
      }
    }
    return false;
  }

  private generateJsonCanvasNodes(
    nodeId: string,
    level: number,
    visited: Set<string> = new Set()
  ): TJsonCanvasNode[] {
    if (visited.has(nodeId)) {
      return [];
    }
    visited.add(nodeId);
    return Array.from(this.adjacencyList.get(nodeId)).reduce<TJsonCanvasNode[]>(
      (acc, neighborId, idx) => {
        const neighborNode = this.nodeMap.get(neighborId)!;
        const children = this.generateJsonCanvasNodes(neighborId, level + 1, visited);
        acc.push(
          {
            id: neighborNode.id,
            type: 'text',
            text: neighborNode.name,
            x: level * DEFAULT_X_OFFSET * (DEFAULT_DIRECTION === 'left-to-right' ? -1 : 1),
            y: idx * DEFAULT_Y_OFFSET,
            width: DEFAULT_NODE_WIDTH,
            height: DEFAULT_NODE_HEIGHT,
            color: this.cyclicNodeIdReference.has(neighborNode.id) ? '1' : '4'
          },
          ...children
        );
        return acc;
      },
      []
    );
  }

  generateJsonCanvas(rootId: string): TJSonCanvas {
    const rootNode = this.nodeMap.get(rootId);
    if (!rootNode) {
      throw new Error(`Node with id ${rootId} not found`);
    }
    const nodes: TJsonCanvasNode[] = [
      {
        id: rootNode.id,
        type: 'text',
        text: rootNode.name,
        x: 0,
        y: 0,
        width: DEFAULT_NODE_WIDTH,
        height: DEFAULT_NODE_HEIGHT,
        color: this.cyclicNodeIdReference.has(rootNode.id) ? '1' : '4'
      }
    ];
    // Continue to populate nodes based on the adjacency list
    const generatedNodes = this.generateJsonCanvasNodes(rootNode.id, 1);
    // Deduplicate generated nodes
    const uniqueNodes = Array.from(new Set(generatedNodes.map((node) => node.id))).map(
      (id) => generatedNodes.find((node) => node.id === id)!
    );
    nodes.push(...uniqueNodes);

    return {
      nodes,
      edges: Array.from(this.edgeMap).map(([edgeId, edge]) => ({
        id: edgeId,
        fromNode: edge.target,
        toNode: edge.source,
        color:
          this.cyclicNodeIdReference.has(edge.target) && this.cyclicNodeIdReference.has(edge.source)
            ? '3'
            : '5'
      }))
    };
  }
}
