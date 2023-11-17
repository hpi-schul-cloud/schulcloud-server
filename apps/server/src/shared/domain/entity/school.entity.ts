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
import { UserLoginMigrationEntity } from '@shared/domain/entity/user-login-migration.entity';
import { SchoolFeature, SchoolPurpose } from '@src/modules/school/domain/type';
import { FileStorageType } from '@src/modules/school/domain/type/file-storage-type.enum';
import { BaseEntityWithTimestamps } from './base.entity';
import { CountyEmbeddable, FederalStateEntity } from './federal-state.entity';
import { SchoolYearEntity } from './schoolyear.entity';
import { SystemEntity } from './system.entity';

export interface ISchoolProperties {
	_id?: string;
	externalId?: string;
	inMaintenanceSince?: Date;
	inUserMigration?: boolean;
	previousExternalId?: string;
	name: string;
	officialSchoolNumber?: string;
	systems?: SystemEntity[];
	features?: SchoolFeature[];
	currentYear?: SchoolYearEntity;
	userLoginMigration?: UserLoginMigrationEntity;
	federalState: FederalStateEntity;
	county?: CountyEmbeddable;
	purpose?: SchoolPurpose;
	enableStudentTeamCreation?: boolean;
	logo_dataUrl?: string;
	fileStorageType?: FileStorageType;
	language?: string;
	timezone?: string;
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
export class SchoolEntity extends BaseEntityWithTimestamps {
	@Property({ nullable: true })
	features?: SchoolFeature[];

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

	@ManyToMany(() => SystemEntity)
	systems = new Collection<SystemEntity>(this);

	@Embedded(() => SchoolRoles, { object: true, nullable: true, prefix: false })
	permissions?: SchoolRoles;

	@ManyToOne(() => SchoolYearEntity, { nullable: true })
	currentYear?: SchoolYearEntity;

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

	@ManyToOne(() => FederalStateEntity)
	federalState: FederalStateEntity;

	@Property({ nullable: true })
	county?: CountyEmbeddable;

	@Property({ nullable: true })
	purpose?: SchoolPurpose;

	@Property({ nullable: true })
	enableStudentTeamCreation?: boolean;

	@Property({ nullable: true })
	logo_dataUrl?: string;

	@Property({ nullable: true })
	fileStorageType?: FileStorageType;

	@Property({ nullable: true })
	language?: string;

	@Property({ nullable: true })
	timezone?: string;

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
		if (props.currentYear) {
			this.currentYear = props.currentYear;
		}
		if (props.userLoginMigration) {
			this.userLoginMigration = props.userLoginMigration;
		}
		this.federalState = props.federalState;

		if (props.purpose) {
			this.purpose = props.purpose;
		}

		if (props.fileStorageType) {
			this.fileStorageType = props.fileStorageType;
		}

		if (props.language) {
			this.language = props.language;
		}

		if (props.timezone) {
			this.timezone = props.timezone;
		}
	}
}
