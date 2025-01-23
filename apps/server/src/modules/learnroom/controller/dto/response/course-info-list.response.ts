import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller/dto';
import { CourseInfoDataResponse } from './course-info-data-response';

export class CourseInfoListResponse extends PaginationResponse<CourseInfoDataResponse[]> {
	constructor(data: CourseInfoDataResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [CourseInfoDataResponse] })
	data: CourseInfoDataResponse[];
}
