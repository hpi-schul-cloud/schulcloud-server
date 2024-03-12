import { Collection, Embedded, Entity, Index, ManyToMany, ManyToOne, Property } from '@mikro-orm/core';
import { EntityWithSchool, LanguageType } from '../interface';
import { EntityId } from '../types';
import { BaseEntityWithTimestamps } from './base.entity';
import { Role } from './role.entity';
import { SchoolEntity } from './school.entity';
import { UserParentsEntity } from './user-parents.entity';

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
}

interface UserInfo {
	id: EntityId;
	firstName: string;
	lastName: string;
	language?: string;
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
	// @Unique()
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

	@Embedded(() => UserParentsEntity, { array: true, nullable: true })
	parents?: UserParentsEntity[];

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
	}

	public resolvePermissions(): string[] {
		if (!this.roles.isInitialized(true)) {
			throw new Error('Roles items are not loaded.');
		}

		let permissions: string[] = [];

		const roles = this.getRoles();
		roles.forEach((role) => {
			const rolePermissions = role.resolvePermissions();
			permissions = [...permissions, ...rolePermissions];
		});

		const uniquePermissions = [...new Set(permissions)];

		return uniquePermissions;
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
