import { Graph } from '../dataStructure';
import { logMsg } from '../logUtils';
import { TCanvasDirection, TSimpleNode } from '../types';
import { generateForceGraphLayout } from './forceDirectedLayout';
import { generateSimpleTopolofyGraphLayout } from './simpleTopologyLayout';

export type TLayoutType = 'FORCE_DIRECTED' | 'SIMPLE_TOPOLOGY';

export type TLayoutProps = {
  graph: Graph<TSimpleNode>;
  leafNodeId: string;
  type?: TLayoutType;
  options: { direction: TCanvasDirection };
};

export const generateGraphLayout = (props: TLayoutProps) => {
  const { graph, leafNodeId, type = 'SIMPLE_TOPOLOGY', options } = props;
  logMsg(`Generating JSON Canvas with direction ${options.direction} and layout type ${type}`);

  if (type === 'FORCE_DIRECTED') {
    return generateForceGraphLayout(graph, leafNodeId, options);
  } else if (type === 'SIMPLE_TOPOLOGY') {
    return generateSimpleTopolofyGraphLayout(graph, leafNodeId, options);
  }
  throw new Error(`Unsupported layout type: ${type}`);
};
