import { TLayoutType } from './graphLayout';
import { TCanvasDirection } from './types';

export const globToRegex = (pattern: string): RegExp => {
  const regex = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
  return new RegExp(`^${regex}$`);
};

const SUPPORTED_DIRECTION: TCanvasDirection[] = ['TB', 'LR'];
const SUPPORTED_LAYOUT: TLayoutType[] = ['SIMPLE_TOPOLOGY', 'FORCE_DIRECTED'];

export const isSupportedLayout = (layout: string): layout is TLayoutType => {
  return SUPPORTED_LAYOUT.includes(layout as TLayoutType);
};

export const isSupportedDirection = (direction: string): direction is TCanvasDirection => {
  return SUPPORTED_DIRECTION.includes(direction as TCanvasDirection);
};
