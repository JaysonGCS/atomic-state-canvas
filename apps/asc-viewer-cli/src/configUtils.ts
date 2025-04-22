import { logMsg } from '@atomic-state-canvas/core';
import { CosmiconfigResult, PublicExplorer } from 'cosmiconfig';
import { IAscConfig } from '@atomic-state-canvas/asc-viewer-libs';

export const loadConfig = async (explorer: PublicExplorer): Promise<IAscConfig> => {
  try {
    const result: CosmiconfigResult = await explorer.search();
    if (result) {
      logMsg(`Loaded config from: ${result.filepath}`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return result.config;
    } else {
      logMsg('No config found, using defaults.');
      return {};
    }
  } catch (err) {
    console.error('Error loading config:', err);
    return {};
  }
};
