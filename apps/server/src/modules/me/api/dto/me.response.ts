import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LanguageType, Permission } from '@shared/domain/interface';

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

export class MePreferencesResponse {
	@ApiPropertyOptional({ nullable: true })
	releaseDate?: string;

	constructor(props: MePreferencesResponse) {
		this.releaseDate = props.releaseDate;
	}
}

export class MeResponse {
	@ApiProperty()
	school: MeSchoolResponse;

	@ApiProperty()
	user: MeUserResponse;

	@ApiProperty({ type: [MeRoleResponse] })
	roles: MeRoleResponse[];

	@ApiProperty({ enum: Permission, isArray: true, enumName: 'Permission' })
	permissions: Permission[];

	@ApiProperty({
		enum: LanguageType,
		enumName: 'LanguageType',
	})
	language?: LanguageType;

	@ApiProperty()
	preferences: MePreferencesResponse;

	@ApiProperty()
	account: MeAccountResponse;

	@ApiPropertyOptional()
	systemId?: string;

	constructor(props: MeResponse) {
		this.school = props.school;
		this.user = props.user;
		this.roles = props.roles;
		this.permissions = props.permissions;
		this.language = props.language;
		this.preferences = props.preferences;
		this.account = props.account;
		this.systemId = props.systemId;
	}
}
