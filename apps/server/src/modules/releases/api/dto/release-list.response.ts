import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller/dto';
import { ReleaseItemResponse } from './release-item.response';

export class ReleaseListResponse extends PaginationResponse<ReleaseItemResponse[]> {
	constructor(data: ReleaseItemResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [ReleaseItemResponse] })
	data: ReleaseItemResponse[];
}
