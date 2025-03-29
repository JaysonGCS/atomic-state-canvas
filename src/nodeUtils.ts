import { simple } from 'acorn-walk';
import { get } from 'http';
import {
  Argument,
  FunctionBody,
  ImportDeclaration,
  ParseResult,
  VariableDeclarator
} from 'oxc-parser';

// TODO: Utilise plugin pattern to load library specific setup
const RECOIL_FUNCTIONS = ['atom', 'selector', 'atomFamily', 'selectorFamily'];

type TRecoilDependencyType = 'atomOrSelector' | 'atomFamilyOrSelectorFamily';
type TRecoilDependency = {
  dependencyName: string;
  dependencyType: TRecoilDependencyType;
  dependencies?: TRecoilDependency[];
};

const getRecoilStateDependencyFromGetterStatement = (
  body: FunctionBody['body']
): TRecoilDependency[] => {
  const dependencies: TRecoilDependency[] = [];
  body.forEach((block) => {
    simple(block, {
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'get') {
          const argument = node.arguments.at(0);
          if (argument) {
            if (argument.type === 'Identifier') {
              // Simply calling atom or selector
              const dependentAtomOrSelectorName = argument.name;
              dependencies.push({
                dependencyName: dependentAtomOrSelectorName,
                dependencyType: 'atomOrSelector'
              });
            } else if (
              argument.type === 'CallExpression' &&
              argument.callee.type === 'Identifier'
            ) {
              // Calling atomFamily or selectorFamily
              const dependentAtomFamilyOrSelectorFamilyName = argument.callee.name;
              dependencies.push({
                dependencyName: dependentAtomFamilyOrSelectorFamilyName,
                dependencyType: 'atomFamilyOrSelectorFamily'
              });
            }
          }
        }
      }
    });
  });
  return dependencies;
};

// TODO: Utilise plugin pattern to load library specific setup
const recoilGraphTraverseFunctionRecord: Record<
  string,
  (
    importDeclarationList: ImportDeclaration[],
    neighbourVariableDeclaratorList: VariableDeclarator[],
    entryVariableDeclarator: VariableDeclarator
  ) => TRecoilDependency
> = {
  atom: (
    importDeclarationList: ImportDeclaration[],
    neighbourVariableDeclaratorList: VariableDeclarator[],
    entryVariableDeclarator: VariableDeclarator
  ) => {
    const { variableName, functionArguments } =
      getVariableDeclaratorDetails(entryVariableDeclarator)!;
    const obj = functionArguments.at(0);
    if (obj?.type === 'ObjectExpression') {
      obj.properties.forEach((property) => {
        if (property.type === 'Property') {
          if (property.key.type === 'Identifier') {
            const recoilProperty = property.key.name;
            if (recoilProperty === 'default') {
              // TODO
            } else if (recoilProperty === 'effects') {
              // TODO
            }
          }
        }
      });
    }
    return {
      dependencyName: variableName,
      dependencyType: 'atomOrSelector',
      dependencies: []
    };
  },
  selectorFamily: (
    importDeclarationList: ImportDeclaration[],
    neighbourVariableDeclaratorList: VariableDeclarator[],
    entryVariableDeclarator: VariableDeclarator
  ) => {
    const { variableName, functionArguments } =
      getVariableDeclaratorDetails(entryVariableDeclarator)!;
    const dependencies: TRecoilDependency[] = [];
    const obj = functionArguments.at(0);
    if (obj?.type === 'ObjectExpression') {
      obj.properties.forEach((property) => {
        if (property.type === 'Property') {
          if (property.key.type === 'Identifier') {
            const recoilPropertyName = property.key.name;
            if (recoilPropertyName === 'get') {
              if (property.value.type === 'ArrowFunctionExpression') {
                const { body } = property.value;
                if (body.type === 'ArrowFunctionExpression') {
                  // const utilisedRecoilFunctionNames = body.params;
                  // console.log({ utilisedRecoilFunctionNames });
                  const getterStatement = body.body;
                  if (getterStatement.type === 'BlockStatement') {
                    const foundDependencies = getRecoilStateDependencyFromGetterStatement(
                      getterStatement.body
                    );
                    // TODO: Further traverse each entry in foundDependencies to build the dependency tree.
                    dependencies.push(...foundDependencies);
                  }
                }
              }
            }
          }
        }
      });
    }
    return {
      dependencyName: variableName,
      dependencyType: 'atomFamilyOrSelectorFamily',
      dependencies
    };
  }
};

const getVariableDeclaratorDetails = (
  variableDeclaration: VariableDeclarator
):
  | { variableName: string; stateFunctionName: string; functionArguments: Array<Argument> }
  | undefined => {
  if (variableDeclaration.id.type === 'Identifier') {
    const init = variableDeclaration.init;
    if (init?.type === 'CallExpression' && init.callee.type === 'Identifier') {
      const stateFunctionName = init.callee.name;
      return {
        variableName: variableDeclaration.id.name,
        stateFunctionName,
        functionArguments: init.arguments
      };
    }
  }
  return undefined;
};

const generateGraph = (
  importDeclarationList: ImportDeclaration[],
  neighbourVariableDeclaratorList: VariableDeclarator[],
  entryVariableDeclarator: VariableDeclarator
): TRecoilDependency => {
  const details = getVariableDeclaratorDetails(entryVariableDeclarator);
  if (details) {
    const { variableName, stateFunctionName } = details;
    if (!recoilGraphTraverseFunctionRecord[stateFunctionName]) {
      throw new Error(`No handler found for ${stateFunctionName}.`);
    }
    console.log(`Generating graph for ${variableName} [${stateFunctionName}].`);
    return recoilGraphTraverseFunctionRecord[stateFunctionName](
      importDeclarationList,
      neighbourVariableDeclaratorList,
      entryVariableDeclarator
    );
  }
  throw new Error(`No details found for entry variable declarator.`);
};

