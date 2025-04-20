import { useEffect } from 'react';
import NxWelcome from './nx-welcome';
import { ascStoreAsyncAtom } from '../stores/ascStore';
import { useAtomValue } from 'jotai';
import { loadable } from 'jotai/utils';
import { IAscMetadata } from '@atomic-state-canvas/asc-viewer-libs';

const loadableAscStoreAtom = loadable<Promise<IAscMetadata[]>>(ascStoreAsyncAtom);

export function App() {
  const value = useAtomValue(loadableAscStoreAtom);

  useEffect(() => {
    if (value.state === 'hasData') {
      console.log(value.data);
    }
  }, [value]);

  return (
    <div>
      <NxWelcome title="asc-viewer" />
    </div>
  );
}

export default App;
