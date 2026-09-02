import { describe, expect, it } from 'vitest';
import { CATEGORY_OPTIONS, CATEGORY_STYLES, categoryStyle } from './category';
import { Category } from '../types';

describe('categoryStyle', () => {
  it.each(CATEGORY_OPTIONS)('returns the matching style for %s', (category) => {
    expect(categoryStyle(category)).toBe(CATEGORY_STYLES[category]);
  });

  it('falls back rather than returning undefined for an unknown category', () => {
    // F4: indexing the map directly meant a legacy or hand-edited row with an
    // unrecognised category crashed the whole page on render.
    const style = categoryStyle('LEGACY' as Category);
    expect(style).toBeDefined();
    expect(style.label).toBeTruthy();
    expect(style.accent).toBeTruthy();
  });
});

describe('CATEGORY_STYLES', () => {
  it('covers every category the app can receive', () => {
    expect(Object.keys(CATEGORY_STYLES).sort()).toEqual(['ERROR', 'INFO', 'WARNING']);
  });

  it('colour-codes each severity as the specification requires', () => {
    // ERROR red, WARNING yellow/orange, INFO blue.
    expect(CATEGORY_STYLES[Category.ERROR].accent).toContain('red');
    expect(CATEGORY_STYLES[Category.WARNING].accent).toContain('amber');
    expect(CATEGORY_STYLES[Category.INFO].accent).toContain('blue');
  });
});
