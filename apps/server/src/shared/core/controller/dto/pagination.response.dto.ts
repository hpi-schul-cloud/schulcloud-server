import { ApiProperty } from '@nestjs/swagger';
import { Paginated } from '../../types/paginated';

export class PaginationResponse<T> {
	constructor({ data, total, limit, skip }: Paginated<T>) {
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
