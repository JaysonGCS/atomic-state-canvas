import path from 'path';

export const getExtension = (filename: string): string => {
  const ext = path.extname(filename).split('.');
  return ext[ext.length - 1];
};
