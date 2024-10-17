import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';

export class SchoolUserResponse {
	@ApiProperty()
	firstName!: string;

	@ApiProperty()
	lastName!: string;

	@ApiProperty()
	id!: string;

	constructor(props: SchoolUserResponse) {
		this.id = props.id;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
	}
}

export class SchoolUserListResponse extends PaginationResponse<SchoolUserResponse[]> {
	constructor(data: SchoolUserResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [SchoolUserResponse] })
	data: SchoolUserResponse[];
}
