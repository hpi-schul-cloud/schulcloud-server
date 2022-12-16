export class MigrationResponse {
	oauthMigrationPossible!: boolean;

	oauthMigrationMandatory!: boolean;

	enableMigrationStart!: boolean;

	constructor(params: MigrationResponse) {
		this.oauthMigrationPossible = params.oauthMigrationPossible;
		this.oauthMigrationMandatory = params.oauthMigrationMandatory;
		this.enableMigrationStart = params.enableMigrationStart;
	}
}
