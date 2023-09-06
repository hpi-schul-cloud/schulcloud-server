import {
	Collection,
	Embeddable,
	Embedded,
	Entity,
	Index,
	ManyToMany,
	ManyToOne,
	OneToOne,
	Property,
} from '@mikro-orm/core';
import { UserLoginMigration } from '@shared/domain/entity/user-login-migration.entity';
import { BaseEntity } from './base.entity';
import { SchoolYear } from './schoolyear.entity';
import { System } from './system.entity';
import { FederalStateEntity } from '../../../modules/federal-state/entity/federal-state.entity';

export enum SchoolFeatures {
	ROCKET_CHAT = 'rocketChat',
	VIDEOCONFERENCE = 'videoconference',
	NEXTCLOUD = 'nextcloud',
	STUDENTVISIBILITY = 'studentVisibility', // deprecated
	LDAP_UNIVENTION_MIGRATION = 'ldapUniventionMigrationSchool',
	OAUTH_PROVISIONING_ENABLED = 'oauthProvisioningEnabled',
	SHOW_OUTDATED_USERS = 'showOutdatedUsers',
	ENABLE_LDAP_SYNC_DURING_MIGRATION = 'enableLdapSyncDuringMigration',
}

export interface ISchoolProperties {
	_id?: string;
	externalId?: string;
	inMaintenanceSince?: Date;
	inUserMigration?: boolean;
	previousExternalId?: string;
	name: string;
	officialSchoolNumber?: string;
	systems?: System[];
	features?: SchoolFeatures[];
	schoolYear?: SchoolYear;
	userLoginMigration?: UserLoginMigration;
	federalState: FederalStateEntity;
}

@Embeddable()
export class SchoolRolePermission {
	@Property({ nullable: true })
	STUDENT_LIST?: boolean;

	@Property({ nullable: true })
	LERNSTORE_VIEW?: boolean;
}

@Embeddable()
export class SchoolRoles {
	@Property({ nullable: true, fieldName: 'student' })
	student?: SchoolRolePermission;

	@Property({ nullable: true, fieldName: 'teacher' })
	teacher?: SchoolRolePermission;
}

@Entity({ tableName: 'schools' })
@Index({ properties: ['externalId', 'systems'] })
export class School extends BaseEntity {
	@Property({ nullable: true })
	features?: SchoolFeatures[];

	@Property({ nullable: true })
	inMaintenanceSince?: Date;

	@Property({ nullable: true })
	inUserMigration?: boolean;

	@Property({ nullable: true, fieldName: 'ldapSchoolIdentifier' })
	externalId?: string;

	@Property({ nullable: true })
	previousExternalId?: string;

	@Property()
	name: string;

	@Property({ nullable: true })
	officialSchoolNumber?: string;

	@ManyToMany('System', undefined, { fieldName: 'systems' })
	systems = new Collection<System>(this);

	@Embedded(() => SchoolRoles, { object: true, nullable: true, prefix: false })
	permissions?: SchoolRoles;

	@ManyToOne('SchoolYear', { fieldName: 'currentYear', nullable: true })
	schoolYear?: SchoolYear;

	@OneToOne(() => UserLoginMigration, (userLoginMigration: UserLoginMigration) => userLoginMigration.school, {
		orphanRemoval: true,
		nullable: true,
		fieldName: 'userLoginMigrationId',
	})
	userLoginMigration?: UserLoginMigration;

	@ManyToOne(() => FederalStateEntity, { fieldName: 'federalState', nullable: false })
	federalState: FederalStateEntity;

	constructor(props: ISchoolProperties) {
		super();
		if (props.externalId) {
			this.externalId = props.externalId;
		}
		if (props.previousExternalId) {
			this.previousExternalId = props.previousExternalId;
		}
		this.inMaintenanceSince = props.inMaintenanceSince;
		if (props.inUserMigration !== null) {
			this.inUserMigration = props.inUserMigration;
		}
		this.name = props.name;
		if (props.officialSchoolNumber) {
			this.officialSchoolNumber = props.officialSchoolNumber;
		}
		if (props.systems) {
			this.systems.set(props.systems);
		}
		if (props.features) {
			this.features = props.features;
		}
		if (props.schoolYear) {
			this.schoolYear = props.schoolYear;
		}
		if (props.userLoginMigration) {
			this.userLoginMigration = props.userLoginMigration;
		}
		this.federalState = props.federalState;
	}
}
