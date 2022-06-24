import { EntityId, LanguageType } from '@shared/domain';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';

export class UserDto {
	constructor(user: UserDto) {
		this.id = user.id;
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

	id?: EntityId;

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
