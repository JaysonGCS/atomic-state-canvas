import { SidebarInset, SidebarProvider } from '@atomic-state-canvas/components/ui/sidebar';
import { AppSideBar } from '@atomic-state-canvas/components/wrapper/AppSideBar';
import { useAtomValue, useSetAtom } from 'jotai';
import { loadable } from 'jotai/utils';
import { useCallback, useState } from 'react';
import { ascHierarchyAtom, currentAscIdAtom } from '../stores/ascStore/ascStore';
import { THierarchyItem } from '../stores/ascStore/types';
import { Canvas } from './canvas';
import { Tabs, TabsList, TabsTrigger } from '@atomic-state-canvas/components/ui/tabs';
import { isDimensionValid, TViewDimension } from './utils';

const loadableAscHierarchyAtom = loadable<Promise<THierarchyItem>>(ascHierarchyAtom);
const loadableCurrentAscIdAtom = loadable<Promise<string | undefined>>(currentAscIdAtom);

export function App() {
  const ascHierarchyLoadable = useAtomValue(loadableAscHierarchyAtom);
  const currentAscIdLoadable = useAtomValue(loadableCurrentAscIdAtom);
  const setCurrentAscId = useSetAtom(currentAscIdAtom);
  const [dimension, setDimension] = useState<TViewDimension>('2D');

  const handleItemClick = useCallback(
    (itemId: string) => {
      setCurrentAscId(Promise.resolve(itemId));
    },
    [setCurrentAscId]
  );

  const handleChangeDimension = useCallback((value: string) => {
    if (isDimensionValid(value)) {
      setDimension(value);
    } else {
      console.error(`Invalid dimension value: ${value}`);
    }
  }, []);

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
          <Canvas type={dimension} />
          <Tabs
            defaultValue={dimension}
            onValueChange={handleChangeDimension}
            className="absolute left-1/2 top-4 -translate-x-1/2">
            <TabsList>
              <TabsTrigger value={'2D' satisfies TViewDimension}>2 Dimensional</TabsTrigger>
              <TabsTrigger value={'3D' satisfies TViewDimension}>3 Dimensional</TabsTrigger>
            </TabsList>
          </Tabs>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

export default App;
