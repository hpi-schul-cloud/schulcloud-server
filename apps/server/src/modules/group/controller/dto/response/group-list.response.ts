import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller/dto';
import { GroupResponse } from './group.response';

export class GroupListResponse extends PaginationResponse<GroupResponse[]> {
	constructor(data: GroupResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [GroupResponse] })
	data: GroupResponse[];
}
