import { useEffect } from 'react';
import NxWelcome from './nx-welcome';

export function App() {
  useEffect(() => {
    fetch('/.atomic-state-canvas').then(async (res) => {
      const previews = await res.json();
      console.log({ previews });
    });
  }, []);

  return (
    <div>
      <NxWelcome title="asc-viewer" />
    </div>
  );
}

export default App;
