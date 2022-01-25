import { Entity, Enum, IdentifiedReference, ManyToOne, Property, Reference } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';
import type { School } from './school.entity';

import { System } from './system.entity';

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
	user?: User;
	matchedBy?: MatchCreator;
	flagged?: boolean;
}

export enum MatchCreator {
	AUTO = 'auto',
	MANUAL = 'admin',
}
export enum RoleName {
	STUDENT = 'student',
	TEACHER = 'teacher',
	ADMIN = 'administrator',
}

@Entity({ tableName: 'importusers' })
export class ImportUser extends BaseEntityWithTimestamps {
	@ManyToOne(() => 'School', { fieldName: 'schoolId', eager: true }) // TODO eager false, change to reference
	school: IdentifiedReference<School>;

	@ManyToOne(() => 'System', { lazy: true })
	system: IdentifiedReference<System>;

	@Property()
	ldapDn: string;

	/**
	 * extracts the login name out of the dn which has the login name in 'uid=LOGINNAME,[...]'
	 * */
	get loginName(): string | null {
		const PATTERN_LOGIN_FROM_DN = /^uid=(.+?),/i; // extract uid from dn
		const matches = this.ldapDn?.match(PATTERN_LOGIN_FROM_DN);
		if (Array.isArray(matches) && matches.length >= 2) {
			const loginName = matches[1]; // 0: full match, 1: first group match
			return loginName;
		}
		return null;
	}

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

	/**
	 * Update user-match together with matchedBy, take the field as read-only
	 * @private
	 */
	@ManyToOne('User', { fieldName: 'match_userId', eager: true })
	_user?: IdentifiedReference<User>;

	getUser(): User | undefined {
		return this._user;
	}

	hasUser(): boolean {
		const result = this._user == null;
		return result;
	}

	/**
	 * References who set the user, take the field as read-only
	 * @private
	 */
	@Enum({ fieldName: 'match_matchedBy' })
	_matchedBy?: MatchCreator;

	get matchedBy(): MatchCreator | undefined {
		return this._matchedBy;
	}

	@Property({ type: Boolean })
	flagged = false;

	setMatch(user: User, matchedBy: MatchCreator) {
		if (!user.school?.id && user.school !== this.school) {
			throw new Error('no school or not same school'); // TODO
		}
		this._user = Reference.create(user);
		this._matchedBy = matchedBy;
	}

	revokeMatch() {
		this._user = undefined;
		delete this._matchedBy;
	}

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
		if (props.user && props.matchedBy) this.setMatch(props.user, props.matchedBy);
		if (props.flagged && props.flagged === true) this.flagged = true;
	}
}
