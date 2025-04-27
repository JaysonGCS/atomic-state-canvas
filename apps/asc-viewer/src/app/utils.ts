import { TEdge } from '@atomic-state-canvas/asc-viewer-libs';

export type TViewDimension = '2D' | '3D';

export const isDimensionValid = (value: string): value is TViewDimension =>
  (['2D', '3D'] satisfies TViewDimension[]).map(String).includes(value);

export const getDirectionIndependentEdgeId = (edge: TEdge): string => {
  // Sort source and target alphabetically to make the key direction-independent
  const [node1, node2] = [edge.source, edge.target].sort();
  return `${node1}-${node2}`;
};

export const generateBidirectionalLinkCountBetweenNodesMap = (
  edges: TEdge[]
): Map<string, number> => {
  const linkMap = new Map<string, number>();
  for (const edge of edges) {
    const key = getDirectionIndependentEdgeId(edge);
    linkMap.set(key, (linkMap.get(key) || 0) + 1);
  }
  return linkMap;
};
