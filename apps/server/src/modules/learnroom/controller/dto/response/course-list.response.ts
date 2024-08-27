import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';
import { CourseInfoDataResponse } from './courseInfoDataResponse';

export class CourseListResponse extends PaginationResponse<CourseInfoDataResponse[]> {
	constructor(data: CourseInfoDataResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [CourseInfoDataResponse] })
	data: CourseInfoDataResponse[];
}
