/**
 * Counted numbers inform about total counts beside the amount of items in T.
 */
export type Counted<T> = [T, number];

/**
 * Counted numbers inform about total counts beside the amount of items in T.
 */
// TODO: Test
export class Page<T> {
	data: T[];

	total: number;

	constructor(data: T[], total: number) {
		this.data = data;
		this.total = total;
	}

	removeElement(index: number) {
		this.data.splice(index, 1);
		this.total -= 1;
	}
}
