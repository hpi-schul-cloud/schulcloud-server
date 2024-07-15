import { Entity, Enum, IdentifiedReference, ManyToOne, Property, Unique, wrap } from '@mikro-orm/core';
import { SystemEntity } from '@modules/system/entity/system.entity';
import { EntityWithSchool, RoleName } from '../interface';
import { BaseEntityReference, BaseEntityWithTimestamps } from './base.entity';
import { SchoolEntity } from './school.entity';
import type { User } from './user.entity';

export type IImportUserRoleName = RoleName.ADMINISTRATOR | RoleName.TEACHER | RoleName.STUDENT;

export interface ImportUserProperties {
	// references
	school: SchoolEntity;
	system: SystemEntity;
	// external identifiers
	ldapDn: string;
	externalId: string;
	// descriptive properties
	firstName: string;
	lastName: string;
	email: string; // TODO VO
	roleNames?: IImportUserRoleName[];
	classNames?: string[];
	user?: User;
	matchedBy?: MatchCreator;
	flagged?: boolean;
}

export enum MatchCreator {
	AUTO = 'auto',
	MANUAL = 'admin',
}

@Entity({ tableName: 'importusers' })
@Unique({ properties: ['school', 'externalId'] })
@Unique({ properties: ['school', 'ldapDn'] })
@Unique({ properties: ['school', 'email'] })
export class ImportUser extends BaseEntityWithTimestamps implements EntityWithSchool {
	constructor(props: ImportUserProperties) {
		super();
		this.school = wrap(props.school).toReference();
		this.system = wrap(props.system).toReference();
		this.ldapDn = props.ldapDn;
		this.externalId = props.externalId;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.email = props.email;
		if (Array.isArray(props.roleNames) && props.roleNames.length > 0) this.roleNames.push(...props.roleNames);
		if (Array.isArray(props.classNames) && props.classNames.length > 0) this.classNames.push(...props.classNames);
		if (props.user && props.matchedBy) this.setMatch(props.user, props.matchedBy);
		if (props.flagged && props.flagged === true) this.flagged = true;
	}

	@ManyToOne(() => SchoolEntity, { fieldName: 'schoolId', wrappedReference: true, eager: true })
	school: IdentifiedReference<SchoolEntity>;

	@ManyToOne(() => SystemEntity, { wrappedReference: true })
	system: IdentifiedReference<SystemEntity, BaseEntityReference>;

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

	@Property({ fieldName: 'ldapId' })
	externalId: string;

	@Property()
	firstName: string;

	@Property()
	lastName: string;

	@Property()
	/**
	 * Lowercase email string
	 */
	email: string;

	@Enum({ fieldName: 'roles' })
	roleNames: IImportUserRoleName[] = [];

	@Property()
	classNames: string[] = [];

	/**
	 * Update user-match together with matchedBy, take the field as read-only
	 * @read
	 */
	@ManyToOne('User', { fieldName: 'match_userId', eager: true, nullable: true })
	@Unique({ options: { partialFilterExpression: { match_userId: { $type: 'objectId' } } } })
	user?: User;

	/**
	 * References who set the user, take the field as read-only
	 * @private
	 */
	@Enum({ fieldName: 'match_matchedBy', nullable: true })
	matchedBy?: MatchCreator;

	@Property({ type: Boolean })
	flagged = false;

	setMatch(user: User, matchedBy: MatchCreator) {
		if (this.school.id !== user.school.id) {
			throw new Error('not same school');
		}
		this.user = user;
		this.matchedBy = matchedBy;
	}

	revokeMatch() {
		this.user = undefined;
		this.matchedBy = undefined;
	}

	static isImportUserRole(role: RoleName): role is IImportUserRoleName {
		return role === RoleName.ADMINISTRATOR || role === RoleName.STUDENT || role === RoleName.TEACHER;
	}
}
