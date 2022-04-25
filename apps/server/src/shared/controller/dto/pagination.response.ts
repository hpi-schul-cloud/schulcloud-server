import { ApiProperty } from '@nestjs/swagger';

export abstract class PaginationResponse<T> {
	constructor(total: number, skip?: number, limit?: number) {
		this.total = total;
		this.skip = skip;
		this.limit = limit;
	}

	@ApiProperty({ description: 'The items for the current page.' })
	abstract data: T;

	@ApiProperty({ description: 'The total amount of items.', type: 'number' })
	total: number;

	@ApiProperty({ description: 'The amount of items skipped from the start.', type: 'number' })
	skip?: number;

	@ApiProperty({ description: 'The page size of the response.', type: 'number' })
	limit?: number;
}
