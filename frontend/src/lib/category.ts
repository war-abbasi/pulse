import { Category } from '../types';

interface CategoryStyle {
  label: string;
  /** Banner and card treatment. */
  surface: string;
  /** Small pill shown on each card. */
  badge: string;
  /** Left accent bar. */
  accent: string;
  icon: string;
}

/**
 * One place defining how each category looks, so a colour is never hardcoded
 * in a component and the three categories cannot drift apart visually.
 */
export const CATEGORY_STYLES: Record<Category, CategoryStyle> = {
  [Category.INFO]: {
    label: 'Info',
    surface:
      'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-100',
    badge:
      'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
    accent: 'bg-blue-500',
    icon: 'M12 16v-4m0-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  },
  [Category.WARNING]: {
    label: 'Warning',
    surface:
      'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-100',
    badge:
      'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
    accent: 'bg-amber-500',
    icon: 'M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z',
  },
  [Category.ERROR]: {
    label: 'Error',
    surface:
      'bg-red-50 border-red-200 text-red-900 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-100',
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    accent: 'bg-red-500',
    icon: 'M12 8v5m0 3h.01M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z',
  },
};

export const CATEGORY_OPTIONS = [Category.INFO, Category.WARNING, Category.ERROR];
