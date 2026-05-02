const ROUTE_SCHEMA = {
  dashboard: '/dashboard',
  library: '/library',
  editor: '/editor',
  themes: '/themes',
  typography: '/typography',
  planner: '/planner',
  docs: '/docs',
};

const ROUTE_BY_PATH = Object.fromEntries(
  Object.entries(ROUTE_SCHEMA).map(([route, path]) => [path, route])
);

const DEFAULT_ROUTE = 'dashboard';

function parseHashLocation(hash) {
  if (!hash || hash === '#') {
    return { route: DEFAULT_ROUTE, query: new URLSearchParams() };
  }

  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const [pathPart, queryPart = ''] = raw.split('?');

  const normalizedPath = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
  const route = ROUTE_BY_PATH[normalizedPath] || DEFAULT_ROUTE;

  return { route, query: new URLSearchParams(queryPart) };
}

function buildHash(route, query = {}) {
  const basePath = ROUTE_SCHEMA[route] || ROUTE_SCHEMA[DEFAULT_ROUTE];
  const params = new URLSearchParams(query);
  const suffix = params.toString();

  return `#${basePath}${suffix ? `?${suffix}` : ''}`;
}

function readRouteFromWindow() {
  return parseHashLocation(window.location.hash);
}

function pushRoute(route, query = {}, state = {}) {
  const nextHash = buildHash(route, query);
  window.history.pushState({ route, ...state }, '', nextHash);
}

function replaceRoute(route, query = {}, state = {}) {
  const nextHash = buildHash(route, query);
  window.history.replaceState({ route, ...state }, '', nextHash);
}

export {
  DEFAULT_ROUTE,
  ROUTE_SCHEMA,
  parseHashLocation,
  readRouteFromWindow,
  buildHash,
  pushRoute,
  replaceRoute,
};
