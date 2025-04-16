import { ExportNamedDeclaration, VariableDeclaration } from 'oxc-parser';

export type TOptions = {
  excludePattern?: RegExp;
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

export type TCanvasDirection = 'LR' | 'TB';

export type TCyclicDetails = { reason: 'self-reference' | 'cyclic' };
