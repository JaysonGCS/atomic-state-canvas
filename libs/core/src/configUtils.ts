export const cliConfig = {
  verbose: false // Default value
};

export const setVerboseLevel = (value: boolean) => {
  cliConfig.verbose = value;
};
