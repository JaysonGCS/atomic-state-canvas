import { simple } from 'acorn-walk';
import fs from 'fs';
import { ImportDeclaration, ParseResult, parseSync } from 'oxc-parser';
import path from 'path';
import { Graph } from './dataStructure';
import { getExtension } from './fileUtils';
import { TPluginConfig, TSimpleNode } from './types';
import { config } from './configUtils';
import { logMsg } from './logUtils';

type TImportDetails = {
  importVariables: string[];
  pathName: string;
  importType: 'file' | 'alias';
};

type TFileDetails = {
  importDetailsList: TImportDetails[];
  presentNodes: TSimpleNode[];
};

const readStateFile = (pathName: string): string => {
  try {
    const extension = getExtension(pathName);
    if (!(extension === 'ts' || extension === 'js')) {
      throw new Error(`Unsupported file extension: ${extension}`);
    }
    const data = fs.readFileSync(pathName, 'utf8');
    return data;
  } catch (error) {
    throw new Error(`Error reading file: ${error}`);
  }
};

const isImportFromPathAlias = (importFromPath: string): boolean => {
  return importFromPath.includes('@') || !importFromPath.startsWith('.');
};

const getActualPathFromIndexFile = (
  indexFilePath: string,
  importVariableName: string,
  pluginConfig: TPluginConfig
): string => {
  const indexFileContent = readStateFile(indexFilePath);
  const indexFileAst = parseSync(indexFilePath, indexFileContent);
  let actualAbsolutePath: string | undefined = undefined;
  simple(indexFileAst.program, {
    ExportAllDeclaration(node) {
      const actualRelativePathWithoutExt = String(node.source.value);
      const directory = path.dirname(indexFilePath);
      const fileNames = fs.readdirSync(directory);
      const actualFileWithExt = fileNames.find(
        (fileName) => fileName.split('.')[0] === actualRelativePathWithoutExt.split(path.sep).pop()
      );
      const potentialActualAbsolutePath = path.normalize(
        `${directory}${path.sep}${actualFileWithExt}`
      );
      // Skip import for this level to avoid potential infinite loop
      const fileDetails = getFileDetails(potentialActualAbsolutePath, pluginConfig, {
        skipImport: true
      });
      const isImportSource = fileDetails.presentNodes.some((simpleNode) => {
        return simpleNode.name === importVariableName;
      });
      if (isImportSource && actualAbsolutePath === undefined) {
        actualAbsolutePath = potentialActualAbsolutePath;
      }
    }
  });
  // FIXME: probably shouldn't return indexFilePath since it's wrong
  return actualAbsolutePath ?? indexFilePath;
};

const convertImportDeclarationToImportDetails = (
  entryDirectoryName: string,
  importDeclaration: ImportDeclaration,
  pluginConfig: TPluginConfig
): TImportDetails[] => {
  const importFromPath = importDeclaration.source.value;
  const importType = isImportFromPathAlias(importFromPath) ? 'alias' : 'file';
  const importVariables: string[] = [];
  simple(importDeclaration, {
    ImportSpecifier(node) {
      if (node.imported.type === 'Identifier') {
        importVariables.push(node.imported.name);
      }
    }
  });
  if (importType === 'alias') {
    return [
      {
        importVariables,
        pathName: importFromPath,
        importType
      }
    ];
  }
  if (importFromPath === '.') {
    // Check if the import is exported from index.ts or index.js
    const fileNames = fs.readdirSync(entryDirectoryName);
    const indexFileWithExt = fileNames.find((fileName) => fileName.startsWith('index.'));
    if (indexFileWithExt) {
      const fullFilePathWithExt = path.normalize(
        `${entryDirectoryName}${path.sep}${indexFileWithExt}`
      );
      const importPathToVariablesMap = importVariables.reduce<{ [path: string]: string[] }>(
        (acc, importVar) => {
          // Read index file and figure out the true source of where the import is coming from
          const actualPath = getActualPathFromIndexFile(
            fullFilePathWithExt,
            importVar,
            pluginConfig
          );
          if (!acc[actualPath]) {
            acc[actualPath] = [];
          }
          acc[actualPath].push(importVar);
          return acc;
        },
        {}
      );
      return Object.entries(importPathToVariablesMap).map(([importPath, variables]) => {
        return {
          importVariables: variables,
          pathName: importPath,
          importType
        };
      });
    }
  }
  const fullFilePathWithoutExt = path.normalize(
    `${entryDirectoryName}${path.sep}${importFromPath}`
  );
  const directory = path.dirname(fullFilePathWithoutExt);
  const fileNames = fs.readdirSync(directory);
  const parts = importFromPath.split(path.sep);
  const fileNameReferenceWithoutExtension = parts[parts.length - 1];
  const fileNameWithExtension = fileNames.find((fileName) => {
    const fileNameWithoutExtension = fileName.split('.')[0];
    return fileNameReferenceWithoutExtension === fileNameWithoutExtension;
  });

  return [
    {
      importVariables,
      pathName: path.normalize(`${directory}${path.sep}${fileNameWithExtension}`),
      importType
    }
  ];
};

