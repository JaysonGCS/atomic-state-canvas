export const logMsg = (message: string, isVerbose: boolean = false) => {
  // eslint-disable-next-line no-console
  console.log(`[${isVerbose ? 'VERBOSE' : 'INFO'}] ${message}`);
};
