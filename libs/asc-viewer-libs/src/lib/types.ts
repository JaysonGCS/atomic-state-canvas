export type TCyclicDetails = { reason: 'self-reference' | 'cyclic' };

export type TEdge = { source: string; target: string };

export type TSimpleNode = {
  name: string;
  id: string;
  dependencies: string[];
};

export interface IAscObject<T = unknown> {
  entry: T;
  plugin: string;
  title: string;
}

export interface IAscConfig {
  extensions?: string[];
  port?: number;
  watchDir?: string;
}

export interface IAscEntry {
  ascObject: IAscObject;
  entryNodeId: string;
  id: string;
  nodeMap: Record<string, TSimpleNode>;
  pathName: string;
  reverseEdges: TEdge[];
}

export interface IAscMetadata {
  ascFilePath: string;
  entries: IAscEntry[];
  timestamp: number;
}
