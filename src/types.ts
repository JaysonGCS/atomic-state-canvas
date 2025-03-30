export type TDependencyGraph = {
  dependencyName: string;
  dependencyType: string;
  dependencies?: TDependencyGraph[];
};
