import { Suspense, useCallback } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import './App.css';
import { FaangSecurityContainer } from './components/FaangSecurityContainer';
import { WatchListContainer } from './components/WatchListContainer';
import { enableMicroBatcherAtom, logsAtom } from './recoil/store';

function App() {
  const [enableMicroBatcher, setEnableMicroBatcher] = useRecoilState(enableMicroBatcherAtom);
  const setLogs = useSetRecoilState(logsAtom);
  const logs = useRecoilValue(logsAtom);

  const onChange = useCallback(() => {
    setEnableMicroBatcher((prev) => !prev);
    setLogs((prev) => [
      ...prev,
      '------------------------------',
      `Micro Batcher is ${!enableMicroBatcher ? 'enabled' : 'disabled'}`
    ]);
  }, [enableMicroBatcher, setEnableMicroBatcher, setLogs]);

  return (
    <>
      <h1>Micro Batcher + React & Recoil Example</h1>
      <div className="container">
        <div className="card">
          <h2>Settings</h2>
          <div>
            <textarea
              style={{ width: '100%', height: '150px', resize: 'none' }}
              disabled
              value={logs.join('\n')}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label>Toggle Micro Batcher</label>
            <label className="switch">
              <input type="checkbox" onChange={onChange} checked={enableMicroBatcher} />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
        <div className="card">
          <h2>FAANG Stocks</h2>
          <Suspense fallback={<div>Loading...</div>}>
            <FaangSecurityContainer />
          </Suspense>
        </div>
        <div className="card">
          <WatchListContainer />
        </div>
      </div>
    </>
  );
}

export default App;
