"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchListContainer = void 0;
const react_1 = require("react");
const WatchItem_1 = require("./WatchItem");
const mockCusipWatchList = ['SPCX', 'NZAC', 'YOTAU', 'IMXI'];
const WatchListContainer = () => {
    return (<div>
      <h2>Watch List</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {mockCusipWatchList.map((cusip) => {
            return (<react_1.Suspense key={cusip} fallback={<div style={{ height: '74px', border: '1px solid black', padding: '5px' }}>
                  Loading {cusip}
                </div>}>
              <WatchItem_1.WatchItem cusip={cusip}/>
            </react_1.Suspense>);
        })}
      </div>
    </div>);
};
exports.WatchListContainer = WatchListContainer;
//# sourceMappingURL=WatchListContainer.js.map