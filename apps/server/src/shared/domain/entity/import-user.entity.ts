import {
	Embeddable,
	Embedded,
	Entity,
	Enum,
	IdentifiedReference,
	ManyToOne,
	Property,
	Reference,
} from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';
import type { School } from './school.entity';
import type { User } from './user.entity';

export interface IImportUserProperties {
	// references
	school: School;
	system: System;
	// external identifiers
	ldapDn: string;
	ldapId: string;
	// descriptive properties
	firstName: string;
	lastName: string;
	email: string; // TODO VO
	roleNames?: RoleName[];
	classNames?: string[];
	match?: UserMatch;
	flagged?: boolean;
}

// class EMailVO {
// 	_email: string;

// 	set email(value: string) {
// 		this._email = value.toLowerCase();
// 	}

// 	get email(): string {
// 		return this._email;
// 	}

// 	constructor(value: string) {
// 		this._email = value.toLowerCase();
// 	}
// }

export enum MatchCreator {
	AUTO = 'auto',
	MANUAL = 'admin',
}
export enum RoleName {
	STUDENT = 'student',
	TEACHER = 'teacher',
	ADMIN = 'admin',
}

@Embeddable()
export class UserMatch {
	@Property({ fieldName: 'userId' })
	user: User;

	@Enum({ fieldName: 'matchedBy' })
	matchedBy: MatchCreator;

	constructor(props: UserMatch) {
		this.user = props.user;
		this.matchedBy = props.matchedBy;
	}
}
interface ISystemProperties {
	type: string;
}
@Entity({ tableName: 'systems' })
export class System extends BaseEntityWithTimestamps {
	constructor(props: ISystemProperties) {
		super();
		this.type = props.type;
	}

	// TODO add props
	@Property()
	type: string;
}

@Entity({ tableName: 'importUser' })
export class ImportUser extends BaseEntityWithTimestamps {
	@ManyToOne(() => 'School', { wrappedReference: true, lazy: true })
	school: IdentifiedReference<School>;

	@ManyToOne(() => 'System', { wrappedReference: true, lazy: true })
	system: IdentifiedReference<System>;

	@Property()
	ldapDn: string;

	@Property()
	ldapId: string;

	@Property()
	firstName: string;

	@Property()
	lastName: string;

	@Property()
	/**
	 * Lowercase email string // TODO VO
	 */
	email: string;

	@Enum({ fieldName: 'roles' })
	roleNames: RoleName[] = [];

	@Property()
	classNames: string[] = [];

	@Embedded({ entity: () => UserMatch, object: true })
	match?: UserMatch;

	@Property()
	flagged = false;

	constructor(props: IImportUserProperties) {
		super();
		this.school = Reference.create(props.school);
		this.system = Reference.create(props.system);
		this.ldapDn = props.ldapDn;
		this.ldapId = props.ldapId;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.email = props.email;
		if (Array.isArray(props.roleNames) && props.roleNames.length > 0) this.roleNames.push(...props.roleNames);
		if (Array.isArray(props.classNames) && props.classNames.length > 0) this.classNames.push(...props.classNames);
		if (props.match) this.match = props.match;
		if (props.flagged && props.flagged === true) this.flagged = true;
	}
}
