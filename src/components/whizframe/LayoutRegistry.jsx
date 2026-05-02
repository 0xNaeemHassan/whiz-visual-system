import { coreLayouts } from './layouts/CoreLayouts';
import { extendedLayouts } from './layouts/ExtendedLayouts';

const registry = {
  ...coreLayouts,
  ...extendedLayouts,
};

export const getLayoutComponent = (layout) => registry[layout] || registry.body;

export default registry;
