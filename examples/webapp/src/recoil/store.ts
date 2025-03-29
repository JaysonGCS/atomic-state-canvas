import { atom, selectorFamily } from 'recoil';
import { decoratedFetchSingleSecurity, fetchSingleSecurity, Security } from '../apiClient';
import { LOG_EVENT } from '../constant';

export const enableMicroBatcherAtom = atom<boolean>({
  key: 'enableMicroBatcherAtom',
  default: false
});

const testSelectorFamily = selectorFamily<boolean, string>({
  key: 'enableMicroBatcherAtom',
  get:
    (cusip: string) =>
    ({ get }) => {
      const enableMicroBatcher = get(enableMicroBatcherAtom);
      if (enableMicroBatcher) {
        get(testSelectorFamily(cusip));
        return decoratedFetchSingleSecurity(cusip);
      }
      return fetchSingleSecurity(cusip);
    },
  cachePolicy_UNSTABLE: { eviction: 'most-recent' }
});

export const cusipToSecuritySelectorFamily = selectorFamily<Security, string>({
  key: 'cusipToSecuritySelectorFamily',
  get:
    (cusip: string) =>
    ({ get }) => {
      const enableMicroBatcher = get(enableMicroBatcherAtom);
      if (enableMicroBatcher) {
        get(testSelectorFamily(cusip));
        return decoratedFetchSingleSecurity(cusip);
      }
      return fetchSingleSecurity(cusip);
    },
  cachePolicy_UNSTABLE: { eviction: 'most-recent' }
});

export const logsAtom = atom<string[]>({
  key: 'logs',
  default: [],
  effects: [
    ({ setSelf, node, getPromise }) => {
      const logListener = async (e: Event) => {
        const { detail } = e as CustomEvent<{ log: string }>;
        const { log } = detail;
        const existing = await getPromise(node);
        setSelf([...existing, log]);
      };
      document.addEventListener(LOG_EVENT, logListener);
      return () => {
        document.removeEventListener(LOG_EVENT, logListener);
      };
    }
  ]
});
