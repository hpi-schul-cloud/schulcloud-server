import { EntityId, LanguageType } from '@shared/domain';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';

export interface UserProps extends AuthorizableObject {
	createdAt?: Date;
	updatedAt?: Date;
	email: string;
	firstName: string;
	lastName: string;
	roles: EntityId[];
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
}

export class User extends DomainObject<UserProps> {
	get email(): string {
		return this.props.email;
	}

	get firstName(): string {
		return this.props.firstName;
	}

	get lastName(): string {
		return this.props.lastName;
	}

	get schoolId(): string {
		return this.props.schoolId;
	}

	get roles(): EntityId[] {
		return this.props.roles;
	}

	get ldapDn(): string | undefined {
		return this.props.ldapDn;
	}

	get externalId(): string | undefined {
		return this.props.externalId;
	}

	get language(): LanguageType | undefined {
		return this.props.language;
	}

	get forcePasswordChange(): boolean | undefined {
		return this.props.forcePasswordChange;
	}

	get preferences(): Record<string, unknown> | undefined {
		return this.props.preferences;
	}

	get lastLoginSystemChange(): Date | undefined {
		return this.props.lastLoginSystemChange;
	}

	get outdatedSince(): Date | undefined {
		return this.props.outdatedSince;
	}

	get previousExternalId(): string | undefined {
		return this.props.previousExternalId;
	}
}
