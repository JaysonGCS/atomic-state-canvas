import { useAtomValue } from 'jotai';
import { useMemo, useRef } from 'react';
import ForceGraph3D, {
  ForceGraphMethods,
  GraphData,
  LinkObject,
  NodeObject
} from 'react-force-graph-3d';
import { currentAscEntryAtom } from '../stores/ascStore/ascStore';
import { findAllCycles } from '@atomic-state-canvas/asc-viewer-libs';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

type TNodeExtra = { color: string; label: string };
type TLinkExtra = { color: string };

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
const extraRenderers = [new CSS2DRenderer()];

export const Canvas = () => {
  const ascEntry = useAtomValue(currentAscEntryAtom);
  const graphRef =
    useRef<ForceGraphMethods<NodeObject<TNodeExtra>, LinkObject<TNodeExtra, TLinkExtra>>>(
      undefined
    );

  const graphData = useMemo<GraphData<TNodeExtra, TLinkExtra>>(() => {
    if (ascEntry) {
      const edges = ascEntry.reverseEdges;
      const nodeMap = ascEntry.nodeMap;
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
          total.set(source, { id: source, color, label: nodeMap[source].name });
        }
        if (!targetNode) {
          let color = 'green';
          if (cyclicDetailsMap.has(target)) {
            color = 'red';
          }
          total.set(target, { id: target, color, label: nodeMap[target].name });
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
      ref={graphRef}
      extraRenderers={extraRenderers}
      graphData={graphData}
      linkDirectionalArrowLength={3.5}
      linkDirectionalArrowRelPos={1}
      linkCurvature={0.25}
      linkWidth={1}
      nodeColor={'color'}
      nodeLabel={'label'}
      nodeThreeObject={(node: NodeObject<TNodeExtra>) => {
        const nodeEl = document.createElement('div');
        nodeEl.textContent = node.label;
        nodeEl.style.color = node.color;
        nodeEl.style.paddingLeft = '120px';
        return new CSS2DObject(nodeEl);
      }}
      nodeThreeObjectExtend={true}
      linkColor={'color'}
      backgroundColor="#e5e7eb"
    />
  );
};
