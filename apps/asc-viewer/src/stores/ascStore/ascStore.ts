import { atom } from 'jotai/vanilla';
import { IAscMetadata } from '@atomic-state-canvas/asc-viewer-libs';
import { THierarchyItem } from './types';
import { populateRootHierarchy } from './utils';

export const ascStoreAsyncAtom = atom<Promise<IAscMetadata[]>>(async () => {
  const res = await fetch(`/.atomic-state-canvas`);
  return res.json() as Promise<IAscMetadata[]>;
});

export const ascHierarchyAtom = atom<Promise<THierarchyItem>>(async (get) => {
  const ascMetadataList = await get(ascStoreAsyncAtom);
  return ascMetadataList.reduce<THierarchyItem>(
    (total: THierarchyItem, metadata: IAscMetadata) => {
      metadata.entries.forEach((entry) => {
        populateRootHierarchy(total, entry);
      });
      return total;
    },
    { id: 'root', label: 'Root', type: 'group', children: [] }
  );
});
