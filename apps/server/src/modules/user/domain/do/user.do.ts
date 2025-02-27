import { BaseDO, RoleReference } from '@shared/domain/domainobject';
import { Consent } from '@shared/domain/domainobject/consent';
import { LanguageType } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { UserSourceOptions } from './user-source-options.do';

export class SecondarySchoolReference {
	public schoolId: EntityId;

	public role: RoleReference;

	constructor(props: SecondarySchoolReference) {
		this.schoolId = props.schoolId;
		this.role = props.role;
	}
}

export class UserDo extends BaseDO {
	public createdAt?: Date;

	public updatedAt?: Date;

	public email: string;

	public firstName: string;

	public lastName: string;

	public preferredName?: string;

	public roles: RoleReference[];

	public schoolId: EntityId;

	public schoolName?: string;

	public secondarySchools: SecondarySchoolReference[];

	public ldapDn?: string;

	public externalId?: string;

	public importHash?: string;

	public firstNameSearchValues?: string[];

	public lastNameSearchValues?: string[];

	public emailSearchValues?: string[];

	public language?: LanguageType;

	public forcePasswordChange?: boolean;

	public discoverable?: boolean;

	public preferences?: Record<string, unknown>;

	public lastLoginSystemChange?: Date;

	public outdatedSince?: Date;

	public previousExternalId?: string;

	public birthday?: Date;

	public consent?: Consent;

	public sourceOptions?: UserSourceOptions;

	public lastSyncedAt?: Date;

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
		this.lastSyncedAt = domainObject.lastSyncedAt;
	}
}
