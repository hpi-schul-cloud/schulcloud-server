import { FederalState, SchoolFeatures, SchoolYear } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { BaseDO } from './base.do';

/**
 * @deprecated because it extends the deprecated BaseDO.
 */
export class LegacySchoolDo extends BaseDO {
	externalId?: string;

	inMaintenanceSince?: Date;

	inUserMigration?: boolean;

	previousExternalId?: string;

	name: string;

	officialSchoolNumber?: string;

	systems?: EntityId[];

	features?: SchoolFeatures[];

	// TODO: N21-990 Refactoring: Create domain objects for schoolYear and federalState
	schoolYear?: SchoolYear;

	userLoginMigrationId?: EntityId;

	// TODO: N21-990 Refactoring: Create domain objects for schoolYear and federalState
	federalState: FederalState;

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
	}
}
