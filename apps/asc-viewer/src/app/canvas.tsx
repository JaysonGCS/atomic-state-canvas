import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import ForceGraph3D, { GraphData, LinkObject, NodeObject } from 'react-force-graph-3d';
import { currentAscEntryAtom } from '../stores/ascStore/ascStore';
import { findAllCycles } from '@atomic-state-canvas/asc-viewer-libs';

type TNodeExtra = { color: string };
type TLinkExtra = { color: string };

export const Canvas = () => {
  const ascEntry = useAtomValue(currentAscEntryAtom);

  const graphData = useMemo<GraphData<TNodeExtra, TLinkExtra>>(() => {
    if (ascEntry) {
      const edges = ascEntry?.reverseEdges ?? [];
      const { cyclicDetailsMap } = findAllCycles(edges);
      const idToNodesMap = edges.reduce<Map<string, NodeObject<TNodeExtra>>>((total, edge) => {
        const { source, target } = edge;
        const sourceNode = total.get(source);
        const targetNode = total.get(target);
        if (!sourceNode) {
          let color = 'green';
          if (cyclicDetailsMap.has(source)) {
            color = 'red';
          }
          total.set(source, { id: source, color });
        }
        if (!targetNode) {
          let color = 'green';
          if (cyclicDetailsMap.has(target)) {
            color = 'red';
          }
          total.set(target, { id: target, color });
        }
        return total;
      }, new Map<string, NodeObject<TNodeExtra>>());
      const links = edges.map<LinkObject<TNodeExtra, TLinkExtra>>((edge) => {
        return {
          ...edge,
          color:
            cyclicDetailsMap.has(edge.source) && cyclicDetailsMap.has(edge.target)
              ? 'yellow'
              : 'teal'
        };
      });
      return { nodes: Array.from(idToNodesMap.values()), links };
    }
    return { nodes: [], links: [] };
  }, [ascEntry]);

  return (
    <ForceGraph3D
      graphData={graphData}
      linkDirectionalArrowLength={3.5}
      linkDirectionalArrowRelPos={1}
      linkCurvature={0.25}
      linkWidth={1}
      nodeColor={(props: NodeObject<TNodeExtra>) => {
        return props.color;
      }}
      linkColor={(props: LinkObject<TNodeExtra, TLinkExtra>) => {
        return props.color;
      }}
      backgroundColor="white"
    />
  );
};
