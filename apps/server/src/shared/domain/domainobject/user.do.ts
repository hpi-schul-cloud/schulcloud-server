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
		this.email = domainObject.email;
		this.firstName = domainObject.firstName;
		this.lastName = domainObject.lastName;
		this.roleIds = domainObject.roleIds;
		this.schoolId = domainObject.schoolId;
		this.ldapDn = domainObject.ldapDn;
		this.externalId = domainObject.externalId;
		this.importHash = domainObject.importHash;
		this.firstNameSearchValues = domainObject.firstNameSearchValues;
		this.lastNameSearchValues = domainObject.lastNameSearchValues;
		this.emailSearchValues = domainObject.emailSearchValues;
		this.language = domainObject.language;
		this.forcePasswordChange = domainObject.forcePasswordChange;
		this.preferences = domainObject.preferences;
	}
}
