import { TEdge } from '../dataStructure';
import { TCyclicDetails } from '../types';

const generateCyclicDetailsMap = (allCycles: string[][]): Map<string, TCyclicDetails> => {
  const cyclicNodes = new Map<string, TCyclicDetails>();
  allCycles.forEach((cycle) => {
    if (cycle.length === 1) {
      cyclicNodes.set(cycle[0], { reason: 'self-reference' });
    } else {
      cycle.forEach((nodeId) => {
        cyclicNodes.set(nodeId, { reason: 'cyclic' });
      });
    }
  });
  return cyclicNodes;
};

const generateCyclicStats = (allCycles: string[][]): Map<TCyclicDetails['reason'], string[][]> => {
  const cyclicStatsMap = new Map<TCyclicDetails['reason'], string[][]>();
  cyclicStatsMap.set('cyclic', []);
  cyclicStatsMap.set('self-reference', []);
  allCycles.forEach((cycle) => {
    if (cycle.length === 1) {
      cyclicStatsMap.get('self-reference').push(cycle);
    } else {
      cyclicStatsMap.get('cyclic').push(cycle);
    }
  });
  return cyclicStatsMap;
};

const constructGraph = (edges: TEdge[]) => {
  const graph = new Map<string, string[]>();
  for (const { source, target } of edges) {
    if (!graph.has(source)) {
      graph.set(source, []);
    }
    graph.get(source).push(target);
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
  const cyclicDetailsMap = generateCyclicDetailsMap(allCycles);
  const cyclicStatsMap = generateCyclicStats(allCycles);
  return { allCycles, cyclicDetailsMap, cyclicStatsMap };
};
