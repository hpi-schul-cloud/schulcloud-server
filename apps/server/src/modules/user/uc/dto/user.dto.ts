import { EntityId, LanguageType } from '@shared/domain';

export class UserDto {
	constructor(user: UserDto) {
		this.id = user.id;
		this.email = user.email;
		this.firstName = user.firstName;
		this.lastName = user.lastName;
		this.roleIds = user.roleIds;
		this.schoolId = user.schoolId;
		this.ldapDn = user.ldapDn;
		this.externalId = user.externalId;
		this.language = user.language;
		this.forcePasswordChange = user.forcePasswordChange;
		this.preferences = user.preferences;
	}

	id?: EntityId;

	email: string;

	firstName: string;

	lastName: string;

	roleIds: EntityId[] = [];

	schoolId: string;

	ldapDn?: string;

	externalId?: string;

	language?: LanguageType;

	forcePasswordChange?: boolean;

	// See user entity
	preferences?: Record<string, unknown> = {};
}
