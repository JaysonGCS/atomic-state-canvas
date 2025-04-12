import { selector } from 'recoil';

export const twoSelector = selector<string>({
  key: '_twoSelector',
  get: () => {
    return '';
  }
});

export const oneSelector = selector<string>({
  key: '_oneSelector',
  get: ({ get }) => {
    get(twoSelector);
    return '';
  }
});

export const bSelector = selector<string>({
  key: '_bSelector',
  get: () => {
    return '';
  }
});

export const aSelector = selector<string>({
  key: '_aSelector',
  get: ({ get }) => {
    get(bSelector);
    get(oneSelector);
    return '';
  }
});

export const nextSelector = selector<string>({
  key: '_nextSelector',
  get: ({ get }) => {
    get(aSelector);
    get(oneSelector);
    return '';
  }
});

export const entrySelector = selector<string>({
  key: '_entrySelector',
  get: ({ get }) => {
    get(nextSelector);
    return '';
  }
});
