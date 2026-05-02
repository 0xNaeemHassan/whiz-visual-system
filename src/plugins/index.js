const PLUGIN_API_VERSION = 1;

const registries = {
  layout: new Map(),
  theme: new Map(),
  exportAdapter: new Map(),
};

function freeze(value) {
  if (!value || typeof value !== 'object') return value;
  return Object.freeze({ ...value });
}

function createManifest(plugin) {
  const manifest = {
    id: plugin.id,
    name: plugin.name,
    version: plugin.version || '1.0.0',
    apiVersion: plugin.apiVersion || PLUGIN_API_VERSION,
    author: plugin.author || 'unknown',
    firstParty: Boolean(plugin.firstParty),
    capabilities: freeze(plugin.capabilities || {}),
    constraints: freeze(plugin.constraints || {}),
    hooks: freeze(plugin.hooks || {}),
    metadata: freeze(plugin.metadata || {}),
  };

  if (!manifest.id || !manifest.name) {
    throw new Error('Plugin manifest requires both id and name.');
  }

  return freeze(manifest);
}

function validateCapability(pluginType, manifest) {
  const caps = manifest.capabilities || {};
  if (!caps[pluginType]) {
    throw new Error(`Plugin "${manifest.id}" is missing capability "${pluginType}".`);
  }
  if (caps[pluginType] !== true) {
    throw new Error(`Capability "${pluginType}" on plugin "${manifest.id}" must be true.`);
  }
}

function validateConstraints(pluginType, constraints = {}) {
  if (constraints.readOnly !== undefined && typeof constraints.readOnly !== 'boolean') {
    throw new Error(`${pluginType} constraint "readOnly" must be a boolean.`);
  }
  if (constraints.maxPayloadBytes !== undefined && (!Number.isInteger(constraints.maxPayloadBytes) || constraints.maxPayloadBytes <= 0)) {
    throw new Error(`${pluginType} constraint "maxPayloadBytes" must be a positive integer.`);
  }
  if (constraints.allowedMimeTypes !== undefined && !Array.isArray(constraints.allowedMimeTypes)) {
    throw new Error(`${pluginType} constraint "allowedMimeTypes" must be an array.`);
  }
}

function runHook(hooks, key, payload) {
  const hook = hooks?.[key];
  if (typeof hook === 'function') hook(payload);
}

function register(pluginType, plugin, itemKey) {
  const manifest = createManifest(plugin);
  validateCapability(pluginType, manifest);
  validateConstraints(pluginType, manifest.constraints);

  const key = itemKey || plugin.id;
  if (!key) throw new Error(`${pluginType} registration requires an id.`);
  if (registries[pluginType].has(key)) {
    throw new Error(`${pluginType} "${key}" is already registered.`);
  }

  runHook(manifest.hooks, 'beforeRegister', { pluginType, key, manifest });
  const entry = freeze({ ...plugin, manifest });
  registries[pluginType].set(key, entry);
  runHook(manifest.hooks, 'afterRegister', { pluginType, key, manifest });
  return entry;
}

export function registerLayout(plugin) {
  return register('layout', plugin, plugin.layout?.id || plugin.id);
}

export function registerTheme(plugin) {
  return register('theme', plugin, plugin.theme?.id || plugin.id);
}

export function registerExportAdapter(plugin) {
  return register('exportAdapter', plugin, plugin.adapter?.id || plugin.id);
}

export function getRegisteredLayouts() {
  return Array.from(registries.layout.values()).map(p => p.layout);
}

export function getRegisteredThemes() {
  return Array.from(registries.theme.values()).map(p => p.theme);
}

export function getRegisteredExportAdapters() {
  return Array.from(registries.exportAdapter.values()).map(p => p.adapter);
}

export function getPluginManifests() {
  return {
    layouts: Array.from(registries.layout.values()).map(p => p.manifest),
    themes: Array.from(registries.theme.values()).map(p => p.manifest),
    exportAdapters: Array.from(registries.exportAdapter.values()).map(p => p.manifest),
  };
}

const BUILTIN_LAYOUTS = [
  ...new Set([
    'grid','bull-bear','timeline','table','editorial','network','pitch-deck','anatomy','stats','mechanism','founder','scorecard',
    'matrix','tier-list','threat-model','failure-tree','postmortem','mental-model','trust-stack','heatmap','constellation','stack',
    'subway','periodic','org-chart','trade-routes','bracket','curve','flow','thesis','three-layer','long-bet','quote','glossary','field-guide','receipt','cover-story'
  ]),
];

BUILTIN_LAYOUTS.forEach((layoutId) => {
  registerLayout({
    id: `layout.${layoutId}`,
    name: `Layout: ${layoutId}`,
    version: '1.0.0',
    firstParty: true,
    capabilities: { layout: true },
    constraints: { readOnly: true },
    hooks: {},
    layout: { id: layoutId, name: layoutId },
  });
});
