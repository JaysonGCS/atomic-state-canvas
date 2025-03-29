import { useRecoilValue, waitForAll } from 'recoil';
import { cusipToSecuritySelectorFamily } from '../recoil/store';

export const FaangSecurityContainer = () => {
  const faangSecurities = useRecoilValue(
    waitForAll([
      cusipToSecuritySelectorFamily('AAPL'),
      cusipToSecuritySelectorFamily('GOOGL'),
      cusipToSecuritySelectorFamily('AMZN'),
      cusipToSecuritySelectorFamily('NFLX'),
      cusipToSecuritySelectorFamily('FB')
    ])
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      {faangSecurities.map((sec) => {
        return (
          <div key={sec.cusip} style={{ border: '1px solid black', padding: '5px' }}>
            <div>
              Security: {sec.security} (${sec.cusip})
            </div>
            <div>Price: {sec.price}</div>
            <div>Market Cap: {sec.marketCap}</div>
          </div>
        );
      })}
    </div>
  );
};
