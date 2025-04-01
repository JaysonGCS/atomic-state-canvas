import { atom, selector, selectorFamily } from 'recoil';
import { dependentSelector, someAtom, subDirectoryAtom } from '.';

export const neighbourSelectorFamily = selectorFamily<boolean, string>({
  key: '_neighbourSelectorFamily',
  get:
    (cusip: string) =>
    ({ get }) => {
      get(dependentSelector);
      get(subDirectoryAtom);
      return true;
    },
  cachePolicy_UNSTABLE: { eviction: 'most-recent' }
});

export const entrySelector = selector<string>({
  key: '_entrySelector',
  get: ({ get }) => {
    get(neighbourSelectorFamily(''));
    get(someAtom);
    return '';
  },
  cachePolicy_UNSTABLE: { eviction: 'most-recent' }
});
