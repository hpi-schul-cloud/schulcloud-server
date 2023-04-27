import { SchoolFeatures, SchoolYear } from '../entity';
import { EntityId } from '../types';
import { BaseDO } from './base.do';

export class SchoolDO extends BaseDO {
	externalId?: string;

	inMaintenanceSince?: Date;

	inUserMigration?: boolean;

	/**
	 * The start date of the current oauth migration
	 * @param oauthMigrationStart
	 */
	oauthMigrationStart?: Date;

	/**
	 * The last (re)start date of the current oauth migration
	 * @param oauthMigrationPossible
	 */
	oauthMigrationPossible?: Date;

	/**
	 * The last date, when the current oauth migration has been made mandatory
	 * @param oauthMigrationMandatory
	 */
	oauthMigrationMandatory?: Date;

	/**
	 * The last date, when the current oauth migration has been completed
	 * @param oauthMigrationFinished
	 */
	oauthMigrationFinished?: Date;

	oauthMigrationFinalFinish?: Date;

	previousExternalId?: string;

	name: string;

	officialSchoolNumber?: string;

	systems?: EntityId[];

	features?: SchoolFeatures[];

	schoolYear?: SchoolYear;

	userLoginMigrationId?: EntityId;

	constructor(params: SchoolDO) {
		super();
		this.id = params.id;
		this.externalId = params.externalId;
		this.features = params.features;
		this.inMaintenanceSince = params.inMaintenanceSince;
		this.inUserMigration = params.inUserMigration;
		this.name = params.name;
		this.oauthMigrationStart = params.oauthMigrationStart;
		this.oauthMigrationMandatory = params.oauthMigrationMandatory;
		this.oauthMigrationPossible = params.oauthMigrationPossible;
		this.oauthMigrationFinished = params.oauthMigrationFinished;
		this.oauthMigrationFinalFinish = params.oauthMigrationFinalFinish;
		this.previousExternalId = params.previousExternalId;
		this.officialSchoolNumber = params.officialSchoolNumber;
		this.schoolYear = params.schoolYear;
		this.systems = params.systems;
		this.userLoginMigrationId = params.userLoginMigrationId;
	}
}
