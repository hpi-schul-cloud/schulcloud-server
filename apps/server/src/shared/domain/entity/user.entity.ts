import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Collection, Embedded, Entity, Index, ManyToMany, ManyToOne, Property, wrap } from '@mikro-orm/core';
import { ReferenceNotPopulatedLoggableException } from '@shared/common/loggable-exception/reference-not-populated.loggable-exception';
import { EntityWithSchool, LanguageType, Permission, RoleName } from '../interface';
import { EntityId } from '../types';
import { BaseEntityWithTimestamps } from './base.entity';
import { ConsentEntity } from './consent';
import { Role } from './role.entity';
import { SchoolEntity, SchoolRoles } from './school.entity';
import { UserParentsEntity } from './user-parents.entity';
import { UserSourceOptionsEntity } from './user-source-options-entity';

export interface UserProperties {
	email: string;
	firstName: string;
	lastName: string;
	school: SchoolEntity;
	roles: Role[];
	ldapDn?: string;
	externalId?: string;
	language?: LanguageType;
	forcePasswordChange?: boolean;
	preferences?: Record<string, unknown>;
	deletedAt?: Date;
	lastLoginSystemChange?: Date;
	outdatedSince?: Date;
	previousExternalId?: string;
	birthday?: Date;
	customAvatarBackgroundColor?: string;
	parents?: UserParentsEntity[];
	lastSyncedAt?: Date;
	consent?: ConsentEntity;
	source?: string;
	sourceOptions?: UserSourceOptionsEntity;
}

interface UserInfo {
	id: EntityId;
	firstName: string;
	lastName: string;
	language?: LanguageType;
	customAvatarBackgroundColor?: string;
}

@Entity({ tableName: 'users' })
@Index({ properties: ['id', 'email'] })
@Index({ properties: ['firstName', 'lastName'] })
@Index({ properties: ['externalId', 'school'] })
@Index({ properties: ['school', 'ldapDn'] })
@Index({ properties: ['school', 'roles'] })
export class User extends BaseEntityWithTimestamps implements EntityWithSchool {
	@Property()
	@Index()
	email: string;

	@Property()
	firstName: string;

	@Property()
	lastName: string;

	@Index()
	@ManyToMany({ fieldName: 'roles', entity: () => Role })
	roles = new Collection<Role>(this);

	@Index()
	@ManyToOne(() => SchoolEntity, { fieldName: 'schoolId' })
	school: SchoolEntity;

	@Property({ nullable: true })
	@Index()
	ldapDn?: string;

	@Property({ nullable: true, fieldName: 'ldapId' })
	externalId?: string;

	@Property({ nullable: true })
	previousExternalId?: string;

	@Property({ nullable: true })
	@Index()
	importHash?: string;

	@Property({ nullable: true })
	firstNameSearchValues?: string[];

	@Property({ nullable: true })
	lastNameSearchValues?: string[];

	@Property({ nullable: true })
	emailSearchValues?: string[];

	@Property({ nullable: true })
	language?: LanguageType;

	@Property({ nullable: true })
	forcePasswordChange?: boolean;

	@Property({ type: 'object', nullable: true })
	preferences?: Record<string, unknown>;

	@Property({ nullable: true })
	@Index()
	deletedAt?: Date;

	@Property({ nullable: true })
	lastLoginSystemChange?: Date;

	@Property({ nullable: true })
	outdatedSince?: Date;

	@Property({ nullable: true })
	birthday?: Date;

	@Property({ nullable: true })
	customAvatarBackgroundColor?: string; // in legacy it is NOT optional, but all new users stored without default value

	@Embedded(() => ConsentEntity, { nullable: true, object: true })
	consent?: ConsentEntity;

	@Embedded(() => UserParentsEntity, { array: true, nullable: true })
	parents?: UserParentsEntity[];

	@Property({ nullable: true })
	lastSyncedAt?: Date;

	@Property({ nullable: true })
	@Index()
	source?: string;

	@Embedded(() => UserSourceOptionsEntity, { object: true, nullable: true })
	sourceOptions?: UserSourceOptionsEntity;

