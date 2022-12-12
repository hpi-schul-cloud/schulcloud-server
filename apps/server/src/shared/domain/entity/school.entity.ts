import { Collection, Embeddable, Embedded, Entity, Index, ManyToMany, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { SchoolYear } from './schoolyear.entity';
import { System } from './system.entity';

export enum SchoolFeatures {
	ROCKET_CHAT = 'rocketChat',
	VIDEOCONFERENCE = 'videoconference',
	NEXTCLOUD = 'nextcloud',
	MESSENGER = 'messenger',
	STUDENTVISIBILITY = 'studentVisibility', // deprecated
	MESSENGER_SCHOOL_ROOM = 'messengerSchoolRoom',
	MESSENGER_STUDENT_ROOM_CREATE = 'messengerStudentRoomCreate',
	LDAP_UNIVENTION_MIGRATION = 'ldapUniventionMigrationSchool',
}

export interface ISchoolProperties {
	_id?: string;
	externalId?: string;
	inMaintenanceSince?: Date;
	inUserMigration?: boolean;
	oauthMigrationPossible?: boolean;
	oauthMigrationMandatory?: boolean;
	name: string;
	officialSchoolNumber?: string;
	systems?: System[];
	features?: SchoolFeatures[];
	schoolYear?: SchoolYear;
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

	@Property({ nullable: true })
	oauthMigrationPossible?: boolean;

	@Property({ nullable: true })
	oauthMigrationMandatory?: boolean;

	@Property({ nullable: true, fieldName: 'ldapSchoolIdentifier' })
	externalId?: string;

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

	constructor(props: ISchoolProperties) {
		super();
		if (props.externalId) this.externalId = props.externalId;
		if (props.inMaintenanceSince) this.inMaintenanceSince = props.inMaintenanceSince;
		if (props.inUserMigration !== null) this.inUserMigration = props.inUserMigration;
		if (props.oauthMigrationPossible !== null) this.oauthMigrationPossible = props.oauthMigrationPossible;
		if (props.oauthMigrationMandatory !== null) this.oauthMigrationMandatory = props.oauthMigrationMandatory;
		this.name = props.name;
		if (props.officialSchoolNumber) this.officialSchoolNumber = props.officialSchoolNumber;
		if (props.systems) this.systems.set(props.systems);
		if (props.features) this.features = props.features;
		if (props.schoolYear) this.schoolYear = props.schoolYear;
	}
}
