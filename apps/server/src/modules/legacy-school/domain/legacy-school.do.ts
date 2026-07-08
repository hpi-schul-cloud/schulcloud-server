import { type FileStorageType, type SchoolFeature } from '@modules/school/domain';
import { type FederalStateEntity, type SchoolYearEntity } from '@modules/school/repo';
import { BaseDO } from '@shared/domain/domainobject';
import { type EntityId } from '@shared/domain/types';

/**
 * @deprecated because it extends the deprecated BaseDO.
 */
export class LegacySchoolDo extends BaseDO {
	public externalId?: string;

	public inMaintenanceSince?: Date;

	public inUserMigration?: boolean;

	public previousExternalId?: string;

	public name: string;

	public officialSchoolNumber?: string;

	public systems?: EntityId[];

	public features?: SchoolFeature[];

	// TODO: N21-990 Refactoring: Create domain objects for schoolYear and federalState
	public schoolYear?: SchoolYearEntity;

	public userLoginMigrationId?: EntityId;

	// TODO: N21-990 Refactoring: Create domain objects for schoolYear and federalState
	public federalState: FederalStateEntity;

	public ldapLastSync?: string;

	public storageProvider?: EntityId;

	public fileStorageType?: FileStorageType;

	constructor(params: LegacySchoolDo) {
		super();
		this.id = params.id;
		this.externalId = params.externalId;
		this.features = params.features;
		this.inMaintenanceSince = params.inMaintenanceSince;
		this.inUserMigration = params.inUserMigration;
		this.name = params.name;
		this.previousExternalId = params.previousExternalId;
		this.officialSchoolNumber = params.officialSchoolNumber;
		this.schoolYear = params.schoolYear;
		this.systems = params.systems;
		this.userLoginMigrationId = params.userLoginMigrationId;
		this.federalState = params.federalState;
		this.ldapLastSync = params.ldapLastSync;
		this.storageProvider = params.storageProvider;
		this.fileStorageType = params.fileStorageType;
	}
}
