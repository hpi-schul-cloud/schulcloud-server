import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';
import { CourseResponse } from './course.response';

export class CourseListResponse extends PaginationResponse<CourseResponse[]> {
	constructor(data: CourseResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [CourseResponse] })
	data: CourseResponse[];
}
