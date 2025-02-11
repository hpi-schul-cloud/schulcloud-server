import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller/dto';
import { ClassInfoResponse } from './class-info.response';

export class ClassInfoSearchListResponse extends PaginationResponse<ClassInfoResponse[]> {
	constructor(data: ClassInfoResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [ClassInfoResponse] })
	data: ClassInfoResponse[];
}
