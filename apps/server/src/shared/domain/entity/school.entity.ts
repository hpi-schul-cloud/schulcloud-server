import { Embeddable, Embedded, Entity, Index, ManyToOne, OneToOne, Property } from '@mikro-orm/core';
import { UserLoginMigrationEntity } from '@shared/domain/entity/user-login-migration.entity';
import { ObjectId } from 'bson';
import { EntityId } from '../types';
import { BaseEntity } from './base.entity';
import { FederalStateEntity } from './federal-state.entity';
import { SchoolYearEntity } from './schoolyear.entity';
import { SystemEntity } from './system.entity';

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
	systems?: SystemEntity[];
	features?: SchoolFeatures[];
	schoolYear?: SchoolYearEntity;
	userLoginMigration?: UserLoginMigrationEntity;
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
@Index({ properties: ['externalId', '_systems'] })
export class SchoolEntity extends BaseEntity {
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

	@Property({ fieldName: 'systems' })
	_systems: ObjectId[] = [];

	get systems() {
		return this._systems.map((s) => s.toHexString());
	}

	set systems(systemIds: EntityId[]) {
		this._systems = systemIds.map((sid) => new ObjectId(sid));
	}

	// @ManyToMany(() => SystemEntity, undefined, { fieldName: 'systems' })
	// systems = new Collection<SystemEntity>(this);

	@Embedded(() => SchoolRoles, { object: true, nullable: true, prefix: false })
	permissions?: SchoolRoles;

	@ManyToOne(() => SchoolYearEntity, { fieldName: 'currentYear', nullable: true })
	schoolYear?: SchoolYearEntity;

	@OneToOne(
		() => UserLoginMigrationEntity,
		(userLoginMigration: UserLoginMigrationEntity) => userLoginMigration.school,
		{
			orphanRemoval: true,
			nullable: true,
			fieldName: 'userLoginMigrationId',
		}
	)
	userLoginMigration?: UserLoginMigrationEntity;

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
			this.systems = props.systems.map((s) => s.id);
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
