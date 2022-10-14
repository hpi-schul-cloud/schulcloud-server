/**
 * Counted numbers inform about total counts beside the amount of items in T.
 */
export type Counted<T> = [T, number];

/**
 * Counted numbers inform about total counts beside the amount of items in T.
 */
export type Page<T> = {
	data: T[];
	total: number;
};
