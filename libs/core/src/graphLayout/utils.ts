import { TEdge } from '../dataStructure';

export const generateEdgeId = (edge: TEdge): string => {
  return `${edge.source}-${edge.target}`;
};
