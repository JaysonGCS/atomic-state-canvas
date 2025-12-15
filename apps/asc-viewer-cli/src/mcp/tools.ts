import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  generateAtomicStateGraph,
  findAllCycles,
  getFileDetailsGivenFramework
} from '@atomic-state-canvas/core';
import { launchViewer } from './viewer';

// Tool schemas
const analyzeStateSchema = z.object({
  entryFile: z.string().describe('Absolute path to the entry file containing the state'),
  entryVariable: z.string().describe('Name of the atom/selector variable to analyze'),
  framework: z.enum(['recoil']).default('recoil').describe('State management framework'),
  excludePattern: z.string().optional().describe('Glob pattern to exclude files')
});

const findCyclesSchema = z.object({
  entryFile: z.string().describe('Absolute path to the entry file'),
  entryVariable: z.string().describe('Name of the atom/selector variable'),
  framework: z.enum(['recoil']).default('recoil').describe('State management framework'),
  excludePattern: z.string().optional().describe('Glob pattern to exclude files')
});

const listAtomsSchema = z.object({
  filePath: z.string().describe('Absolute path to the file to analyze'),
  framework: z.enum(['recoil']).default('recoil').describe('State management framework'),
  excludePattern: z.string().optional().describe('Glob pattern to exclude files')
});

const launchViewerSchema = z.object({
  port: z.number().optional().default(1296).describe('Port to run the viewer on'),
  watchDir: z.string().optional().describe('Directory to watch for .asc files')
});

// Tool definitions for MCP
export const tools = [
  {
    name: 'analyze_state',
    description:
      'Generate a dependency graph from an entry file and variable. Returns the graph structure with nodes and edges showing state dependencies.',
    inputSchema: zodToJsonSchema(analyzeStateSchema)
  },
  {
    name: 'find_cycles',
    description:
      'Detect cyclic dependencies in state management code. Returns information about self-references and cyclic dependency chains.',
    inputSchema: zodToJsonSchema(findCyclesSchema)
  },
  {
    name: 'list_atoms',
    description:
      'List all atoms and selectors in a file with their dependencies. Useful for understanding what state is defined in a specific file.',
    inputSchema: zodToJsonSchema(listAtomsSchema)
  },
  {
    name: 'launch_viewer',
    description:
      'Start the Atomic State Canvas web viewer for visual exploration of state dependencies. Opens an interactive 2D/3D visualization.',
    inputSchema: zodToJsonSchema(launchViewerSchema)
  }
];

type ToolResult = {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
};

// Tool implementation handlers
export async function handleToolCall(toolName: string, args: unknown): Promise<ToolResult> {
  try {
    switch (toolName) {
      case 'analyze_state':
        return analyzeState(analyzeStateSchema.parse(args));
      case 'find_cycles':
        return findCyclesHandler(findCyclesSchema.parse(args));
      case 'list_atoms':
        return listAtoms(listAtomsSchema.parse(args));
      case 'launch_viewer':
        return await launchViewerHandler(launchViewerSchema.parse(args));
      default:
        return {
          isError: true,
          content: [{ type: 'text', text: `Unknown tool: ${toolName}` }]
        };
    }
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }
      ]
    };
  }
}

// analyze_state implementation
function analyzeState(args: z.infer<typeof analyzeStateSchema>): ToolResult {
  const { entryFile, entryVariable, framework, excludePattern } = args;

  const { graph, entryNodeId } = generateAtomicStateGraph(entryFile, framework, {
    searchVariableName: entryVariable,
    excludePatternInGlob: excludePattern
  });

  const { nodeMap, getEdgeList } = graph.getInternalData();
  const edges = getEdgeList();
  const nodes = Array.from(nodeMap.values());

  const result = {
    entryNodeId,
    totalNodes: nodes.length,
    totalEdges: edges.length,
    nodes: nodes.map((n) => ({
      id: n.id,
      name: n.name,
      dependencies: n.dependencies
    })),
    edges: edges.map((e) => ({ from: e.source, to: e.target }))
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }
    ]
  };
}

// find_cycles implementation
function findCyclesHandler(args: z.infer<typeof findCyclesSchema>): ToolResult {
  const { entryFile, entryVariable, framework, excludePattern } = args;

  const { graph } = generateAtomicStateGraph(entryFile, framework, {
    searchVariableName: entryVariable,
    excludePatternInGlob: excludePattern
  });

  const { getEdgeList } = graph.getInternalData();
  const edges = getEdgeList();
  const { allCycles, cyclicStatsMap } = findAllCycles(edges);

  const selfReferences = cyclicStatsMap.get('self-reference') || [];
  const cyclicDeps = cyclicStatsMap.get('cyclic') || [];

  const result = {
    hasCycles: allCycles.length > 0,
    totalCycles: allCycles.length,
    selfReferences: {
      count: selfReferences.length,
      nodes: selfReferences.flat()
    },
    cyclicDependencies: {
      count: cyclicDeps.length,
      chains: cyclicDeps
    }
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }
    ]
  };
}

// list_atoms implementation
function listAtoms(args: z.infer<typeof listAtomsSchema>): ToolResult {
  const { filePath, framework, excludePattern } = args;
  const excludeRegex = excludePattern ? new RegExp(excludePattern) : undefined;

  const fileDetails = getFileDetailsGivenFramework(
    filePath,
    framework,
    { excludePattern: excludeRegex },
    { skipImport: false }
  );

  const result = {
    filePath,
    totalAtoms: fileDetails.presentNodes.length,
    atoms: fileDetails.presentNodes.map((node) => ({
      name: node.name,
      id: node.id,
      dependencies: node.dependencies,
      dependencyCount: node.dependencies.length
    })),
    imports: fileDetails.importDetailsList.map((imp) => ({
      variables: imp.importVariables,
      from: imp.pathName,
      type: imp.importType
    }))
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }
    ]
  };
}

// launch_viewer implementation
async function launchViewerHandler(args: z.infer<typeof launchViewerSchema>): Promise<ToolResult> {
  const { port, watchDir } = args;

  try {
    const result = await launchViewer({ port, watchDir });
    return {
      content: [
        {
          type: 'text',
          text: `Atomic State Canvas Viewer started at ${result.url}`
        }
      ]
    };
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Failed to launch viewer: ${error instanceof Error ? error.message : String(error)}`
        }
      ]
    };
  }
}
