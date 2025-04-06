export const cliConfig = {
  verbose: false // Default value
};

export const setVerboseLevel = (value: boolean) => {
  cliConfig.verbose = value;
};

export const globToRegex = (pattern: string): RegExp => {
  const regex = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
  return new RegExp(`^${regex}$`);
};
