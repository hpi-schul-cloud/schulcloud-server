import { Collection, Entity, Index, ManyToMany, ManyToOne, Property } from '@mikro-orm/core';
import { IEntityWithSchool } from '../interface';
import { BaseEntityWithTimestamps } from './base.entity';
import type { Role } from './role.entity';
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
	ldapId?: string;
	language?: LanguageType;
	forcePasswordChange?: boolean;
	preferences?: Record<string, unknown>;
}

@Entity({ tableName: 'users' })
@Index({ properties: ['id', 'email'] })
@Index({ properties: ['firstName', 'lastName'] })
@Index({ properties: ['ldapId', 'school'] })
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
	@ManyToMany('Role', undefined, { fieldName: 'roles' })
	roles = new Collection<Role>(this);

	@Index()
	@ManyToOne('School', { fieldName: 'schoolId' })
	school: School;

	@Property({ nullable: true })
	@Index()
	ldapDn?: string;

	@Property({ nullable: true })
	@Index()
	ldapId?: string;

	@Property({ nullable: true })
	language?: LanguageType;

	@Property({ nullable: true })
	forcePasswordChange?: boolean;

	@Property({ nullable: true })
	preferences?: Record<string, unknown>;

	constructor(props: IUserProperties) {
		super();
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.email = props.email;
		this.school = props.school;
		this.roles.set(props.roles);
		this.ldapDn = props.ldapDn;
		this.ldapId = props.ldapId;
		this.forcePasswordChange = props.forcePasswordChange;
		this.language = props.language;
		this.preferences = props.preferences ?? {};
	}
}
