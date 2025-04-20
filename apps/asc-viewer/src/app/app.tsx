import { useEffect } from 'react';
import NxWelcome from './nx-welcome';
import { ascHierarchyAtom } from '../stores/ascStore/ascStore';
import { useAtomValue } from 'jotai';
import { loadable } from 'jotai/utils';
import { THierarchyItem } from '../stores/ascStore/types';

const loadableAscHierarchyAtom = loadable<Promise<THierarchyItem>>(ascHierarchyAtom);

export function App() {
  const value = useAtomValue(loadableAscHierarchyAtom);

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