// TODO: Utilise plugin pattern to load library specific setup
const isRecoilRelatedVariableDeclarator = (variableDeclarator: VariableDeclarator): boolean => {
  if (variableDeclarator.id.type === 'Identifier') {
    const details = getVariableDeclaratorDetails(variableDeclarator);
    if (details) {
      // Here we will find out if the entry variable is an instance of certain state library or not (e.g., selectorFamily or atom)
      const { stateFunctionName, variableName } = details;
      // TODO: Utilise plugin pattern to load library specific setup
      const isValid = RECOIL_FUNCTIONS.some((func) => func === stateFunctionName);
      return isValid;
    }
  }
  return false;
};

export const generateDependencyGraph = (
  parseResult: ParseResult,
  options: { searchVariableName: string }
): TRecoilDependency => {
  const importDeclarationList: ImportDeclaration[] = [];
  const neighbourVariableDeclaratorList: VariableDeclarator[] = [];
  let entryVariableDeclarator: VariableDeclarator | undefined = undefined;
  parseResult.program.body.forEach((node) => {
    if (node.type === 'ImportDeclaration') {
      importDeclarationList.push(node);
    } else if (node.type === 'VariableDeclaration') {
      const variableDeclarator = node.declarations.at(0);
      if (variableDeclarator && isRecoilRelatedVariableDeclarator(variableDeclarator)) {
        const details = getVariableDeclaratorDetails(variableDeclarator);
        if (details) {
          // Here we will find out if the entry variable is an instance of certain state library or not (e.g., selectorFamily or atom)
          const { variableName } = details;
          const { searchVariableName } = options;
          if (searchVariableName === variableName) {
            // Here we will find the valid entry variable
            entryVariableDeclarator = variableDeclarator;
          } else {
            // If it's not the entry variable, we will push it to the neighbourVariableDeclaratorList
            neighbourVariableDeclaratorList.push(variableDeclarator);
          }
        }
      }
    } else if (node.type === 'ExportNamedDeclaration') {
      const declaration = node.declaration;
      if (declaration !== null && declaration.type === 'VariableDeclaration') {
        const variableDeclarator = declaration.declarations.at(0);
        if (variableDeclarator && isRecoilRelatedVariableDeclarator(variableDeclarator)) {
          const details = getVariableDeclaratorDetails(variableDeclarator);
          if (details) {
            // Here we will find out if the entry variable is an instance of certain state library or not (e.g., selectorFamily or atom)
            const { variableName } = details;
            const { searchVariableName } = options;
            // Here we will find the valid entry variable
            if (searchVariableName === variableName) {
              entryVariableDeclarator = variableDeclarator;
            } else {
              // If it's not the entry variable, we will push it to the neighbourVariableDeclaratorList
              neighbourVariableDeclaratorList.push(variableDeclarator);
            }
          }
        }
      }
    }
  });
  if (!entryVariableDeclarator) {
    console.log('No entry variable found');
    console.log('Please provide a valid entry variable name using the -s option');
    process.exit(1);
  }
  const graph = generateGraph(
    importDeclarationList,
    neighbourVariableDeclaratorList,
    entryVariableDeclarator
  );
  console.log({ importDeclarationList, neighbourVariableDeclaratorList });
  return graph;
};

type JSONCanvas = {
  type: 'canvas';
  version: '1.0';
  nodes: {
    id: string;
    type: 'text';
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    metadata?: Record<string, unknown>;
  }[];
  edges: {
    id: string;
    fromNode: string;
    toNode: string;
  }[];
};

export function convertToJSONCanvas(root: TRecoilDependency): JSONCanvas {
  const nodes: JSONCanvas['nodes'] = [];
  const edges: JSONCanvas['edges'] = [];

  let counter = 0;
  let depthMap: Record<number, number> = {}; // Track y positions per depth
  let maxDepth = 0;
  const width = 300;
  const height = 150;
  const bufferX = 150;
  const bufferY = 50;

  function generateId(): string {
    return `node-${counter++}`;
  }

  function calculateDepth(dependency: TRecoilDependency, depth = 0): number {
    maxDepth = Math.max(maxDepth, depth);
    dependency.dependencies?.forEach((dep) => calculateDepth(dep, depth + 1));
    return maxDepth;
  }

  calculateDepth(root); // Find max depth to place root at the rightmost position

  function traverse(dependency: TRecoilDependency, parentId: string | null, depth = 0): string {
    const nodeId = generateId();

    // Determine Y position for this depth level
    const y = depthMap[depth] || 0;
    depthMap[depth] = y + height + bufferY; // Increment for the next node at this depth

    // X position decreases as depth increases (root on the right)
    const x = (maxDepth - depth) * (width + bufferX);

    nodes.push({
      id: nodeId,
      type: 'text',
      text: dependency.dependencyName,
      x,
      y,
      width,
      height,
      metadata: { dependencyType: dependency.dependencyType }
    });

    dependency.dependencies?.forEach((dep) => {
      const childId = traverse(dep, nodeId, depth + 1);
      edges.push({
        id: `edge-${childId}-${nodeId}`,
        fromNode: childId, // Child points to parent
        toNode: nodeId
      });
    });

    return nodeId;
  }

  traverse(root, null);

  return {
    type: 'canvas',
    version: '1.0',
    nodes,
    edges
  };
}
