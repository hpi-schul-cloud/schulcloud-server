import { Collection, Entity, Index, ManyToMany, ManyToOne, Property } from '@mikro-orm/core';
import { IEntityWithSchool } from '../interface';
import { BaseEntityWithTimestamps } from './base.entity';
import { Role } from './role.entity';
import type { School } from './school.entity';

export enum LanguageType {
	DE = 'de',
	EN = 'en',
	ES = 'es',
	UA = 'ua',
}

export interface IUserProperties {
	email: string;
	firstName: string;
	lastName: string;
	school: School;
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
}

@Entity({ tableName: 'users' })
@Index({ properties: ['id', 'email'] })
@Index({ properties: ['firstName', 'lastName'] })
@Index({ properties: ['externalId', 'school'] })
@Index({ properties: ['school', 'ldapDn'] })
@Index({ properties: ['school', 'roles'] })
export class User extends BaseEntityWithTimestamps implements IEntityWithSchool {
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
	@ManyToOne('School', { fieldName: 'schoolId' })
	school: School;

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

	@Property({ nullable: true })
	preferences?: Record<string, unknown>;

	@Property({ nullable: true })
	@Index()
	deletedAt?: Date;

	@Property({ nullable: true })
	lastLoginSystemChange?: Date;

	@Property({ nullable: true })
	outdatedSince?: Date;

	constructor(props: IUserProperties) {
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
	}

	public resolvePermissions(): string[] {
		if (!this.roles.isInitialized(true)) {
			throw new Error('Roles items are not loaded.');
		}

		let permissions: string[] = [];

		const roles = this.roles.getItems();
		roles.forEach((role) => {
			const rolePermissions = role.resolvePermissions();
			permissions = [...permissions, ...rolePermissions];
		});

		const uniquePermissions = [...new Set(permissions)];

		return uniquePermissions;
	}
}
