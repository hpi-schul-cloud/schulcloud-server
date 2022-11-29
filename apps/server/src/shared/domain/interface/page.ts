export class Page<T> {
	data: T[];

	total: number;

	constructor(data: T[], total: number) {
		this.data = data;
		this.total = total;
	}
}
