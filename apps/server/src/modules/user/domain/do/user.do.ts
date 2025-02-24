import { BaseDO, RoleReference } from '@shared/domain/domainobject';
import { Consent } from '@shared/domain/domainobject/consent';
import { LanguageType } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { UserSourceOptions } from './user-source-options.do';

export class SecondarySchoolReference {
	schoolId: EntityId;

	role: RoleReference;

	constructor(props: SecondarySchoolReference) {
		this.schoolId = props.schoolId;
		this.role = props.role;
	}
}

export class UserDo extends BaseDO {
	createdAt?: Date;

	updatedAt?: Date;

	email: string;

	firstName: string;

	lastName: string;

	preferredName?: string;

	roles: RoleReference[];

	schoolId: EntityId;

	schoolName?: string;

	secondarySchools: SecondarySchoolReference[];

	ldapDn?: string;

	externalId?: string;

	importHash?: string;

	firstNameSearchValues?: string[];

	lastNameSearchValues?: string[];

	emailSearchValues?: string[];

	language?: LanguageType;

	forcePasswordChange?: boolean;

	discoverable?: boolean;

	preferences?: Record<string, unknown>;

	lastLoginSystemChange?: Date;

	outdatedSince?: Date;

	previousExternalId?: string;

	birthday?: Date;

	consent?: Consent;

	sourceOptions?: UserSourceOptions;

	constructor(domainObject: UserDo) {
		super(domainObject.id);

		this.createdAt = domainObject.createdAt;
		this.updatedAt = domainObject.updatedAt;
		this.email = domainObject.email;
		this.firstName = domainObject.firstName;
		this.lastName = domainObject.lastName;
		this.preferredName = domainObject.preferredName;
		this.roles = domainObject.roles;
		this.schoolId = domainObject.schoolId;
		this.schoolName = domainObject.schoolName;
		this.secondarySchools = domainObject.secondarySchools || [];
		this.ldapDn = domainObject.ldapDn;
		this.externalId = domainObject.externalId;
		this.importHash = domainObject.importHash;
		this.firstNameSearchValues = domainObject.firstNameSearchValues;
		this.lastNameSearchValues = domainObject.lastNameSearchValues;
		this.emailSearchValues = domainObject.emailSearchValues;
		this.language = domainObject.language;
		this.forcePasswordChange = domainObject.forcePasswordChange;
		this.discoverable = domainObject.discoverable;
		this.preferences = domainObject.preferences;
		this.lastLoginSystemChange = domainObject.lastLoginSystemChange;
		this.outdatedSince = domainObject.outdatedSince;
		this.previousExternalId = domainObject.previousExternalId;
		this.birthday = domainObject.birthday;
		this.consent = domainObject.consent;
		this.sourceOptions = domainObject.sourceOptions;
	}
}
