import { ApiProperty } from '@nestjs/swagger';

export abstract class PaginationResponse<T> {
	constructor(total: number, skip?: number, limit?: number) {
		this.total = total;
		this.skip = skip;
		this.limit = limit;
	}

	@ApiProperty()
	abstract data: T;

	@ApiProperty({ type: 'number' })
	total: number;

	@ApiProperty({ type: 'number' })
	skip?: number;

	@ApiProperty({ type: 'number' })
	limit?: number;
}
