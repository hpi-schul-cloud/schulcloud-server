import { ApiProperty } from '@nestjs/swagger';

export class MeResponse {
	// school
	// user
	// role
	@ApiProperty()
	permissions: string[];

	constructor(props: MeResponse) {
		this.permissions = props.permissions;
	}
}
