"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const recoil_1 = require("recoil");
require("./App.css");
const FaangSecurityContainer_1 = require("./components/FaangSecurityContainer");
const WatchListContainer_1 = require("./components/WatchListContainer");
const store_1 = require("./recoil/store");
function App() {
    const [enableMicroBatcher, setEnableMicroBatcher] = (0, recoil_1.useRecoilState)(store_1.enableMicroBatcherAtom);
    const setLogs = (0, recoil_1.useSetRecoilState)(store_1.logsAtom);
    const logs = (0, recoil_1.useRecoilValue)(store_1.logsAtom);
    const onChange = (0, react_1.useCallback)(() => {
        setEnableMicroBatcher((prev) => !prev);
        setLogs((prev) => [
            ...prev,
            '------------------------------',
            `Micro Batcher is ${!enableMicroBatcher ? 'enabled' : 'disabled'}`
        ]);
    }, [enableMicroBatcher, setEnableMicroBatcher, setLogs]);
    return (<>
      <h1>Micro Batcher + React & Recoil Example</h1>
      <div className="container">
        <div className="card">
          <h2>Settings</h2>
          <div>
            <textarea style={{ width: '100%', height: '150px', resize: 'none' }} disabled value={logs.join('\n')}/>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label>Toggle Micro Batcher</label>
            <label className="switch">
              <input type="checkbox" onChange={onChange} checked={enableMicroBatcher}/>
              <span className="slider round"></span>
            </label>
          </div>
        </div>
        <div className="card">
          <h2>FAANG Stocks</h2>
          <react_1.Suspense fallback={<div>Loading...</div>}>
            <FaangSecurityContainer_1.FaangSecurityContainer />
          </react_1.Suspense>
        </div>
        <div className="card">
          <WatchListContainer_1.WatchListContainer />
        </div>
      </div>
    </>);
}
exports.default = App;
//# sourceMappingURL=App.js.map