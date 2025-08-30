// Tab Bar Navigation Components
export { default as TabBarParent } from './TabBarParent';
export { default as TabBarDriver } from './TabBarDriver';
export { default as TabBarSelector } from './TabBarSelector';

// Navigation Types
export type { TabBarType } from './TabBarSelector';

// Navigation Config
export const TAB_BAR_CONFIG = {
  parent: {
    component: 'TabBarParent',
    color: '#01CBCA',
    backgroundColor: '#FFF9C4',
    tabs: ['home', 'contacts', 'explore', 'account']
  },
  driver: {
    component: 'TabBarDriver',
    color: '#FF9800', 
    backgroundColor: '#FFF3E0',
    tabs: ['route', 'passengers', 'status', 'profile']
  }
} as const;
