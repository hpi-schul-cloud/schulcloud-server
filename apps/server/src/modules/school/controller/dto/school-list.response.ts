import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';
import { SchoolResponse } from './school.response';

export class SchoolListResponse extends PaginationResponse<SchoolResponse[]> {
	constructor(data: SchoolResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [SchoolResponse] })
	data: SchoolResponse[];
}
