import { BaseDO } from './base.do';
import { SchoolFeatures } from '../entity/school.entity';
import { SchoolYear } from '../entity/schoolyear.entity';

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
