import { AliasReplacerArguments } from 'tsc-alias';

export default function exampleReplacer({ orig, file, config }: AliasReplacerArguments): string {
  if (file.startsWith(config.outPath) && orig === 'require("@atomic-state-canvas/core")') {
    // FIXME: Replace with the path derived from the config dynamically
    return 'require("../../../libs/core/src/index")';
  }
  return orig;
}
