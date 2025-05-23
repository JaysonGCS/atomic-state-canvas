import { atom, selector } from 'recoil';
import { subDirectoryAtom } from './subDirectory/subDependentSelector';

export const someAtom = atom({
  key: '_someAtom',
  default: 'someValue'
});

export const dependentSelector = selector<string>({
  key: '_dependentSelector',
  get: ({ get }) => {
    get(someAtom);
    get(subDirectoryAtom);
    return '';
  },
  cachePolicy_UNSTABLE: { eviction: 'most-recent' }
});
