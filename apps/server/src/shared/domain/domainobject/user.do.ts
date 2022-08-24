import { BaseWithTimestampsDO, EntityId, LanguageType } from '@shared/domain/index';

export class UserDO extends BaseWithTimestampsDO {
	email: string;

	firstName: string;

	lastName: string;

	roleIds: EntityId[];

	schoolId: EntityId;

	ldapDn?: string;

	externalId?: string;

	importHash?: string;

	firstNameSearchValues?: string[];

	lastNameSearchValues?: string[];

	emailSearchValues?: string[];

	language?: LanguageType;

	forcePasswordChange?: boolean;

	preferences?: Record<string, unknown>;

	constructor(domainObject: UserDO) {
		super(domainObject);
		this.firstName = domainObject.firstName;
		this.lastName = domainObject.lastName;
		this.email = domainObject.email;
		this.schoolId = domainObject.schoolId;
		this.roleIds = domainObject.roleIds;
		this.ldapDn = domainObject.ldapDn;
		this.externalId = domainObject.externalId;
		this.forcePasswordChange = domainObject.forcePasswordChange;
		this.language = domainObject.language;
		this.preferences = domainObject.preferences;
	}
}
