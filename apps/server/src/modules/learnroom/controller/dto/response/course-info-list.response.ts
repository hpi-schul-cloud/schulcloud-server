import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';
import { CourseInfoResponse } from './course-info.response';

export class CourseInfoListResponse extends PaginationResponse<CourseInfoResponse[]> {
	constructor(data: CourseInfoResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [CourseInfoResponse] })
	data: CourseInfoResponse[];
}
