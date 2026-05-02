import { coreLayouts } from './layouts/coreLayouts';
import { extendedLayouts } from './layouts/extendedLayouts';

const registry = {
  ...coreLayouts,
  ...extendedLayouts,
};

export const getLayoutComponent = (layout) => registry[layout] || registry.body;

export default registry;
