"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FaangSecurityContainer = void 0;
const recoil_1 = require("recoil");
const store_1 = require("../recoil/store");
const FaangSecurityContainer = () => {
    const faangSecurities = (0, recoil_1.useRecoilValue)((0, recoil_1.waitForAll)([
        (0, store_1.cusipToSecuritySelectorFamily)('AAPL'),
        (0, store_1.cusipToSecuritySelectorFamily)('GOOGL'),
        (0, store_1.cusipToSecuritySelectorFamily)('AMZN'),
        (0, store_1.cusipToSecuritySelectorFamily)('NFLX'),
        (0, store_1.cusipToSecuritySelectorFamily)('FB')
    ]));
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      {faangSecurities.map((sec) => {
            return (<div key={sec.cusip} style={{ border: '1px solid black', padding: '5px' }}>
            <div>
              Security: {sec.security} (${sec.cusip})
            </div>
            <div>Price: {sec.price}</div>
            <div>Market Cap: {sec.marketCap}</div>
          </div>);
        })}
    </div>);
};
exports.FaangSecurityContainer = FaangSecurityContainer;
//# sourceMappingURL=FaangSecurityContainer.js.map