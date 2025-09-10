import { entrySelector, fourSelector, threeSelector } from './entrySelector';

export const metadataSelector = {
  title: 'Group/Title 1',
  entry: entrySelector,
  plugin: 'recoil'
};

export const metadataSelector2 = {
  title: 'Group/Title 2',
  entry: fourSelector,
  plugin: 'recoil'
};

export const metadataSelector3 = {
  title: 'Group/Title 3',
  entry: threeSelector,
  plugin: 'recoil'
};
