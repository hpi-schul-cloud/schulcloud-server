import { ApiProperty } from '@nestjs/swagger';

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
