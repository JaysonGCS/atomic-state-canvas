import { atom, selector } from 'recoil';
import { neighbourSelectorFamily } from '.';
import { subDirectoryAtom } from './subDirectory';

export const someAtom = atom({
  key: '_someAtom',
  default: 'someValue'
});

export const dependentSelector = selector<string>({
  key: '_dependentSelector',
  get: ({ get }) => {
    get(someAtom);
    get(subDirectoryAtom);
    get(neighbourSelectorFamily(''));
    return '';
  },
  cachePolicy_UNSTABLE: { eviction: 'most-recent' }
});
