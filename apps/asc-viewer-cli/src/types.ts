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
