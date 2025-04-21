import { atom } from 'jotai/vanilla';
import { IAscMetadata } from '@atomic-state-canvas/asc-viewer-libs';
import { THierarchyItem } from './types';
import { populateRootHierarchy } from './utils';
import { atomWithDefault } from 'jotai/utils';

export const ascStoreAsyncAtom = atom<Promise<IAscMetadata[]>>(async () => {
  const res = await fetch(`/.atomic-state-canvas`);
  return res.json() as Promise<IAscMetadata[]>;
});

export const ascHierarchyAtom = atom<Promise<THierarchyItem>>(async (get) => {
  const ascMetadataList = await get(ascStoreAsyncAtom);
  console.log(ascMetadataList);
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

export const currentAscIdAtom = atomWithDefault<Promise<string | undefined>>(async (get) => {
  const hierarchy = await get(ascHierarchyAtom);
  if (hierarchy.type === 'group') {
    return findFirstItemIdFromFirstGroup(hierarchy.children[0]);
  }
  return undefined;
});

export const currentAscMetadataAtom = atomWithDefault<Promise<IAscMetadata | undefined>>(
  async (get) => {
    const ascMetadataList = await get(ascStoreAsyncAtom);
    const currentAscId = await get(currentAscIdAtom);
    if (currentAscId) {
      for (const ascMetadata of ascMetadataList) {
        const foundEntry = ascMetadata.entries.find(
          (entry) => entry.ascObject.title === currentAscId
        );
        if (foundEntry) {
          return ascMetadata;
        }
      }
    }
    return undefined;
  }
);

const findFirstItemIdFromFirstGroup = (hierarchy: THierarchyItem): string | undefined => {
  if (hierarchy.type === 'item') {
    return hierarchy.id;
  }
  if (hierarchy.type === 'group' && hierarchy.children.length > 0) {
    return findFirstItemIdFromFirstGroup(hierarchy.children[0]);
  }
  return undefined;
};
