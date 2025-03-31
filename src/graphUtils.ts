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

const convertImportDeclarationToImportDetails = (
  entryDirectoryName: string,
  importDeclaration: ImportDeclaration
): TImportDetails => {
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
    return {
      importVariables,
      pathName: importFromPath,
      importType
    };
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
  return {
    importVariables,
    pathName: path.normalize(`${directory}${path.sep}${fileNameWithExtension}`),
    importType
  };
};

export const getFileDetails = (pathName: string, pluginConfig: TPluginConfig): TFileDetails => {
  const fileData = readStateFile(pathName);
  const parseResult: ParseResult = parseSync(pathName, fileData);
  const entryDirectoryName = path.dirname(pathName);
  return parseResult.program.body.reduce<TFileDetails>(
    (total, node) => {
      if (node.type === 'ImportDeclaration') {
        total.importDetailsList.push(
          convertImportDeclarationToImportDetails(entryDirectoryName, node)
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
