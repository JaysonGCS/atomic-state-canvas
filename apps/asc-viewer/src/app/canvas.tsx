import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import ForceGraph3D, { GraphData, NodeObject } from 'react-force-graph-3d';
import { currentAscEntryAtom } from '../stores/ascStore/ascStore';

export const Canvas = () => {
  const ascEntry = useAtomValue(currentAscEntryAtom);

  const graphData = useMemo<GraphData>(() => {
    if (ascEntry) {
      const edges = ascEntry?.reverseEdges ?? [];
      // TODO: Implement cycle detection
      // const { allCycles, cyclicDetailsMap, cyclicStatsMap } = findAllCycles(edges);
      const idToNodesMap = edges.reduce<Map<string, NodeObject>>((total, edge) => {
        const { source, target } = edge;
        const sourceNode = total.get(source);
        const targetNode = total.get(target);
        if (!sourceNode) {
          total.set(source, { id: source });
        }
        if (!targetNode) {
          total.set(target, { id: target });
        }
        return total;
      }, new Map<string, NodeObject>());
      return { nodes: Array.from(idToNodesMap.values()), links: edges };
    }
    return { nodes: [], links: [] };
  }, [ascEntry]);

  return (
    <ForceGraph3D
      graphData={graphData}
      linkDirectionalArrowLength={3.5}
      linkDirectionalArrowRelPos={1}
      linkCurvature={0.25}
    />
  );
};
