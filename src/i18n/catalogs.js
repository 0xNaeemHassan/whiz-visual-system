export const DEFAULT_LOCALE = 'en-US';

export const LOCALE_METADATA = Object.freeze({
  'en-US': { code: 'en-US', label: 'English (US)', nativeLabel: 'English (US)' },
  'es-ES': { code: 'es-ES', label: 'Spanish (Spain)', nativeLabel: 'Español (España)' },
});

export const MESSAGE_CATALOGS = Object.freeze({
  'en-US': {
    app: {
      pages: { dashboard: 'Dashboard', library: 'Frame Library', editor: 'Frame Editor', themes: 'Color Themes', typography: 'Typography', planner: 'Content Planner', docs: 'Documentation' },
      bottomNav: { dashboard: 'Home', library: 'Library', editor: 'Create', planner: 'Plan', themes: 'Themes' },
      skipToContent: 'Skip to content',
      mobileNavAria: 'Mobile navigation',
      goToPage: 'Go to {label}',
      createFrame: 'Create New Frame',
    },
    errors: {
      pageCrashTitle: 'Something went wrong in {page}',
      unexpected: 'An unexpected error occurred.',
      tryAgain: 'Try Again',
      storageRecovery: 'Recovered from invalid {key} storage data. Defaults restored for safety.',
    },
  },
  'es-ES': {
    app: {
      pages: { dashboard: 'Panel', library: 'Biblioteca', editor: 'Editor', themes: 'Temas', typography: 'Tipografía', planner: 'Planificador', docs: 'Documentación' },
      bottomNav: { dashboard: 'Inicio', library: 'Biblioteca', editor: 'Crear', planner: 'Plan', themes: 'Temas' },
      skipToContent: 'Saltar al contenido',
      mobileNavAria: 'Navegación móvil',
      goToPage: 'Ir a {label}',
      createFrame: 'Crear nuevo marco',
    },
    errors: {
      pageCrashTitle: 'Algo salió mal en {page}',
      unexpected: 'Se produjo un error inesperado.',
      tryAgain: 'Reintentar',
      storageRecovery: 'Se recuperaron datos inválidos de almacenamiento para {key}. Se restauraron los valores predeterminados.',
    },
  },
});