	constructor(props: UserProperties) {
		super();
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.email = props.email;
		this.school = props.school;
		this.roles.set(props.roles);
		this.ldapDn = props.ldapDn;
		this.externalId = props.externalId;
		this.forcePasswordChange = props.forcePasswordChange;
		this.language = props.language;
		this.preferences = props.preferences ?? {};
		this.deletedAt = props.deletedAt;
		this.lastLoginSystemChange = props.lastLoginSystemChange;
		this.outdatedSince = props.outdatedSince;
		this.previousExternalId = props.previousExternalId;
		this.birthday = props.birthday;
		this.customAvatarBackgroundColor = props.customAvatarBackgroundColor;
		this.parents = props.parents;
		this.lastSyncedAt = props.lastSyncedAt;
		this.consent = props.consent;
		if (props.source !== undefined) {
			this.source = props.source;
		}

		if (props.sourceOptions !== undefined) {
			this.sourceOptions = props.sourceOptions;
		}
	}

	public resolvePermissions(): string[] {
		if (!this.roles.isInitialized(true)) {
			throw new ReferenceNotPopulatedLoggableException('user', 'roles');
		}

		let permissions: string[] = [];

		const roles = this.getRoles();
		roles.forEach((role) => {
			const rolePermissions = role.resolvePermissions();
			permissions = [...permissions, ...rolePermissions];
		});

		const setOfPermissions = this.resolveSchoolPermissions(permissions, roles);

		const uniquePermissions = [...setOfPermissions];

		return uniquePermissions;
	}

	private resolveSchoolPermissions(permissions: string[], roles: Role[]): Set<string> {
		if (!wrap(this.school).isInitialized()) {
			throw new ReferenceNotPopulatedLoggableException('user', 'school');
		}

		const schoolPermissions = this.school.permissions;
		let setOfPermissions = new Set(permissions);

		// This exclusion is necessary because of possible double roles (e.g. admin and teacher). Then the higher role should keep its permissions.
		if (roles.some((role) => role.name === RoleName.ADMINISTRATOR || role.name === RoleName.SUPERHERO)) {
			return setOfPermissions;
		}

		if (roles.some((role) => role.name === RoleName.TEACHER)) {
			setOfPermissions = this.resolveSchoolPermissionsForTeacher(setOfPermissions, schoolPermissions);
		}

		if (roles.some((role) => role.name === RoleName.STUDENT)) {
			setOfPermissions = this.resolveSchoolPermissionsForStudent(setOfPermissions, schoolPermissions);
		}

		return setOfPermissions;
	}

	private resolveSchoolPermissionsForTeacher(
		setOfPermissions: Set<string>,
		schoolPermissions?: SchoolRoles
	): Set<string> {
		const isEnabledByDefault = Configuration.get('TEACHER_STUDENT_VISIBILITY__IS_ENABLED_BY_DEFAULT') as boolean;
		const isConfigurable = Configuration.get('TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE') as boolean;

		if (isConfigurable) {
			if (schoolPermissions?.teacher?.STUDENT_LIST) {
				setOfPermissions.add(Permission.STUDENT_LIST);
			} else {
				setOfPermissions.delete(Permission.STUDENT_LIST);
			}
		} else if (isEnabledByDefault) {
			setOfPermissions.add(Permission.STUDENT_LIST);
		} else {
			setOfPermissions.delete(Permission.STUDENT_LIST);
		}

		return setOfPermissions;
	}

	private resolveSchoolPermissionsForStudent(
		setOfPermissions: Set<string>,
		schoolPermissions?: SchoolRoles
	): Set<string> {
		if (schoolPermissions?.student?.LERNSTORE_VIEW === true) {
			setOfPermissions.add(Permission.LERNSTORE_VIEW);
		} else if (schoolPermissions?.student?.LERNSTORE_VIEW === false) {
			setOfPermissions.delete(Permission.LERNSTORE_VIEW);
		}

		return setOfPermissions;
	}

	public getRoles(): Role[] {
		const roles = this.roles.getItems();

		return roles;
	}

	public getInfo(): UserInfo {
		const userInfo = {
			id: this.id,
			firstName: this.firstName,
			lastName: this.lastName,
			language: this.language,
			customAvatarBackgroundColor: this.customAvatarBackgroundColor,
		};

		return userInfo;
	}
}
