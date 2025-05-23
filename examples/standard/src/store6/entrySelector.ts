import { selector, selectorFamily } from 'recoil';

export const threeSelectorFamily = selectorFamily<boolean, string>({
  key: '_threeSelectorFamily',
  get: () => () => {
    return true;
  }
});

export const twoSelectorFamily = selectorFamily<boolean, string>({
  key: '_twoSelectorFamily',
  get:
    () =>
    ({ get }) => {
      get(threeSelectorFamily(''));
      return true;
    }
});

export const oneSelectorFamily = selectorFamily<boolean, string>({
  key: '_oneSelectorFamily',
  get:
    () =>
    ({ get }) => {
      get(twoSelectorFamily(''));
      get(bSelectorFamily(''));
      return true;
    }
});

export const bSelectorFamily = selectorFamily<boolean, string>({
  key: '_bSelectorFamily',
  get:
    () =>
    ({ get }) => {
      get(twoSelectorFamily(''));
      return true;
    }
});

export const aSelectorFamily = selectorFamily<boolean, string>({
  key: '_aSelectorFamily',
  get:
    () =>
    ({ get }) => {
      get(bSelectorFamily(''));
      return true;
    }
});

export const entrySelector = selector<string>({
  key: '_entrySelector',
  get: ({ get }) => {
    get(oneSelectorFamily(''));
    get(aSelectorFamily(''));
    return '';
  },
  cachePolicy_UNSTABLE: { eviction: 'most-recent' }
});
