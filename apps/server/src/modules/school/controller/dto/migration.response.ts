export class MigrationResponse {
	oauthMigrationPossible: Date | undefined;

	oauthMigrationMandatory: Date | undefined;

	oauthMigrationFinished: Date | undefined;

	constructor(params: MigrationResponse) {
		this.oauthMigrationPossible = params.oauthMigrationPossible;
		this.oauthMigrationMandatory = params.oauthMigrationMandatory;
		this.oauthMigrationFinished = params.oauthMigrationFinished;
	}
}
