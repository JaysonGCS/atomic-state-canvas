import { selector, selectorFamily } from 'recoil';

export const neighbourSelectorFamily = selectorFamily<boolean, string>({
  key: 'neighbourSelectorFamily',
  get:
    (cusip: string) =>
    ({ get }) => {
      get(neighbourSelectorFamily(''));
      return true;
    },
  cachePolicy_UNSTABLE: { eviction: 'most-recent' }
});

export const entrySelector = selector<string>({
  key: 'entrySelector',
  get: ({ get }) => {
    get(neighbourSelectorFamily(''));
    return '';
  },
  cachePolicy_UNSTABLE: { eviction: 'most-recent' }
});
