import { base, simple } from 'acorn-walk';
import fs from 'fs';
import { ImportDeclaration, ParseResult, parseSync } from 'oxc-parser';
import path from 'path';
import { Graph } from './dataStructure';
import { getExtension } from './fileUtils';
import { TFileDetails, TImportDetails, TOptions, TPluginConfig, TSimpleNode } from './types';
import { cliConfig } from './configUtils';
import { logMsg } from './logUtils';

const ALLOWED_EXTENSIONS = ['ts', 'js', 'tsx', 'jsx'];

const readStateFile = (pathName: string): string => {
  try {
    const extension = getExtension(pathName);
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
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
  pluginConfig: TPluginConfig,
  options: TOptions
): string => {
  const indexFileContent = readStateFile(indexFilePath);
  const indexFileAst = parseSync(indexFilePath, indexFileContent);
  let actualAbsolutePath: string | undefined = undefined;
  simple(
    indexFileAst.program,
    {
      ExportAllDeclaration(node) {
        if (actualAbsolutePath !== undefined) {
          // If the actual absolute path is already determined, skip further processing
          return;
        }
        const actualRelativePathWithoutExt = String(node.source.value);
        const normalizedActualRelativePathWithoutExt = path.normalize(actualRelativePathWithoutExt);
        const directory = path.dirname(indexFilePath);
        const rawFileNames = fs.readdirSync(directory);
        const fileNames = options.excludePattern
          ? rawFileNames.filter((fileName) => !options.excludePattern.test(fileName))
          : rawFileNames;
        // There could be multiple files with the same name but different extensions
        const actualFilesWithExt: string[] = fileNames.filter(
          (fileName) => fileName.split('.')[0] === normalizedActualRelativePathWithoutExt
        );
        actualFilesWithExt.forEach((actualFileWithExt) => {
          const potentialActualAbsolutePath = path.normalize(
            `${directory}${path.sep}${actualFileWithExt}`
          );
          // Skip import for this level to avoid potential infinite loop
          const fileDetails = getFileDetails(potentialActualAbsolutePath, pluginConfig, options, {
            skipImport: true
          });
          const isImportSource = fileDetails.presentNodes.some((simpleNode) => {
            return simpleNode.name === importVariableName;
          });
          if (isImportSource && actualAbsolutePath === undefined) {
            actualAbsolutePath = potentialActualAbsolutePath;
          }
        });
      }
    },
    {
      ...base,
      // @ts-expect-error -- This is to handle typescript casting expression, acorn-walk would crash if we don't provide a mock implementation
      TSAsExpression: () => {},
      TSSatisfiesExpression: () => {}
    }
  );
  // FIXME: probably shouldn't return indexFilePath since it's wrong
  return actualAbsolutePath ?? indexFilePath;
};

const getIndexFileFromRelativePath = (
  directory: string,
  relativePath: string,
  options: TOptions
): string | undefined => {
  const fullPath =
    relativePath === '.' ? directory : path.normalize(`${directory}${path.sep}${relativePath}`);
  try {
    const isDirectory = fs.lstatSync(fullPath).isDirectory();
    if (!isDirectory) {
      return undefined;
    }
  } catch (err) {
    if (cliConfig.verbose) {
      logMsg(String(err), true);
    }
    // When the file does not exist, lstatSync will throw an error.
    return undefined;
  }
  const rawFileNames = fs.readdirSync(fullPath);
  const fileNames = options.excludePattern
    ? rawFileNames.filter((fileName) => !options.excludePattern.test(fileName))
    : rawFileNames;
  const indexFileWithExt = fileNames.find((fileName) => fileName.startsWith('index.'));
  return indexFileWithExt ? path.join(fullPath, indexFileWithExt) : undefined;
};

const convertImportDeclarationToImportDetails = (
  entryDirectoryName: string,
  importDeclaration: ImportDeclaration,
  pluginConfig: TPluginConfig,
  options: TOptions
): TImportDetails[] => {
  const importFromPath = importDeclaration.source.value;
  const importType = isImportFromPathAlias(importFromPath) ? 'alias' : 'file';
  const importVariables: string[] = [];
  simple(
    importDeclaration,
    {
      ImportSpecifier(node) {
        if (node.imported.type === 'Identifier') {
          importVariables.push(node.imported.name);
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
  if (importType === 'alias') {
    return [
      {
        importVariables,
        pathName: importFromPath,
        importType
      }
    ];
  }
  // Check if the import is exported from index.ts or index.js
  const indexFilePathWithExt = getIndexFileFromRelativePath(
    entryDirectoryName,
    importFromPath,
    options
  );
  if (indexFilePathWithExt) {
    const importPathToVariablesMap = importVariables.reduce<{ [path: string]: string[] }>(
      (acc, importVar) => {
        // Read index file and figure out the true source of where the import is coming from
        const actualPath = getActualPathFromIndexFile(
          indexFilePathWithExt,
          importVar,
          pluginConfig,
          options
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
  const fullFilePathWithoutExt = path.normalize(
    `${entryDirectoryName}${path.sep}${importFromPath}`
  );
  const directory = path.dirname(fullFilePathWithoutExt);
  const rawFileNames = fs.readdirSync(directory);
  const fileNames = options.excludePattern
    ? rawFileNames.filter((fileName) => !options.excludePattern.test(fileName))
    : rawFileNames;
  const parts = importFromPath.split(path.sep);
  const fileNameReferenceWithoutExtension = parts[parts.length - 1];
  const fileNameWithExtension = fileNames.find((fileName) => {
    const fileNameWithoutExtension = fileName.split('.')[0];
    return fileNameReferenceWithoutExtension === fileNameWithoutExtension;
  });
  if (!fileNameWithExtension) {
    return [];
  }
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
  options: TOptions,
  readOptions?: { skipImport?: boolean }
): TFileDetails => {
  const fileData = readStateFile(pathName);
  const parseResult: ParseResult = parseSync(pathName, fileData);
  const entryDirectoryName = path.dirname(pathName);
  return parseResult.program.body.reduce<TFileDetails>(
    (total, node) => {
      if (!readOptions?.skipImport && node.type === 'ImportDeclaration') {
        total.importDetailsList.push(
          ...convertImportDeclarationToImportDetails(
            entryDirectoryName,
            node,
            pluginConfig,
            options
          )
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
  pluginConfig: TPluginConfig,
  options: TOptions
): TFileDetails => {
  const { pathName } = importDetails;
  if (cliConfig.verbose) {
    logMsg(`Reading file from import: ${pathName}`, true);
  }
  if (importDetails?.importType === 'alias') {
    // TODO: Implement alias import support
    logMsg(
      `Alias import not supported for "${importDetails.importVariables.toString()}" from "${importDetails.pathName}"`
    );
    return {
      importDetailsList: [],
      presentNodes: importDetails.importVariables.map<TSimpleNode>((variable) => ({
        dependencies: [],
        // No way to traverse and find out the true id because we didn't walk the alias import file
        id: variable,
        name: `${variable}`
      }))
    };
  }
  return getFileDetails(pathName, pluginConfig, options);
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
const visitedNodeId = new Set();

export const _clearVisitedNodeId = () => {
  visitedNodeId.clear();
};

export const generateGraph = (
  fileDetails: TFileDetails,
  entryNodeName: string,
  pluginConfig: TPluginConfig,
  options: TOptions,
  prevNodeId: string | null,
  graph: Graph<TSimpleNode> = new Graph()
): Graph<TSimpleNode> => {
  const entryNode = getEntryNode(fileDetails, entryNodeName);
  if (!entryNode) {
    throw new Error(`Entry node ${entryNodeName} not found`);
  }
  const entryNodeId = entryNode.id;
  if (prevNodeId !== null && visitedNodeId.has(entryNodeId)) {
    // Terminate here because the entry node has been visited.
    return;
  }
  visitedNodeId.add(entryNodeId);
  entryNode.dependencies.forEach((dependency) => {
    let dependencyNode: TSimpleNode | undefined;
    let fileDetailForDependency: TFileDetails | undefined;
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
        const importFileDetails = getFileDetailsFromImportDetails(
          importDetails,
          pluginConfig,
          options
        );
        const importNode = importFileDetails.presentNodes.find((node) => node.name === dependency);
        if (importNode) {
          dependencyNode = importNode;
          fileDetailForDependency = importFileDetails;
        }
      }
    }
    if (dependencyNode && fileDetailForDependency) {
      if (cliConfig.verbose) {
        logMsg(`Adding edge from ${entryNode.name} to ${dependencyNode.name}`, true);
      }
      graph.addEdge(entryNode, dependencyNode);
      // Here we need to check if dependencyNode has dependencies as well. If it has dependencies, we need to recursively generate the graph for those dependencies as well.
      if (dependencyNode.dependencies.length !== 0) {
        if (cliConfig.verbose) {
          logMsg(`Generating graph for ${dependencyNode.name}`, true);
        }
        // This step traverse to the next level to repeat the step for the dependent node
        generateGraph(
          fileDetailForDependency,
          dependencyNode.name,
          pluginConfig,
          options,
          entryNodeId,
          graph
        );
      }
    }
  });
  return graph;
};
