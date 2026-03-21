import type { CategoryAccessor, NumericAccessor } from '../types';

export function getNumericValue<T>(datum: T, accessor: NumericAccessor<T>, index: number): number {
  const value = typeof accessor === 'function' ? accessor(datum, index) : Number(datum[accessor]);
  return Number.isFinite(value) ? value : 0;
}

export function getCategoryValue<T>(datum: T, accessor: CategoryAccessor<T>, index: number): string {
  const value = typeof accessor === 'function' ? accessor(datum, index) : String(datum[accessor]);
  return value ?? '';
}
