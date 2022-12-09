import { BaseDO } from './base.do';
import { SchoolFeatures, SchoolYear, System } from '../entity';

export class SchoolDO extends BaseDO {
	externalId?: string;

	inMaintenanceSince?: Date;

	inUserMigration?: boolean;

	oauthMigrationPossible?: boolean;

	oauthMigrationMandatory?: boolean;

	name: string;

	officialSchoolNumber?: string;

	systems?: string[];

	features?: SchoolFeatures[];

	schoolYear?: SchoolYear;

	constructor(params: SchoolDO) {
		super();
		this.externalId = params.externalId;
		this.features = params.features;
		this.inMaintenanceSince = params.inMaintenanceSince;
		this.inUserMigration = params.inUserMigration;
		this.name = params.name;
		this.oauthMigrationMandatory = params.oauthMigrationMandatory;
		this.oauthMigrationPossible = params.oauthMigrationPossible;
		this.officialSchoolNumber = params.officialSchoolNumber;
		this.schoolYear = params.schoolYear;
		this.systems = params.systems;
	}
}
