import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller/dto';

export class SchoolForExternalInviteResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	constructor(props: SchoolForExternalInviteResponse) {
		this.id = props.id;
		this.name = props.name;
	}
}

export class SchoolForExternalInviteListResponse extends PaginationResponse<SchoolForExternalInviteResponse[]> {
	constructor(data: SchoolForExternalInviteResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [SchoolForExternalInviteResponse] })
	public data: SchoolForExternalInviteResponse[];
}
