export class MigrationDto {
	oauthMigrationPossible?: Date;

	oauthMigrationMandatory?: Date;

	oauthMigrationFinished?: Date;

	enableMigrationStart!: boolean;

	constructor(params: MigrationDto) {
		this.oauthMigrationPossible = params.oauthMigrationPossible;
		this.oauthMigrationMandatory = params.oauthMigrationMandatory;
		this.oauthMigrationFinished = params.oauthMigrationFinished;
		this.enableMigrationStart = params.enableMigrationStart;
	}
}
