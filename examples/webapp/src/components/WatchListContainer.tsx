import { Suspense } from 'react';
import { WatchItem } from './WatchItem';

const mockCusipWatchList = ['SPCX', 'NZAC', 'YOTAU', 'IMXI'];

export const WatchListContainer = () => {
  return (
    <div>
      <h2>Watch List</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {mockCusipWatchList.map((cusip) => {
          return (
            <Suspense
              key={cusip}
              fallback={
                <div style={{ height: '74px', border: '1px solid black', padding: '5px' }}>
                  Loading {cusip}
                </div>
              }>
              <WatchItem cusip={cusip} />
            </Suspense>
          );
        })}
      </div>
    </div>
  );
};
