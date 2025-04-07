export const globToRegex = (pattern: string): RegExp => {
  const regex = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
  return new RegExp(`^${regex}$`);
};
