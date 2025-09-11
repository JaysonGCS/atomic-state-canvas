import {
  getFileDetailsGivenFramework,
  globToRegex,
  TFileDetails,
  TSimpleNode
} from '@atomic-state-canvas/core';
import { Expression, Property, SpreadElement } from 'acorn';
import { simple } from 'acorn-walk';
import { promises as fs, readdirSync } from 'fs';
import { ParseResult, parseSync } from 'oxc-parser';
import path from 'path';
import { IAscObject } from '@atomic-state-canvas/asc-viewer-libs';
import crypto from 'crypto';

export function astObjectToJSObject<T = unknown>(properties: (Property | SpreadElement)[]): T {
  const result: Record<string, unknown> = {};

  for (const prop of properties) {
    if (prop.type !== 'Property') continue;

    const key = getPropertyKey(prop);

    result[key] = evaluateExpression(prop.value);
  }

  return result as T;
}

function getPropertyKey(prop: Property): string {
  if (prop.key.type === 'Identifier') return prop.key.name;
  if (prop.key.type === 'Literal') return String(prop.key.value);
  throw new Error('Unsupported property key type');
}

function evaluateExpression(node: Expression): unknown {
  switch (node.type) {
    case 'Literal':
      return node.value;
    case 'Identifier':
      return node.name;
    default:
      return null; // Can expand to handle more cases
  }
}

export const findAscEntryDetails = async (
  ascConfigFilePath: string,
  excludePatternInGlob: string | undefined
): Promise<Map<string, { ascObject: IAscObject<string>; pathName: string | undefined }>> => {
  const fileContent = await fs.readFile(ascConfigFilePath, 'utf-8');
  const parseResult: ParseResult = parseSync(ascConfigFilePath, fileContent);
  const baseDir = path.dirname(ascConfigFilePath);
  const excludePattern = excludePatternInGlob ? globToRegex(excludePatternInGlob) : undefined;
  const entrySelectorToDetailsMap = new Map<
    string,
    { ascObject: IAscObject<string>; pathName: string | undefined }
  >();
  // simple(parseResult.program, {
  //   ExportDefaultDeclaration: (node) => {
  //     if (node.declaration.type === 'Identifier') {
  //       // We still need to find the actual variable.
  //       const identifierName = node.declaration.name;
  //       defaultWithObjectName = identifierName;
  //     } else if (node.declaration.type === 'ObjectExpression') {
  //       // Returns directly, so we can simply extract from here.
  //       const ascObject = astObjectToJSObject<IAscObject>(node.declaration.properties);
  //       defaultAscObject = ascObject;
  //     }
  //   }
  // });
  simple(parseResult.program, {
    ExportNamedDeclaration: (node) => {
      if (
        node.declaration.type === 'VariableDeclaration' &&
        node.declaration.declarations.length === 1
      ) {
        const objExpression = node.declaration.declarations[0].init;
        if (objExpression.type === 'ObjectExpression') {
          const ascObject = astObjectToJSObject<IAscObject<string>>(objExpression.properties);
          if (ascObject !== undefined) {
            entrySelectorToDetailsMap.set(String(ascObject.entry), {
              ascObject,
              pathName: undefined
            });
          }
        }
      }
    }
  });
  // if (defaultWithObjectName !== undefined) {
  //   simple(parseResult.program, {
  //     VariableDeclarator: (node) => {
  //       if (node.id.type === 'Identifier' && node.id.name === defaultWithObjectName) {
  //         if (node.init.type === 'ObjectExpression') {
  //           defaultAscObject = astObjectToJSObject<IAscObject>(node.init.properties);
  //         }
  //       }
  //     }
  //   });
  // }
  if (entrySelectorToDetailsMap.size !== 0) {
    simple(parseResult.program, {
      ImportDeclaration: (node) => {
        if (node.source.type === 'Literal') {
          const fileWithoutExt = node.source.value;
          const importSpecifiers = node.specifiers;
          const importVariableNames: string[] = [];
          importSpecifiers.forEach((specifier) => {
            if (specifier.type === 'ImportSpecifier' && specifier.imported.type === 'Identifier') {
              importVariableNames.push(specifier.imported.name);
            }
          });
          const normalizedPathWithoutExt = path.normalize(`${baseDir}${path.sep}${fileWithoutExt}`);
          const rawFileNames = readdirSync(baseDir);
          // There could be multiple files with the same name but different extensions
          const actualFilesWithExt: string[] = rawFileNames.filter(
            (fileName) => fileName.split('.')[0] === path.basename(normalizedPathWithoutExt)
          );
          importVariableNames.forEach((variableName) => {
            const ascDetails = entrySelectorToDetailsMap.get(variableName);
            if (ascDetails !== undefined) {
              actualFilesWithExt.forEach((actualFileWithExt) => {
                const potentialActualAbsolutePath = path.normalize(
                  `${baseDir}${path.sep}${actualFileWithExt}`
                );
                // Skip import for this level to avoid potential infinite loop
                const fileDetails: TFileDetails = getFileDetailsGivenFramework(
                  potentialActualAbsolutePath,
                  ascDetails.ascObject.plugin,
                  { excludePattern },
                  {
                    skipImport: true
                  }
                );
                const isImportSource = fileDetails.presentNodes.some((simpleNode: TSimpleNode) => {
                  return simpleNode.name === variableName;
                });
                if (isImportSource && ascDetails.pathName === undefined) {
                  entrySelectorToDetailsMap.set(variableName, {
                    ascObject: ascDetails.ascObject,
                    pathName: potentialActualAbsolutePath
                  });
                }
              });
            }
          });
        }
      }
    });
  }
  return entrySelectorToDetailsMap;
};

export const generateId = (ascObject: IAscObject, entryNodeId: string): string => {
  return `${ascObject.title}-${entryNodeId}-${ascObject.plugin}`;
};

export const generateHash = (text: string): string => {
  return crypto.createHash('sha1').update(text).digest('hex');
};
