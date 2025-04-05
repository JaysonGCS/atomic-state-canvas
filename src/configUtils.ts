export const config = {
  verbose: false // Default value
};

export const setVerboseLevel = (value: boolean) => {
  config.verbose = value;
};

export const globToRegex = (pattern: string): RegExp => {
  const regex = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
  return new RegExp(`^${regex}$`);
};
