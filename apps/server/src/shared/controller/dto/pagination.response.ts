import { ApiProperty } from '@nestjs/swagger';

export class PaginationResponse<T> {
	constructor(data: T, total: number) {
		this.data = data;
		this.total = total;
	}

	@ApiProperty()
	data: T;

	@ApiProperty()
	total: number;
}
