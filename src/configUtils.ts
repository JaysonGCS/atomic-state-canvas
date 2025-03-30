export const config = {
  verbose: false // Default value
};

export const setVerboseLevel = (value: boolean) => {
  config.verbose = value;
};
