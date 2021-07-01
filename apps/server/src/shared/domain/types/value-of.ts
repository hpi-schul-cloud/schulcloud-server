/**
 * The type of the values in T (counterpart to keyof)
 */
export type ValueOf<T> = T[keyof T];
