import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';
import { SchoolReducedResponse } from './school-reduced.response';

export class SchoolListResponse extends PaginationResponse<SchoolReducedResponse[]> {
	constructor(data: SchoolReducedResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [SchoolReducedResponse] })
	data: SchoolReducedResponse[];
}
