export type MenuEntry = { icon: string; label: string; route: string; role?: string };

// Menu of the administration, by subject
export const MENU: { label: string; items: MenuEntry[] }[] = [
  {
    label: 'menu.steering',
    items: [{ icon: 'chart-line', label: 'menu.dashboard', route: '/admin' }],
  },
  {
    label: 'menu.observations',
    items: [
      { icon: 'clipboard-notes', label: 'menu.sessions', route: '/admin/sessions' },
      { icon: 'users-alt', label: 'menu.learning-circles', route: '/admin/learning-circles' },
      { icon: 'download-alt', label: 'menu.exports', route: '/admin/exports' },
    ],
  },
  {
    label: 'menu.people',
    items: [
      { icon: 'user-circle', label: 'menu.observers', route: '/admin/coaches' },
      { icon: 'graduation-cap', label: 'menu.teachers', route: '/admin/teachers' },
      { icon: 'university', label: 'menu.schools', route: '/admin/schools' },
    ],
  },
  {
    label: 'menu.reference',
    items: [
      { icon: 'document-layout-right', label: 'menu.grid', route: '/admin/grid' },
      { icon: 'file-check', label: 'menu.checklist', route: '/admin/checklist' },
      { icon: 'sliders-v', label: 'menu.pdp-rules', route: '/admin/pdp-rules' },
    ],
  },
  {
    label: 'menu.administration',
    items: [
      { icon: 'setting', label: 'menu.settings', route: '/admin/settings' },
      { icon: 'sync', label: 'menu.syncs', route: '/admin/syncs', role: 'admin' },
    ],
  },
];
