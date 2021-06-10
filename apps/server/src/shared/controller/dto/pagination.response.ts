import { Expose } from 'class-transformer';

export class PaginationResponse<T> {
	constructor(data: T, total: number, skip?: number, limit?: number) {
		this.data = data;
		this.total = total;
		this.skip = skip;
		this.limit = limit;
	}

	@Expose()
	data: T;

	@Expose()
	total: number;

	@Expose()
	skip?: number;

	@Expose()
	limit?: number;
}
