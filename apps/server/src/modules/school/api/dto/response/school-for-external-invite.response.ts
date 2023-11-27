import { ApiProperty } from '@nestjs/swagger';

export class SchoolForExternalInviteResponse {
	constructor(props: SchoolForExternalInviteResponse) {
		this.id = props.id;
		this.name = props.name;
	}

	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;
}
