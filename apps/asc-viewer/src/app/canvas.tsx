import { useAtomValue } from 'jotai';
import { currentAscMetadataAtom } from '../stores/ascStore/ascStore';

export const Canvas = () => {
  const ascMetadata = useAtomValue(currentAscMetadataAtom);

  return <div>{JSON.stringify(ascMetadata)}</div>;
};
