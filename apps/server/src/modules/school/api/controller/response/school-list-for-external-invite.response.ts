import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller/dto/pagination.response';
import { SchoolForExternalInviteResponse } from './school-for-external-invite.response';

export class SchoolListForExternalInviteResponse extends PaginationResponse<SchoolForExternalInviteResponse[]> {
	constructor(data: SchoolForExternalInviteResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [SchoolForExternalInviteResponse] })
	data: SchoolForExternalInviteResponse[];
}