export const getFileDetails = (
  pathName: string,
  pluginConfig: TPluginConfig,
  options?: { skipImport?: boolean }
): TFileDetails => {
  const fileData = readStateFile(pathName);
  const parseResult: ParseResult = parseSync(pathName, fileData);
  const entryDirectoryName = path.dirname(pathName);
  return parseResult.program.body.reduce<TFileDetails>(
    (total, node) => {
      if (!options?.skipImport && node.type === 'ImportDeclaration') {
        total.importDetailsList.push(
          ...convertImportDeclarationToImportDetails(entryDirectoryName, node, pluginConfig)
        );
      } else if (node.type === 'ExportNamedDeclaration' || node.type === 'VariableDeclaration') {
        const simpleNode: TSimpleNode | undefined = pluginConfig.parseDeclarationNode(node);
        if (simpleNode) {
          total.presentNodes.push(simpleNode);
        }
      }
      return total;
    },
    { importDetailsList: [], presentNodes: [] } satisfies TFileDetails
  );
};

const getFileDetailsFromImportDetails = (
  importDetails: TImportDetails,
  pluginConfig: TPluginConfig
): TFileDetails => {
  const { pathName } = importDetails;
  config.verbose && logMsg(`Reading file from import: ${pathName}`, true);
  return getFileDetails(pathName, pluginConfig);
};

export const getEntryNode = (
  fileDetails: TFileDetails,
  entryNodeName: string
): TSimpleNode | undefined => {
  const entryNode: TSimpleNode | undefined = fileDetails.presentNodes.find((node) => {
    return node.name === entryNodeName;
  });
  return entryNode;
};

export const generateGraph = (
  fileDetails: TFileDetails,
  entryNodeName: string,
  pluginConfig: TPluginConfig,
  graph: Graph<TSimpleNode> = new Graph()
): Graph<TSimpleNode> => {
  const entryNode = getEntryNode(fileDetails, entryNodeName);
  if (!entryNode) {
    throw new Error(`Entry node ${entryNodeName} not found`);
  }
  entryNode.dependencies.forEach((dependency) => {
    let dependencyNode;
    let fileDetailForDependency;
    const neighbourNode = fileDetails.presentNodes.find((node) => node.name === dependency);
    if (neighbourNode) {
      dependencyNode = neighbourNode;
      fileDetailForDependency = fileDetails;
    } else {
      // If not present as neighbour, find through ImportSpecifier
      const importDetails = fileDetails.importDetailsList.find((details) =>
        details.importVariables.includes(dependency)
      );
      if (importDetails) {
        const importFileDetails = getFileDetailsFromImportDetails(importDetails, pluginConfig);
        const importNode = importFileDetails.presentNodes.find((node) => node.name === dependency);
        if (importNode) {
          dependencyNode = importNode;
          fileDetailForDependency = importFileDetails;
        }
      }
    }
    if (dependencyNode && fileDetailForDependency) {
      // Here we need to check if dependencyNode has dependencies as well. If it has dependencies, we need to recursively generate the graph for those dependencies as well.
      if (dependencyNode.dependencies.length !== 0) {
        if (graph.hasCycle(entryNode.id, dependencyNode.id)) {
          graph.addNodeMetadata({
            type: 'cyclic',
            sourceId: entryNode.id,
            targetId: dependencyNode.id
          });
          logMsg(`Cycle detected between ${entryNode.name} and ${dependencyNode.name}`);
          return;
        }
        config.verbose && logMsg(`Generating graph for ${dependencyNode.name}`, true);
        generateGraph(fileDetailForDependency, dependencyNode.name, pluginConfig, graph);
      }
      config.verbose &&
        logMsg(`Adding edge from ${entryNode.name} to ${dependencyNode.name}`, true);
      graph.addEdge(entryNode, dependencyNode);
    }
  });
  return graph;
};
