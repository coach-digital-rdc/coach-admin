export const MenuItems = [
  {
    icon: 'chart-line',
    label: 'dashboard',
    route: `/admin/`,
  },
  {
    label: 'questionnaire',
    subItems: [
      {
        icon: 'document-layout-right',
        label: 'teaching-practices',
        route: `/admin/teaching-practices`,
      },
      {
        icon: 'clipboard-notes',
        label: 'coaching-sessions',
        route: `/admin/coaching-sessions`,
      },
    ],
  },
  {
    label: 'data',
    subItems: [
      {
        icon: 'university',
        label: 'schools',
        route: `/admin/schools`,
      },
      {
        icon: 'user',
        label: 'coaches',
        route: `/admin/coaches`,
      },
      {
        icon: 'calender',
        label: 'coaches-over-time',
        route: `/admin/coach-over-time`,
      },
      {
        icon: 'folder',
        label: 'session-data',
        route: `/admin/session-data`,
      },
      {
        icon: 'sync',
        label: 'syncs',
        role: 'admin',
        route: `/admin/syncs`,
      },
    ],
  },
];
