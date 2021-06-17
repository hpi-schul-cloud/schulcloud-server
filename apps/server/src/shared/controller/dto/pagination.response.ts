import { ApiProperty } from '@nestjs/swagger';

export class PaginationResponse<T> {
	constructor(data: T, total: number, skip?: number, limit?: number) {
		this.data = data;
		this.total = total;
		this.skip = skip;
		this.limit = limit;
	}

	@ApiProperty()
	data: T;

	@ApiProperty()
	total: number;

	@ApiProperty()
	skip?: number;

	@ApiProperty()
	limit?: number;
}
