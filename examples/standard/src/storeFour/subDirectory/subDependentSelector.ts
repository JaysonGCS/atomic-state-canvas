import { atom } from 'recoil';

export const subDirectoryAtom = atom({
  key: '_subDirectoryAtom',
  default: 'someValue',
  effects: [
    ({ setSelf }) => {
      const fun = (e) => {
        // This casting would trigger a type of acorn-walk error
        const { detail } = e as CustomEvent;
        // This satisfies would trigger a type of acorn-walk error
        const {} = e satisfies {};
        setSelf('newValue');
      };
    }
  ]
});
