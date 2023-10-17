import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';
import { SlimSchoolResponse } from './school-reduced.response';

export class SlimSchoolListResponse extends PaginationResponse<SlimSchoolResponse[]> {
	constructor(data: SlimSchoolResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [SlimSchoolResponse] })
	data: SlimSchoolResponse[];
}
