import { ApiProperty } from '@nestjs/swagger';

export class MeSchoolResponse {
	@ApiProperty()
	id: string;

	constructor(props: MeSchoolResponse) {
		this.id = props.id;
	}
}

export class MeUserResponse {
	@ApiProperty()
	id: string;

	constructor(props: MeUserResponse) {
		this.id = props.id;
	}
}

export class MeRolesReponse {
	@ApiProperty()
	id: string;

	constructor(props: MeRolesReponse) {
		this.id = props.id;
	}
}

export class MeResponse {
	@ApiProperty()
	school: MeSchoolResponse;

	@ApiProperty()
	user: MeUserResponse;

	@ApiProperty()
	roles: MeRolesReponse[];

	@ApiProperty()
	permissions: string[];

	constructor(props: MeResponse) {
		this.school = props.school;
		this.user = props.user;
		this.roles = props.roles;
		this.permissions = props.permissions;
	}
}
