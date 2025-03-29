import { useRecoilValue } from 'recoil';
import { cusipToSecuritySelectorFamily } from '../recoil/store';

interface OwnProps {
  cusip: string;
}
export const WatchItem = (props: OwnProps) => {
  const { cusip } = props;
  const security = useRecoilValue(cusipToSecuritySelectorFamily(cusip));

  return (
    <div style={{ border: '1px solid black', padding: '5px' }}>
      <div>
        Security: {security.security} (${security.cusip})
      </div>
      <div>Price: {security.price}</div>
      <div>Market Cap: {security.marketCap}</div>
    </div>
  );
};
