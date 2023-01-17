export class OauthMigrationDto {
	oauthMigrationPossible?: Date;

	oauthMigrationMandatory?: Date;

	oauthMigrationFinished?: Date;

	enableMigrationStart!: boolean;

	constructor(params: OauthMigrationDto) {
		this.oauthMigrationPossible = params.oauthMigrationPossible;
		this.oauthMigrationMandatory = params.oauthMigrationMandatory;
		this.oauthMigrationFinished = params.oauthMigrationFinished;
		this.enableMigrationStart = params.enableMigrationStart;
	}
}
