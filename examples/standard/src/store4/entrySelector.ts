import { selector, selectorFamily } from 'recoil';
import { dependentSelector, someAtom } from '.';
import { livingInIndexAtom, subDirectoryAtom } from './subDirectory';
// @ts-expect-error -- simulate alias import
import { aliasAtom } from '@test/alias';

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
    get(livingInIndexAtom);
    get(aliasAtom);
    return '';
  },
  cachePolicy_UNSTABLE: { eviction: 'most-recent' }
});
