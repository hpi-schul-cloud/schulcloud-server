import { ApiProperty } from '@nestjs/swagger';

export class PaginationResponse<T> {
	constructor(data: T, total: number, limit?: number, skip?: number) {
		this.data = data;
		this.total = total;
		this.limit = limit;
		this.skip = skip;
	}

	@ApiProperty()
	data: T;

	@ApiProperty()
	total: number;

	@ApiProperty()
	limit: number;

	@ApiProperty()
	skip: number;
}
