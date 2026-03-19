import { buildAllSearchableStringsForUser } from '@imports-from-feathers';
import {
	BeforeCreate,
	BeforeUpdate,
	ChangeSet,
	Collection,
	Embeddable,
	Embedded,
	Entity,
	EventArgs,
	Index,
	ManyToMany,
	ManyToOne,
	Property,
	Unique,
	wrap,
} from '@mikro-orm/core';
import { RoleName } from '@modules/role';
import { Role } from '@modules/role/repo';
import { SchoolEntity, SchoolRoles } from '@modules/school/repo';
import { ReferenceNotPopulatedLoggableException } from '@shared/common/loggable-exception/reference-not-populated.loggable-exception';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { LanguageType, Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { ConsentEntity } from './consent.entity';
import { UserParentsEntity } from './user-parents.entity';

export interface UserProperties {
	email: string;
	firstName: string;
	lastName: string;
	preferredName?: string;
	school: SchoolEntity;
	secondarySchools?: UserSchoolEmbeddable[];
	roles: Role[];
	ldapDn?: string;
	externalId?: string;
	language?: LanguageType;
	forcePasswordChange?: boolean;
	discoverable?: boolean;
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
}

interface UserInfo {
	id: EntityId;
	firstName: string;
	lastName: string;
	language?: LanguageType;
	customAvatarBackgroundColor?: string;
}

@Embeddable()
export class UserSchoolEmbeddable {
	@Index()
	@ManyToOne(() => SchoolEntity)
	school: SchoolEntity;

	@ManyToOne(() => Role)
	role: Role;

	constructor(props: UserSchoolEmbeddable) {
		this.school = props.school;
		this.role = props.role;
	}
}

@Entity({ tableName: 'users' })
@Index({ properties: ['id', 'email'] })
@Index({ properties: ['firstName', 'lastName'] })
@Unique({
	properties: ['externalId', 'source'],
	options: { partialFilterExpression: { source: { $exists: true } } },
	// TODO: LDAP, Moin.Schule and BRB-IDM have to set source as well.
})
@Index({ properties: ['externalId', 'school'] })
@Index({ properties: ['school', 'ldapDn'] })
@Index({ properties: ['school', 'roles'] })
export class User extends BaseEntityWithTimestamps {
	@Property()
	@Index()
	email: string;

	@Property()
	firstName: string;

	@Property()
	lastName: string;

	@Property({ nullable: true })
	preferredName?: string;

	@Index()
	@ManyToMany({ fieldName: 'roles', entity: () => Role })
	roles = new Collection<Role>(this);

	@Index()
	@ManyToOne(() => SchoolEntity, { fieldName: 'schoolId' })
	school: SchoolEntity;

	@Embedded(() => UserSchoolEmbeddable, { array: true, nullable: true })
	secondarySchools: UserSchoolEmbeddable[] = [];

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
	language?: LanguageType;

	@Property({ nullable: true })
	forcePasswordChange?: boolean;

	@Property({ nullable: true })
	discoverable?: boolean;

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

	/*
	 * The language override is set to 'ignore-this-field' to ensure that the text index does not attempt to process the text as a language specified by the 'language' field, which is the default behavior.
	 * https://www.mongodb.com/docs/v7.0/core/indexes/index-types/index-text/specify-language-text-index/create-text-index-multiple-languages/
	 */
	@Property({ nullable: false })
	@Index({ name: 'userSearchIndex2', type: 'text', options: { language_override: 'ignore-this-field' } })
	allSearchableStrings!: string[];

	@BeforeCreate()
	public beforeCreate(args: EventArgs<User> & { changeSet: ChangeSet<User> }): void {
		args.entity.allSearchableStrings = buildAllSearchableStringsForUser(
			args.entity.firstName,
			args.entity.lastName,
			args.entity.email
		);
	}

	@BeforeUpdate()
	public beforeUpdate(args: EventArgs<User> & { changeSet: ChangeSet<User> }): void {
		const changedProps = args.changeSet.payload;
		if ('firstName' in changedProps || 'lastName' in changedProps || 'email' in changedProps) {
			args.entity.allSearchableStrings = buildAllSearchableStringsForUser(
				args.entity.firstName,
				args.entity.lastName,
				args.entity.email
			);
		}
	}

	constructor(props: UserProperties) {
		super();
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.preferredName = props.preferredName;
		this.email = props.email;
		this.school = props.school;
		this.secondarySchools = props.secondarySchools || [];
		this.roles.set(props.roles);
		this.ldapDn = props.ldapDn;
		this.externalId = props.externalId;
		this.forcePasswordChange = props.forcePasswordChange;
		this.discoverable = props.discoverable;
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
	}

	public resolvePermissions(
		teacherStudentVisibilityIsConfigurable: boolean,
		teacherStudentVisibilityIsEnabledByDefault: boolean
	): Permission[] {
		if (!this.roles.isInitialized(true)) {
			throw new ReferenceNotPopulatedLoggableException('user', 'roles');
		}

		let permissions: Permission[] = [];

		const roles = this.getRoles();
		roles.forEach((role) => {
			const rolePermissions = role.resolvePermissions();
			permissions = [...permissions, ...rolePermissions];
		});

		const setOfPermissions = this.resolveSchoolPermissions(
			permissions,
			roles,
			teacherStudentVisibilityIsConfigurable,
			teacherStudentVisibilityIsEnabledByDefault
		);

		const uniquePermissions = [...setOfPermissions];

		return uniquePermissions;
	}

	private resolveSchoolPermissions(
		permissions: Permission[],
		roles: Role[],
		teacherStudentVisibilityIsConfigurable: boolean,
		teacherStudentVisibilityIsEnabledByDefault: boolean
	): Set<Permission> {
		if (!wrap(this.school).isInitialized()) {
			throw new ReferenceNotPopulatedLoggableException('user', 'school');
		}

		const schoolPermissions = this.school.permissions;
		let setOfPermissions = new Set(permissions);

		if (roles.some((role) => role.name === RoleName.SUPERHERO || role.name === RoleName.ADMINISTRATOR)) {
			return setOfPermissions;
		}

		if (roles.some((role) => role.name === RoleName.TEACHER)) {
			setOfPermissions = this.resolveSchoolPermissionsForTeacher(
				setOfPermissions,
				teacherStudentVisibilityIsConfigurable,
				teacherStudentVisibilityIsEnabledByDefault,
				schoolPermissions
			);
		}

		return setOfPermissions;
	}

	private resolveSchoolPermissionsForTeacher(
		setOfPermissions: Set<Permission>,
		teacherStudentVisibilityIsConfigurable: boolean,
		teacherStudentVisibilityIsEnabledByDefault: boolean,
		schoolPermissions?: SchoolRoles
	): Set<Permission> {
		if (teacherStudentVisibilityIsConfigurable) {
			if (schoolPermissions?.teacher?.STUDENT_LIST) {
				setOfPermissions.add(Permission.STUDENT_LIST);
			} else {
				setOfPermissions.delete(Permission.STUDENT_LIST);
			}
		} else if (teacherStudentVisibilityIsEnabledByDefault) {
			setOfPermissions.add(Permission.STUDENT_LIST);
		} else {
			setOfPermissions.delete(Permission.STUDENT_LIST);
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
