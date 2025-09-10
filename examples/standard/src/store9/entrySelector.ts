import { atom, selector } from 'recoil';

export const rootSelector = selector<string>({
  key: '_rootSelector',
  get: () => {
    return '';
  }
});

export const defaultDependentSelector = selector<string>({
  key: 'defaultDependentSelector',
  get: ({ get }) => {
    get(rootSelector);
    return '';
  }
});

export const defaultAtom = atom<string>({
  key: 'defaultAtom',
  // This tests the default value dependency tracking
  default: defaultDependentSelector
});

export const sideSelector = selector<string>({
  key: '_sideSelector',
  get: ({ get }) => {
    get(defaultAtom);
    return '';
  }
});

export const fourSelector = selector<string>({
  key: '_fourSelector',
  get: ({ get }) => {
    get(rootSelector);
    return '';
  }
});

export const threeSelector = selector<string>({
  key: '_threeSelector',
  get: ({ get }) => {
    // This sequence could cause infinite loop
    get(sideSelector);
    get(fourSelector);
    return '';
  }
});

export const twoSelector = selector<string>({
  key: '_twoSelector',
  get: ({ get }) => {
    get(threeSelector);
    return '';
  }
});

export const oneSelector = selector<string>({
  key: '_oneSelector',
  get: ({ get }) => {
    get(aSelector);
    get(twoSelector);
    return '';
  }
});

export const aSelector = selector<string>({
  key: '_aSelector',
  get: ({ get }) => {
    get(oneSelector);
    return '';
  }
});

export const entrySelector = selector<string>({
  key: '_entrySelector',
  get: ({ get }) => {
    get(oneSelector);
    get(aSelector);
    return '';
  }
});
