import { atom } from 'jotai/vanilla';
import { IAscMetadata } from '@atomic-state-canvas/asc-viewer-libs';

export const ascStoreAsyncAtom = atom<Promise<IAscMetadata[]>>(async () => {
  const res = await fetch(`/.atomic-state-canvas`);
  return res.json() as Promise<IAscMetadata[]>;
});
