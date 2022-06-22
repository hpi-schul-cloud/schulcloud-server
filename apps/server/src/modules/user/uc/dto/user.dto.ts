import { LanguageType } from '@shared/domain';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { RoleDto } from '@src/modules/user/uc/dto/role.dto';

export class UserDto {
	constructor(user: UserDto) {
		this.email = user.email;
		this.firstName = user.firstName;
		this.lastName = user.lastName;
		this.roles = user.roles;
		this.school = user.school;
		this.ldapDn = user.ldapDn;
		this.ldapId = user.ldapId;
		this.language = user.language;
		this.forcePasswordChange = user.forcePasswordChange;
		this.preferences = user.preferences;
	}

	email: string;

	firstName: string;

	lastName: string;

	roles: RoleDto[];

	school: SchoolDto;

	ldapDn?: string;

	ldapId?: string;

	language?: LanguageType;

	forcePasswordChange?: boolean;

	preferences?: Record<string, unknown>;
}
