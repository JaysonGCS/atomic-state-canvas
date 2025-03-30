import { TDependencyGraph } from './types';

const width = 300;
const height = 150;
const bufferX = 150;
const bufferY = 50;

type JSONCanvas = {
  type: 'canvas';
  version: '1.0';
  nodes: {
    id: string;
    type: 'text';
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    metadata?: Record<string, unknown>;
  }[];
  edges: {
    id: string;
    fromNode: string;
    toNode: string;
  }[];
};

export function convertToJSONCanvas(root: TDependencyGraph): JSONCanvas {
  const nodes: JSONCanvas['nodes'] = [];
  const edges: JSONCanvas['edges'] = [];
  const nodeMap = new Map<string, string>(); // Store existing nodes by unique key
  let counter = 0;
  let depthMap: Record<number, number> = {}; // Track y positions per depth
  let maxDepth = 0;

  function generateId(): string {
    return `node-${counter++}`;
  }

  function getNodeKey(dependency: TDependencyGraph): string {
    return `${dependency.dependencyName}-${dependency.dependencyType}`;
  }

  function calculateDepth(dependency: TDependencyGraph, depth = 0): number {
    maxDepth = Math.max(maxDepth, depth);
    dependency.dependencies?.forEach((dep) => calculateDepth(dep, depth + 1));
    return maxDepth;
  }

  calculateDepth(root); // Find max depth to position the root correctly

  function traverse(dependency: TDependencyGraph, parentId: string | null, depth = 0): string {
    const nodeKey = getNodeKey(dependency);

    let nodeId = nodeMap.get(nodeKey); // Check if node already exists

    if (!nodeId) {
      // Create new node if it doesn't exist
      nodeId = generateId();
      nodeMap.set(nodeKey, nodeId);

      // Determine Y position for this depth level
      const y = depthMap[depth] || 0;
      depthMap[depth] = y + (height + bufferY); // Increment for next node at this depth

      // X position decreases as depth increases (root on the right)
      const x = (maxDepth - depth) * (width + bufferX);

      nodes.push({
        id: nodeId,
        type: 'text',
        text: dependency.dependencyName,
        width,
        height,
        x,
        y,
        metadata: { dependencyType: dependency.dependencyType }
      });
    }

    if (parentId) {
      // Add edge regardless of whether the node is newly created or reused
      edges.push({
        id: `edge-${nodeId}-${parentId}`,
        fromNode: nodeId, // Child points to parent
        toNode: parentId
      });
    }

    dependency.dependencies?.forEach((dep) => {
      traverse(dep, nodeId, depth + 1);
    });

    return nodeId;
  }

  traverse(root, null);

  return {
    type: 'canvas',
    version: '1.0',
    nodes,
    edges
  };
}
