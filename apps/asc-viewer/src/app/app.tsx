import { useEffect } from 'react';
import NxWelcome from './nx-welcome';
import { ascStoreAsyncAtom } from '../stores/ascStore';
import { useAtom } from 'jotai';
import { loadable } from 'jotai/utils';

const loadableAscStoreAtom = loadable(ascStoreAsyncAtom);

export function App() {
  const [value] = useAtom(loadableAscStoreAtom);

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
