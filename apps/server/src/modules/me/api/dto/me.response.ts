import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LanguageType } from '@shared/domain/interface';

export class MeAccountResponse {
	@ApiProperty()
	id: string;

	constructor(props: MeAccountResponse) {
		this.id = props.id;
	}
}

export class MeSchoolLogoResponse {
	@ApiPropertyOptional()
	url?: string;

	@ApiPropertyOptional()
	name?: string;

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

	@ApiPropertyOptional()
	customAvatarBackgroundColor?: string;

	constructor(props: MeUserResponse) {
		this.id = props.id;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.customAvatarBackgroundColor = props.customAvatarBackgroundColor;
	}
}

export class MeRoleResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	constructor(props: MeRoleResponse) {
		this.id = props.id;
		this.name = props.name;
	}
}

export class MeSystemResponse {
	@ApiProperty()
	id: string;

	@ApiPropertyOptional()
	name?: string;

	@ApiProperty()
	hasEndSessionEndpoint: boolean;

	constructor(props: MeSystemResponse) {
		this.id = props.id;
		this.name = props.name;
		this.hasEndSessionEndpoint = props.hasEndSessionEndpoint;
	}
}

export class MeResponse {
	@ApiProperty()
	school: MeSchoolResponse;

	@ApiProperty()
	user: MeUserResponse;

	@ApiProperty({ type: [MeRoleResponse] })
	roles: MeRoleResponse[];

	@ApiProperty()
	permissions: string[];

	@ApiProperty({
		enum: LanguageType,
		enumName: 'LanguageType',
	})
	language?: LanguageType;

	@ApiProperty()
	account: MeAccountResponse;

	@ApiPropertyOptional()
	system?: MeSystemResponse;

	constructor(props: MeResponse) {
		this.school = props.school;
		this.user = props.user;
		this.roles = props.roles;
		this.permissions = props.permissions;
		this.language = props.language;
		this.account = props.account;
		this.system = props.system;
	}
}
