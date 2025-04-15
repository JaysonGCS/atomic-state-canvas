import { TEdge } from '../dataStructure';

const constructGraph = (edges: TEdge[]) => {
  const graph = new Map<string, string[]>();
  for (const { source, target } of edges) {
    if (!graph.has(source)) {
      graph.set(source, []);
    }
    graph.get(source)!.push(target);
  }
  return graph;
};

export const findAllCycles = (edges: TEdge[]) => {
  const graph = constructGraph(edges);
  const allCycles: string[][] = [];

  const visited = new Set<string>();
  const stack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string) {
    if (stack.has(node)) {
      // Cycle found: extract the cycle from the path
      const cycleStartIndex = path.indexOf(node);
      allCycles.push(path.slice(cycleStartIndex));
      return;
    }

    if (visited.has(node)) return;

    visited.add(node);
    stack.add(node);
    path.push(node);
    for (const neighbor of graph.get(node) ?? []) {
      dfs(neighbor);
    }

    stack.delete(node);
    path.pop();
  }

  // Start DFS from every node (since multiple roots are possible)
  for (const node of graph.keys()) {
    dfs(node);
  }
  return { allCycles };
};
