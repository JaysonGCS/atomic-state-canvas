import { selector, selectorFamily } from 'recoil';
import { dependentSelector, someAtom } from '..';
import { subDirectoryAtom } from '.';

export const neighbourSelectorFamily = selectorFamily<boolean, string>({
  key: '_neighbourSelectorFamily',
  get:
    (cusip: string) =>
    ({ get }) => {
      get(subDirectoryAtom);
      get(dependentSelector);
      return true;
    },
  cachePolicy_UNSTABLE: { eviction: 'most-recent' }
});

export const entrySelector = selector<string>({
  key: '_entrySelector',
  get: ({ get }) => {
    get(someAtom);
    get(someAtom);
    get(neighbourSelectorFamily(''));
    get(neighbourSelectorFamily(''));
    return '';
  },
  cachePolicy_UNSTABLE: { eviction: 'most-recent' }
});
