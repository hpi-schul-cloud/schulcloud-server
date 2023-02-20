import { SchoolFeatures, SchoolYear } from '../entity';
import { BaseDO } from './base.do';

export class SchoolDO extends BaseDO {
	externalId?: string;

	inMaintenanceSince?: Date;

	inUserMigration?: boolean;

	oauthMigrationPossible?: Date;

	oauthMigrationMandatory?: Date;

	oauthMigrationFinished?: Date;

	name: string;

	officialSchoolNumber?: string;

	systems?: string[];

	features?: SchoolFeatures[];

	schoolYear?: SchoolYear;

	constructor(params: SchoolDO) {
		super();
		this.id = params.id;
		this.externalId = params.externalId;
		this.features = params.features;
		this.inMaintenanceSince = params.inMaintenanceSince;
		this.inUserMigration = params.inUserMigration;
		this.name = params.name;
		this.oauthMigrationMandatory = params.oauthMigrationMandatory;
		this.oauthMigrationPossible = params.oauthMigrationPossible;
		this.oauthMigrationFinished = params.oauthMigrationFinished;
		this.officialSchoolNumber = params.officialSchoolNumber;
		this.schoolYear = params.schoolYear;
		this.systems = params.systems;
	}
}
