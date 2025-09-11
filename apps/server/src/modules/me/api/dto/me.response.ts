import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LanguageType } from '@shared/domain/interface';

export class MeAccountResponse {
	@ApiProperty()
	public id: string;

	constructor(props: MeAccountResponse) {
		this.id = props.id;
	}
}

export class MeSchoolLogoResponse {
	@ApiPropertyOptional()
	public url?: string;

	@ApiPropertyOptional()
	public name?: string;

	constructor(props: MeSchoolLogoResponse) {
		this.url = props.url;
		this.name = props.name;
	}
}

export class MeSchoolResponse {
	@ApiProperty()
	public id: string;

	@ApiProperty()
	public name: string;

	@ApiProperty()
	public logo: MeSchoolLogoResponse;

	constructor(props: MeSchoolResponse) {
		this.id = props.id;
		this.name = props.name;
		this.logo = props.logo;
	}
}

export class MeUserResponse {
	@ApiProperty()
	public id: string;

	@ApiProperty()
	public firstName: string;

	@ApiProperty()
	public lastName: string;

	@ApiPropertyOptional()
	public customAvatarBackgroundColor?: string;
	
	@ApiPropertyOptional()
	public forcePasswordChange?: boolean;

	constructor(props: MeUserResponse) {
		this.id = props.id;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.customAvatarBackgroundColor = props.customAvatarBackgroundColor;
		this.forcePasswordChange = props.forcePasswordChange;
	}
}

export class MeRoleResponse {
	@ApiProperty()
	public id: string;

	@ApiProperty()
	public name: string;

	constructor(props: MeRoleResponse) {
		this.id = props.id;
		this.name = props.name;
	}
}

export class MeResponse {
	@ApiProperty()
	public school: MeSchoolResponse;

	@ApiProperty()
	public user: MeUserResponse;

	@ApiProperty({ type: [MeRoleResponse] })
	public roles: MeRoleResponse[];

	@ApiProperty()
	public permissions: string[];

	@ApiProperty({
		enum: LanguageType,
		enumName: 'LanguageType',
	})
	public language?: LanguageType;

	@ApiProperty()
	public account: MeAccountResponse;

	@ApiPropertyOptional()
	public systemId?: string;

	constructor(props: MeResponse) {
		this.school = props.school;
		this.user = props.user;
		this.roles = props.roles;
		this.permissions = props.permissions;
		this.language = props.language;
		this.account = props.account;
		this.systemId = props.systemId;
	}
}
