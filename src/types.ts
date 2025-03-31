import { ExportNamedDeclaration, VariableDeclaration } from 'oxc-parser';

export type TDependencyGraph = {
  dependencyName: string;
  dependencyType: string;
  dependencies?: TDependencyGraph[];
};

export type TSimpleNode = {
  name: string;
  id: string;
  dependencies: string[];
};

export type TPluginConfig = {
  parseDeclarationNode: (
    astNode: VariableDeclaration | ExportNamedDeclaration
  ) => TSimpleNode | undefined;
};
