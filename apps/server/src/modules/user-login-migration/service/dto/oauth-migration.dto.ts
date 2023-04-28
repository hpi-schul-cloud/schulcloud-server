export class OauthMigrationDto {
	oauthMigrationPossible?: Date;

	oauthMigrationMandatory?: Date;

	oauthMigrationFinished?: Date;

	oauthMigrationFinalFinish?: Date;

	enableMigrationStart!: boolean;

	constructor(params: OauthMigrationDto) {
		this.oauthMigrationPossible = params.oauthMigrationPossible;
		this.oauthMigrationMandatory = params.oauthMigrationMandatory;
		this.oauthMigrationFinished = params.oauthMigrationFinished;
		this.oauthMigrationFinalFinish = params.oauthMigrationFinalFinish;
		this.enableMigrationStart = params.enableMigrationStart;
	}
}
