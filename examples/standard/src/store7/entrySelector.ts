import { selector, selectorFamily } from 'recoil';

export const threeSelectorFamily = selectorFamily<boolean, string>({
  key: '_threeSelectorFamily',
  get:
    (cusip: string) =>
    ({ get }) => {
      return true;
    }
});

export const twoSelectorFamily = selectorFamily<boolean, string>({
  key: '_twoSelectorFamily',
  get:
    (cusip: string) =>
    ({ get }) => {
      get(bSelectorFamily(''));
      return true;
    }
});

export const oneSelectorFamily = selectorFamily<boolean, string>({
  key: '_oneSelectorFamily',
  get:
    (cusip: string) =>
    ({ get }) => {
      get(threeSelectorFamily(''));
      get(twoSelectorFamily(''));
      get(aSelectorFamily(''));
      return true;
    }
});

export const bSelectorFamily = selectorFamily<boolean, string>({
  key: '_bSelectorFamily',
  get:
    (cusip: string) =>
    ({ get }) => {
      get(aSelectorFamily(''));
      return true;
    }
});

export const aSelectorFamily = selectorFamily<boolean, string>({
  key: '_aSelectorFamily',
  get:
    (cusip: string) =>
    ({ get }) => {
      get(bSelectorFamily(''));
      return true;
    }
});

export const entrySelector = selector<string>({
  key: '_entrySelector',
  get: ({ get }) => {
    get(oneSelectorFamily(''));
    return '';
  },
  cachePolicy_UNSTABLE: { eviction: 'most-recent' }
});
