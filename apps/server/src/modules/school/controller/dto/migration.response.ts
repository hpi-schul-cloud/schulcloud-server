export class MigrationResponse {
	oauthMigrationPossible!: boolean;

	oauthMigrationMandatory!: boolean;

	constructor(params: MigrationResponse) {
		this.oauthMigrationPossible = params.oauthMigrationPossible;
		this.oauthMigrationMandatory = params.oauthMigrationMandatory;
	}
}
