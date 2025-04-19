export interface IAscObject {
  entry: unknown;
  plugin: string;
  title: string;
}

export interface IAscConfig {
  extensions?: string[];
  port?: number;
  watchDir?: string;
}
