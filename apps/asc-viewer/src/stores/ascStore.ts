import { atom } from 'jotai/vanilla';

export const ascStoreAsyncAtom = atom(async () => {
  const res = await fetch(`/.atomic-state-canvas`);
  return res.json();
});
