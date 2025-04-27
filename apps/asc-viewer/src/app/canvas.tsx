import { useAtomValue } from 'jotai';
import { useCallback, useMemo, useRef, useState } from 'react';
import ForceGraph3D, {
  ForceGraphMethods,
  GraphData,
  LinkObject,
  NodeObject
} from 'react-force-graph-3d';
import { currentAscEntryAtom } from '../stores/ascStore/ascStore';
import { findAllCycles } from '@atomic-state-canvas/asc-viewer-libs';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import {
  generateBidirectionalLinkCountBetweenNodesMap,
  getDirectionIndependentEdgeId,
  TViewDimension
} from './utils';
import ForceGraph2D, { ForceGraphMethods as ForceGraphMethods2D } from 'react-force-graph-2d';

interface CanvasProps {
  type: TViewDimension;
}

type TNodeExtra = { color: string; label: string };
type TLinkExtra = { color: string };

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
const extraRenderers = [new CSS2DRenderer()];

const NODE_COLOR_VALID = 'limegreen';
const NODE_COLOR_ENTRY = 'green';
const NODE_COLOR_ERROR = 'red';
const EDGE_COLOR_VALID = 'mediumturquoise';
const EDGE_COLOR_ERROR = 'orange';

const NODE_REL_SIZE = 4;
const CURVATURE_FACTOR = 0.2;

export const Canvas = (props: CanvasProps) => {
  const { type } = props;
  const ascEntry = useAtomValue(currentAscEntryAtom);
  const graph3dRef =
    useRef<ForceGraphMethods<NodeObject<TNodeExtra>, LinkObject<TNodeExtra, TLinkExtra>>>(
      undefined
    );
  const graph2dRef =
    useRef<ForceGraphMethods2D<NodeObject<TNodeExtra>, LinkObject<TNodeExtra, TLinkExtra>>>(
      undefined
    );
  const [hoverNode, setHoverNode] = useState<NodeObject<TNodeExtra> | null>(null);

  const { graphData, bidirectionalLinkCountBetweenNodesMap } = useMemo<{
    graphData: GraphData<TNodeExtra, TLinkExtra>;
    bidirectionalLinkCountBetweenNodesMap: Map<string, number> | undefined;
  }>(() => {
    if (ascEntry) {
      const entryNodeId = ascEntry.entryNodeId;
      const edges = ascEntry.reverseEdges;
      const nodeMap = ascEntry.nodeMap;
      const { cyclicDetailsMap } = findAllCycles(edges);
      const idToNodesMap = edges.reduce<Map<string, NodeObject<TNodeExtra>>>((total, edge) => {
        const { source, target } = edge;
        const sourceNode = total.get(source);
        const targetNode = total.get(target);
        if (!sourceNode) {
          let color = NODE_COLOR_VALID;
          if (cyclicDetailsMap.has(source)) {
            color = NODE_COLOR_ERROR;
          }
          total.set(source, {
            id: source,
            color: entryNodeId === source ? NODE_COLOR_ENTRY : color,
            label: nodeMap[source].name
          });
        }
        if (!targetNode) {
          let color = NODE_COLOR_VALID;
          if (cyclicDetailsMap.has(target)) {
            color = NODE_COLOR_ERROR;
          }
          total.set(target, {
            id: target,
            color: entryNodeId === target ? NODE_COLOR_ENTRY : color,
            label: nodeMap[target].name
          });
        }
        return total;
      }, new Map<string, NodeObject<TNodeExtra>>());
      const links = edges.map<LinkObject<TNodeExtra, TLinkExtra>>((edge) => {
        return {
          ...edge,
          color:
            cyclicDetailsMap.has(edge.source) && cyclicDetailsMap.has(edge.target)
              ? EDGE_COLOR_ERROR
              : EDGE_COLOR_VALID
        };
      });
      const bidirectionalLinkCountBetweenNodesMap =
        generateBidirectionalLinkCountBetweenNodesMap(edges);
      return {
        graphData: { nodes: Array.from(idToNodesMap.values()), links },
        bidirectionalLinkCountBetweenNodesMap
      };
    }
    return {
      graphData: { nodes: [], links: [] },
      bidirectionalLinkCountBetweenNodesMap: undefined
    };
  }, [ascEntry]);

  const handleNodeHover = useCallback((node: NodeObject<TNodeExtra> | null) => {
    setHoverNode(node);
  }, []);

  const highlightNodes = useMemo<Set<NodeObject<TNodeExtra>>>(() => {
    if (hoverNode) {
      // TODO: Implement logic to highlight nodes based on hoverNode
    }
    return new Set();
  }, [hoverNode]);

  return type === '2D' ? (
    <ForceGraph2D
      ref={graph2dRef}
      graphData={graphData}
      nodeRelSize={NODE_REL_SIZE}
      nodeLabel={'label'}
      nodeCanvasObjectMode={() => 'after'}
      nodeCanvasObject={(node: NodeObject<TNodeExtra>, ctx, globalScale) => {
        const { label, x = 0, y = 0, color } = node;
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'black';
        ctx.fillText(label, x, y + 6);
        if (node === hoverNode || highlightNodes.has(node)) {
          ctx.beginPath();
          ctx.arc(x, y, NODE_REL_SIZE * 1.4, 0, 2 * Math.PI, false);
          ctx.strokeStyle = color;
          ctx.stroke();
        }
      }}
      linkWidth={2}
      linkDirectionalArrowLength={5}
      linkDirectionalArrowRelPos={1}
      linkCurvature={(link: LinkObject<TLinkExtra>) => {
        const { source, target } = link;
        if (typeof source !== 'object' || typeof target !== 'object') {
          return 0;
        }
        const edgeId = getDirectionIndependentEdgeId({
          source: String(source.id ?? ''),
          target: String(target.id ?? '')
        });
        const curvature = Math.max(
          (bidirectionalLinkCountBetweenNodesMap?.get(edgeId) ?? 0) - 1,
          0
        );
        return curvature * CURVATURE_FACTOR;
      }}
      cooldownTicks={100}
      onNodeHover={handleNodeHover}
      onEngineStop={() => graph2dRef.current?.zoomToFit(500, 100)}
    />
  ) : (
    <ForceGraph3D
      ref={graph3dRef}
      extraRenderers={extraRenderers}
      graphData={graphData}
      linkDirectionalArrowLength={3.5}
      linkDirectionalArrowRelPos={1}
      linkCurvature={0.25}
      linkOpacity={0.5}
      linkWidth={1}
      nodeColor={'color'}
      nodeLabel={'label'}
      nodeThreeObject={(node: NodeObject<TNodeExtra>) => {
        const nodeEl = document.createElement('div');
        nodeEl.textContent = node.label;
        nodeEl.style.color = 'black';
        nodeEl.style.fontFamily = 'Sans-Serif';
        nodeEl.style.paddingLeft = '120px';
        return new CSS2DObject(nodeEl);
      }}
      nodeThreeObjectExtend={true}
      linkColor={'color'}
      backgroundColor="#f8fafc"
      cooldownTicks={100}
      onEngineStop={() => graph3dRef.current?.zoomToFit(500, 100)}
    />
  );
};
