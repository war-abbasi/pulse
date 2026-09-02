/**
 * String-valued rather than numeric. A bare `enum { INFO, WARNING, ERROR }`
 * compiles to 0/1/2, which serialises to meaningless numbers in JSON and in
 * the database — and was the cause of a real bug in the original app, where
 * `category.toString() === 'INFO'` was never true.
 */
export enum Category {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}
