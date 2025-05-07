import { ApiProperty } from '@nestjs/swagger';

export class SchoolUserResponse {
	@ApiProperty()
	public firstName!: string;

	@ApiProperty()
	public lastName!: string;

	@ApiProperty()
	public schoolName!: string;

	@ApiProperty()
	public id!: string;

	constructor(props: SchoolUserResponse) {
		this.id = props.id;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.schoolName = props.schoolName;
	}
}

export class SchoolUserListResponse {
	constructor(data: SchoolUserResponse[]) {
		this.data = data;
	}

	@ApiProperty({ type: [SchoolUserResponse] })
	data: SchoolUserResponse[];
}
