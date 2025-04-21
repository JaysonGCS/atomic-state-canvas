import { useCallback } from 'react';
import NxWelcome from './nx-welcome';
import { ascHierarchyAtom, currentAscIdAtom } from '../stores/ascStore/ascStore';
import { useAtomValue, useSetAtom } from 'jotai';
import { loadable } from 'jotai/utils';
import { THierarchyItem } from '../stores/ascStore/types';
import { AppSideBar } from '@atomic-state-canvas/components/wrapper/AppSideBar';
import { SidebarInset, SidebarProvider } from '@atomic-state-canvas/components/ui/sidebar';
import { Canvas } from './canvas';

const loadableAscHierarchyAtom = loadable<Promise<THierarchyItem>>(ascHierarchyAtom);
const loadableCurrentAscIdAtom = loadable<Promise<string | undefined>>(currentAscIdAtom);

export function App() {
  const ascHierarchyLoadable = useAtomValue(loadableAscHierarchyAtom);
  const currentAscIdLoadable = useAtomValue(loadableCurrentAscIdAtom);
  const setCurrentAscId = useSetAtom(currentAscIdAtom);

  const handleItemClick = useCallback(
    (itemId: string) => {
      setCurrentAscId(Promise.resolve(itemId));
    },
    [setCurrentAscId]
  );

  return (
    <div>
      <SidebarProvider>
        <AppSideBar
          navigationHierarchy={
            ascHierarchyLoadable.state === 'hasData' ? ascHierarchyLoadable.data : undefined
          }
          headerLabel="Atomic State Canvas"
          selectedItemId={
            currentAscIdLoadable.state === 'hasData' ? currentAscIdLoadable.data : undefined
          }
          onItemClick={handleItemClick}
        />
        <SidebarInset className="bg-slate-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
          <NxWelcome title="asc-viewer" />
          <Canvas />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

export default App;
