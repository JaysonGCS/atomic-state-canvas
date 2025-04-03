import {
  Argument,
  ExportNamedDeclaration,
  VariableDeclaration,
  VariableDeclarator
} from 'oxc-parser';
import { TPluginConfig, TSimpleNode } from '../types';
import { base, simple } from 'acorn-walk';

const RECOIL_FUNCTIONS = ['atom', 'selector', 'atomFamily', 'selectorFamily'];

const extractRecoilKey = (argument: Argument): string | undefined => {
  if (argument.type === 'ObjectExpression') {
    const properties = argument.properties;
    let recoilKey: string | undefined;
    for (const property of properties) {
      if (
        property.type === 'Property' &&
        property.key.type === 'Identifier' &&
        property.key.name === 'key' &&
        property.value.type === 'Literal'
      ) {
        recoilKey = String(property.value.value);
        break;
      }
    }
    return recoilKey;
  }
  return undefined;
};

const getDependencies = (argument: Argument): string[] => {
  const dependencies: string[] = [];
  simple(
    argument,
    {
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'get') {
          const getterArgument = node.arguments.at(0);
          if (getterArgument) {
            if (getterArgument.type === 'Identifier') {
              // Simply calling atom or selector
              const dependentAtomOrSelectorName = getterArgument.name;
              dependencies.push(dependentAtomOrSelectorName);
            } else if (
              getterArgument.type === 'CallExpression' &&
              getterArgument.callee.type === 'Identifier'
            ) {
              // Calling atomFamily or selectorFamily
              const dependentAtomFamilyOrSelectorFamilyName = getterArgument.callee.name;
              dependencies.push(dependentAtomFamilyOrSelectorFamilyName);
            }
          }
        }
      }
    },
    {
      ...base,
      // @ts-expect-error -- This is to handle typescript casting expression, acorn-walk would crash if we don't provide a mock implementation
      TSAsExpression: () => {},
      TSSatisfiesExpression: () => {}
    }
  );
  return dependencies;
};

const getVariableDeclaratorDetails = (
  variableDeclaration: VariableDeclarator
):
  | {
      variableName: string;
      variableKey: string;
      stateFunctionName: string;
      functionArguments: Array<Argument>;
      dependencies: string[];
    }
  | undefined => {
  if (variableDeclaration.id.type === 'Identifier') {
    const init = variableDeclaration.init;
    if (init?.type === 'CallExpression' && init.callee.type === 'Identifier') {
      const stateFunctionName = init.callee.name;
      const argument = init.arguments.at(0);
      const recoilKey: string | undefined = argument ? extractRecoilKey(argument) : undefined;
      return {
        variableName: variableDeclaration.id.name,
        variableKey: recoilKey ?? variableDeclaration.id.name,
        stateFunctionName,
        functionArguments: init.arguments,
        dependencies: argument ? getDependencies(argument) : []
      };
    }
  }
  return undefined;
};

const isRecoilRelatedVariableDeclarator = (variableDeclarator: VariableDeclarator): boolean => {
  if (variableDeclarator.id.type === 'Identifier') {
    const details = getVariableDeclaratorDetails(variableDeclarator);
    if (details) {
      // Here we will find out if the entry variable is an instance of certain state library or not (e.g., selectorFamily or atom)
      const { stateFunctionName } = details;
      // TODO: Utilise plugin pattern to load library specific setup
      const isValid = RECOIL_FUNCTIONS.some((func) => func === stateFunctionName);
      return isValid;
    }
  }
  return false;
};

export const config: TPluginConfig = {
  parseDeclarationNode: function (
    astNode: VariableDeclaration | ExportNamedDeclaration
  ): TSimpleNode | undefined {
    let simpleNode: TSimpleNode | undefined;
    const declaration = astNode.type === 'ExportNamedDeclaration' ? astNode.declaration : astNode;
    if (declaration !== null && declaration.type === 'VariableDeclaration') {
      const variableDeclarator = declaration.declarations.at(0);
      if (variableDeclarator && isRecoilRelatedVariableDeclarator(variableDeclarator)) {
        const details = getVariableDeclaratorDetails(variableDeclarator);
        if (details) {
          const { variableName, variableKey, dependencies } = details;
          simpleNode = {
            name: variableName,
            id: variableKey,
            dependencies
          };
        }
      }
    }
    return simpleNode;
  }
};
