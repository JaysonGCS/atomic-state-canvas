import { Graph } from '../dataStructure';
import { logMsg } from '../logUtils';
import { TCanvasDirection, TCyclicDetails, TSimpleNode } from '../types';
import { generateForceGraphLayout } from './forceDirectedLayout';
import { generateSimpleTopolofyGraphLayout } from './simpleTopologyLayout';

export type TLayoutType = 'FORCE_DIRECTED' | 'SIMPLE_TOPOLOGY';

export type TLayoutProps = {
  graph: Graph<TSimpleNode>;
  leafNodeId: string;
  type?: TLayoutType;
  cyclicDetailsMap: Map<string, TCyclicDetails>;
  options: { direction: TCanvasDirection };
};

export const generateGraphLayout = (props: TLayoutProps) => {
  const { graph, leafNodeId, type = 'SIMPLE_TOPOLOGY', options, cyclicDetailsMap } = props;
  logMsg(`Generating JSON Canvas with direction ${options.direction} and layout type ${type}`);

  if (type === 'FORCE_DIRECTED') {
    return generateForceGraphLayout(graph, leafNodeId, cyclicDetailsMap, options);
  } else if (type === 'SIMPLE_TOPOLOGY') {
    return generateSimpleTopolofyGraphLayout(graph, leafNodeId, cyclicDetailsMap, options);
  }
  throw new Error(`Unsupported layout type: ${type}`);
};
