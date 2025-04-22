import { IAscEntry } from '@atomic-state-canvas/asc-viewer-libs';
import { THierarchyItem } from './types';

export const populateRootHierarchy = (rootHierarchyItem: THierarchyItem, ascEntry: IAscEntry) => {
  if (rootHierarchyItem.type !== 'group') {
    throw new Error('Invalid Root Hierarchy item type.');
  }
  const title = ascEntry.ascObject.title;
  const parts = title.split('/');
  let currentChildren = rootHierarchyItem.children;
  parts.forEach((hierarchyPart: string, index: number) => {
    const isLast = index === parts.length - 1;
    if (isLast) {
      currentChildren.push({
        id: parts.join('/'),
        label: hierarchyPart,
        type: 'item'
      });
    } else {
      const foundGroup = currentChildren.find((child) => child.id === hierarchyPart);
      if (foundGroup && foundGroup.type === 'group') {
        currentChildren = foundGroup.children;
      } else {
        // New Group
        const newChildren: THierarchyItem[] = [];
        currentChildren.push({
          id: parts.slice(0, index + 1).join('/'),
          label: hierarchyPart,
          type: 'group',
          children: newChildren
        });
        currentChildren = newChildren;
      }
    }
  });
};
