"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchItem = void 0;
const recoil_1 = require("recoil");
const store_1 = require("../recoil/store");
const WatchItem = (props) => {
    const { cusip } = props;
    const security = (0, recoil_1.useRecoilValue)((0, store_1.cusipToSecuritySelectorFamily)(cusip));
    return (<div style={{ border: '1px solid black', padding: '5px' }}>
      <div>
        Security: {security.security} (${security.cusip})
      </div>
      <div>Price: {security.price}</div>
      <div>Market Cap: {security.marketCap}</div>
    </div>);
};
exports.WatchItem = WatchItem;
//# sourceMappingURL=WatchItem.js.map