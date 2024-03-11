import { LanguageType } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { BaseDO } from './base.do';
import { RoleReference } from './role-reference';

export class UserDO extends BaseDO {
	createdAt?: Date;

	updatedAt?: Date;

	email: string;

	firstName: string;

	lastName: string;

	roles: RoleReference[];

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

	lastLoginSystemChange?: Date;

	outdatedSince?: Date;

	previousExternalId?: string;

	birthday?: Date;

	constructor(domainObject: UserDO) {
		super(domainObject.id);

		this.createdAt = domainObject.createdAt;
		this.updatedAt = domainObject.updatedAt;
		this.email = domainObject.email;
		this.firstName = domainObject.firstName;
		this.lastName = domainObject.lastName;
		this.roles = domainObject.roles;
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
		this.lastLoginSystemChange = domainObject.lastLoginSystemChange;
		this.outdatedSince = domainObject.outdatedSince;
		this.previousExternalId = domainObject.previousExternalId;
		this.birthday = domainObject.birthday;
	}
}
