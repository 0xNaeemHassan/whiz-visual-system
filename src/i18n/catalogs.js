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
    library: {
      empty: {
        failedTitle: 'Failed to load frames',
        filteredTitle: 'No frames match current filters',
        noDataTitle: 'No frame data yet',
        failedBody: 'The library dataset is unavailable right now.',
        filteredBody: 'Try broadening your search or clearing one or more filters.',
        noDataBody: 'Add templates to get started with a frame scaffold.',
        clearFilters: 'Clear filters',
        listWorkflow: 'Paste table in list workflow',
        scaffold: 'Generate scaffold',
        filtersTip: 'Tip: keyboard users can Tab to filter chips and press Enter/Space to quickly adjust scope.',
      }
    },
    planner: {
      empty: {
        noDataTitle: 'No issues scheduled yet',
        noDataBody: 'Create your first issue to start the content plan.',
        noDataAction: 'Next step: Click “New Issue” and assign a frame + date.',
        filteredTitle: 'No results for current filters',
        filteredBody: 'No issues match the active status/search filters.',
        filteredAction: 'Next step: Clear search or reset status to “All Statuses”.',
      }
    },
    frames: {
      empty: {
        noDataTitle: 'No {region} data yet',
        filteredTitle: 'No {region} results after filter',
        noDataAction: 'Next step: {action}',
      }
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
    library: {
      empty: {
        failedTitle: 'No se pudieron cargar los marcos',
        filteredTitle: 'Ningún marco coincide con los filtros actuales',
        noDataTitle: 'Aún no hay datos de marcos',
        failedBody: 'El conjunto de datos de la biblioteca no está disponible ahora mismo.',
        filteredBody: 'Amplía la búsqueda o limpia uno o más filtros.',
        noDataBody: 'Agrega plantillas para comenzar con un marco base.',
        clearFilters: 'Limpiar filtros',
        listWorkflow: 'Pegar tabla en flujo de lista',
        scaffold: 'Generar estructura',
        filtersTip: 'Consejo: usa Tab para navegar filtros y Enter/Espacio para ajustar el alcance.',
      }
    },
    planner: {
      empty: {
        noDataTitle: 'Aún no hay issues programados',
        noDataBody: 'Crea tu primer issue para iniciar el plan de contenido.',
        noDataAction: 'Siguiente paso: haz clic en «New Issue» y asigna marco + fecha.',
        filteredTitle: 'Sin resultados para los filtros actuales',
        filteredBody: 'Ningún issue coincide con los filtros activos de estado/búsqueda.',
        filteredAction: 'Siguiente paso: limpia la búsqueda o restablece el estado a «All Statuses».',
      }
    },
    frames: {
      empty: {
        noDataTitle: 'Aún no hay datos de {region}',
        filteredTitle: 'Sin resultados de {region} tras filtrar',
        noDataAction: 'Siguiente paso: {action}',
      }
    },

  },
});
