import { MicroBatcher } from 'micro-batcher';
import { LOG_EVENT } from './constant';

export const fetchSingleSecurity = async (cusip: string): Promise<Security> => {
  return new Promise((resolve) => {
    setTimeout(
      () => {
        resolve(mockCusipToSecurityDataRecord[cusip]);
        console.log(`Fetched ${cusip}`);
        document.dispatchEvent(
          new CustomEvent<{ log: string }>(LOG_EVENT, {
            detail: { log: `Fetched ${cusip}` }
          })
        );
      },
      randomIntFromInterval(1000, 3000)
    );
  });
};

const batchFetchSecurities = async (cusips: string[]): Promise<Security[]> => {
  return new Promise((resolve) => {
    setTimeout(
      () => {
        resolve(
          cusips.map((cusip) => {
            return mockCusipToSecurityDataRecord[cusip];
          })
        );
        console.log(`[Batch] Fetched ${cusips}`);
        document.dispatchEvent(
          new CustomEvent<{ log: string }>(LOG_EVENT, {
            detail: { log: `[Batch] Fetched ${cusips}` }
          })
        );
      },
      randomIntFromInterval(1000, 3000)
    );
  });
};

export const decoratedFetchSingleSecurity = MicroBatcher(fetchSingleSecurity)
  .batchResolver(batchFetchSecurities, {
    payloadWindowSizeLimit: 4,
    batchingIntervalInMs: 50
  })
  .build();

function randomIntFromInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export type Security = {
  cusip: string;
  security: string;
  price: number;
  marketCap: number;
};

const mockCusipToSecurityDataRecord: Record<string, Security> = {
  AAPL: {
    cusip: 'AAPL',
    security: 'Apple Inc',
    price: 145.83,
    marketCap: 2410000000000
  },
  GOOGL: {
    cusip: 'GOOGL',
    security: 'Alphabet Inc',
    price: 2735.93,
    marketCap: 1840000000000
  },
  AMZN: {
    cusip: 'AMZN',
    security: 'Amazon.com Inc',
    price: 3379.09,
    marketCap: 1700000000000
  },
  NFLX: {
    cusip: 'NFLX',
    security: 'Netflix Inc',
    price: 513.97,
    marketCap: 227000000000
  },
  FB: {
    cusip: 'FB',
    security: 'Meta Platforms Inc',
    price: 336.61,
    marketCap: 950000000000
  },
  SPCX: {
    cusip: 'SPCX',
    security: 'Space Exploration Technologies Corp',
    price: 20.0,
    marketCap: 100000000000
  },
  NZAC: {
    cusip: 'NZAC',
    security: 'New Zealand Acquisition Corp',
    price: 10.0,
    marketCap: 50000000000
  },
  YOTAU: {
    cusip: 'YOTAU',
    security: 'YOTA Corp',
    price: 15.0,
    marketCap: 75000000000
  },
  IMXI: {
    cusip: 'IMXI',
    security: 'IMX Inc',
    price: 25.0,
    marketCap: 125000000000
  }
};
