import { selector, selectorFamily } from 'recoil';

export const neighbourSelectorFamily = selectorFamily<boolean, string>({
  key: '_neighbourSelectorFamily',
  get:
    (cusip: string) =>
    ({ get }) => {
      get(neighbourSelectorFamily(''));
      return true;
    },
  cachePolicy_UNSTABLE: { eviction: 'most-recent' }
});

export const entrySelector = selector<string>({
  key: '_entrySelector',
  get: ({ get }) => {
    get(neighbourSelectorFamily(''));
    return '';
  },
  cachePolicy_UNSTABLE: { eviction: 'most-recent' }
});
