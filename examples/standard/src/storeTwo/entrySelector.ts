import { atom, selector, selectorFamily } from 'recoil';
import { dependentSelector, someAtom } from './dependentRecoilSelector';
import { subDirectoryAtom } from './subDirectory/subDependentSelector';

export const neighbourSelectorFamily = selectorFamily<boolean, string>({
  key: 'neighbourSelectorFamily',
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
  key: 'entrySelector',
  get: ({ get }) => {
    get(neighbourSelectorFamily(''));
    get(someAtom);
    return '';
  },
  cachePolicy_UNSTABLE: { eviction: 'most-recent' }
});
