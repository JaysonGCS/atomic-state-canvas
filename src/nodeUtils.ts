import { simple } from 'acorn-walk';
import {
  Argument,
  ImportDeclaration,
  ParseResult,
  VariableDeclarator,
  parseSync
} from 'oxc-parser';
import { TDependencyGraph } from './types';
import fs from 'fs';
import path from 'path';
import { Statement } from 'acorn';
import { logMsg } from './logUtils';
import { log } from 'console';
import { config } from './configUtils';

// TODO: Utilise plugin pattern to load library specific setup
const RECOIL_FUNCTIONS = ['atom', 'selector', 'atomFamily', 'selectorFamily'];

const getRecoilStateDependencyFromGetterStatement = (
  body: Array<Statement>
): TDependencyGraph[] => {
  const dependencies: TDependencyGraph[] = [];
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

const findVariableDeclaratorFromName = (
  searchVariableName: string,
  variableDeclaratorList: VariableDeclarator[]
): VariableDeclarator | undefined => {
  return variableDeclaratorList.find((variableDeclarator) => {
    const details = getVariableDeclaratorDetails(variableDeclarator);
    if (!details) {
      return false;
    }
    const { variableName } = details;
    return searchVariableName === variableName;
  });
};

// TODO: Utilise plugin pattern to load library specific setup
const recoilGraphTraverseFunctionRecord: Record<
  string,
  (
    importDeclarationList: ImportDeclaration[],
    neighbourVariableDeclaratorList: VariableDeclarator[],
    entryVariableDeclarator: VariableDeclarator,
    entryDirectoryName: string
  ) => TDependencyGraph
> = {
  atom: (
    importDeclarationList: ImportDeclaration[],
    neighbourVariableDeclaratorList: VariableDeclarator[],
    entryVariableDeclarator: VariableDeclarator,
    entryDirectoryName: string
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
      dependencyType: 'atom',
      dependencies: []
    };
  },
  selector: (
    importDeclarationList: ImportDeclaration[],
    neighbourVariableDeclaratorList: VariableDeclarator[],
    entryVariableDeclarator: VariableDeclarator,
    entryDirectoryName: string
  ) => {
    const { variableName, functionArguments } =
      getVariableDeclaratorDetails(entryVariableDeclarator)!;
    const dependencies: TDependencyGraph[] = [];
    const obj = functionArguments.at(0);
    if (obj?.type === 'ObjectExpression') {
      simple(obj, {
        ArrowFunctionExpression(body) {
          if (body.type === 'ArrowFunctionExpression') {
            const getterStatement = body.body;
            if (getterStatement.type === 'BlockStatement') {
              let foundDependencies: TDependencyGraph[] =
                getRecoilStateDependencyFromGetterStatement(getterStatement.body);
              foundDependencies = foundDependencies.map<TDependencyGraph>((dependency) => {
                const { dependencyName } = dependency;
                const neighbourVariableDeclarator: VariableDeclarator | undefined =
                  findVariableDeclaratorFromName(dependencyName, neighbourVariableDeclaratorList);
                let neighbourGraph: TDependencyGraph | undefined;
                if (neighbourVariableDeclarator) {
                  neighbourGraph = generateGraph(
                    importDeclarationList,
                    neighbourVariableDeclaratorList,
                    neighbourVariableDeclarator,
                    entryDirectoryName
                  );
                }
                let importGraph: TDependencyGraph | undefined;
                if (!neighbourGraph) {
                  // If no neighbour variable declarator is found, search for an import declaration
                  const importDeclaration = importDeclarationList.find((importDeclaration) => {
                    let found: boolean = false;
                    simple(importDeclaration, {
                      ImportSpecifier(node) {
                        if (
                          node.imported.type === 'Identifier' &&
                          node.imported.name === dependencyName
                        ) {
                          found = true;
                        }
                      }
                    });
                    return found;
                  });
                  if (importDeclaration) {
                    const fileNames = fs.readdirSync(entryDirectoryName);
                    const fileNameWithExtension = fileNames.find((fileName) => {
                      const fileNameWithoutExtension = fileName.split('.')[0];
                      return (
                        path.normalize(importDeclaration.source.value) === fileNameWithoutExtension
                      );
                    });
                    if (fileNameWithExtension) {
                      const fullFilePath = path.normalize(
                        `${entryDirectoryName}${path.sep}${fileNameWithExtension}`
                      );
                      const file = fs.readFileSync(path.normalize(fullFilePath));
                      const result = parseSync(fullFilePath, file.toString());
                      const graph = generateDependencyGraph(result, {
                        searchVariableName: dependencyName,
                        entryDirectoryName
                      });
                      importGraph = graph;
                    }
                  }
                }
                const finalGraph = importGraph ?? neighbourGraph;
                return {
                  ...dependency,
                  dependencies: finalGraph?.dependencies
                };
              });
              dependencies.push(...foundDependencies);
            }
          }
        }
      });
    }
    return {
      dependencyName: variableName,
      dependencyType: 'selector',
      dependencies
    };
  },
  selectorFamily: (
    importDeclarationList: ImportDeclaration[],
    neighbourVariableDeclaratorList: VariableDeclarator[],
    entryVariableDeclarator: VariableDeclarator,
    entryDirectoryName: string
  ) => {
    return recoilGraphTraverseFunctionRecord['selector'](
      importDeclarationList,
      neighbourVariableDeclaratorList,
      entryVariableDeclarator,
      entryDirectoryName
    );
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

const circularDetection = new Map<string, number>();
const CIRCULAR_DETECTION_THRESHOLD = 10;

const generateGraph = (
  importDeclarationList: ImportDeclaration[],
  neighbourVariableDeclaratorList: VariableDeclarator[],
  entryVariableDeclarator: VariableDeclarator,
  entryDirectoryName: string
): TDependencyGraph => {
  const details = getVariableDeclaratorDetails(entryVariableDeclarator);
  if (details) {
    const { variableName, stateFunctionName } = details;
    if (!recoilGraphTraverseFunctionRecord[stateFunctionName]) {
      throw new Error(`No handler found for ${stateFunctionName}.`);
    }
    let updatedCount = circularDetection.get(variableName) || 0;
    updatedCount += 1;
    circularDetection.set(variableName, updatedCount);
    if (updatedCount > CIRCULAR_DETECTION_THRESHOLD) {
      config.verbose &&
        logMsg(
          `Circular dependency detected. ${variableName} is called more than ${CIRCULAR_DETECTION_THRESHOLD} times.`,
          true
        );
      return {
        dependencyName: variableName,
        dependencyType: 'circular'
      };
    }
    config.verbose && logMsg(`Generating graph for ${variableName} [${stateFunctionName}].`, true);
    return recoilGraphTraverseFunctionRecord[stateFunctionName](
      importDeclarationList,
      neighbourVariableDeclaratorList,
      entryVariableDeclarator,
      entryDirectoryName
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
  options: { searchVariableName: string; entryDirectoryName: string }
): TDependencyGraph => {
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
    log('No entry variable found, please provide a valid entry variable name using the -s option');
    process.exit(1);
  }
  const graph = generateGraph(
    importDeclarationList,
    neighbourVariableDeclaratorList,
    entryVariableDeclarator,
    options.entryDirectoryName
  );
  return graph;
};
