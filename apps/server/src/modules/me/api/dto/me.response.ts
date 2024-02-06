import { ApiProperty } from '@nestjs/swagger';

export class MeAccountResponse {
	@ApiProperty()
	id: string;

	constructor(props: MeAccountResponse) {
		this.id = props.id;
	}
}

class MeSchoolLogoResponse {
	@ApiProperty()
	url: string | null;

	@ApiProperty()
	name: string | null;

	constructor(props: MeSchoolLogoResponse) {
		this.url = props.url;
		this.name = props.name;
	}
}

export class MeSchoolResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	logo: MeSchoolLogoResponse;

	constructor(props: MeSchoolResponse) {
		this.id = props.id;
		this.name = props.name;
		this.logo = props.logo;
	}
}

export class MeUserResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	firstName: string;

	@ApiProperty()
	lastName: string;

	@ApiProperty()
	language: string | null;

	@ApiProperty()
	customAvatarBackgroundColor?: string | null;

	constructor(props: MeUserResponse) {
		this.id = props.id;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.language = props.language;
		this.customAvatarBackgroundColor = props.customAvatarBackgroundColor;
	}
}

export class MeRolesReponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	constructor(props: MeRolesReponse) {
		this.id = props.id;
		this.name = props.name;
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

	@ApiProperty()
	account: MeAccountResponse;

	constructor(props: MeResponse) {
		this.school = props.school;
		this.user = props.user;
		this.roles = props.roles;
		this.permissions = props.permissions;
		this.account = props.account;
	}
}
