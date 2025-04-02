import { atom } from 'recoil';

export * from './subDependentSelector';

export const livingInIndexAtom = atom({
  key: '_livingInIndexAtom',
  default: ''
});
