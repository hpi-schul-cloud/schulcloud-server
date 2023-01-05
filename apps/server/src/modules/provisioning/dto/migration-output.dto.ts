export class MigrationOutputDto {
	oauthMigrationPossible!: boolean;

	oauthMigrationMandatory!: boolean;

	constructor(params: MigrationOutputDto) {
		this.oauthMigrationPossible = params.oauthMigrationPossible;
		this.oauthMigrationMandatory = params.oauthMigrationMandatory;
	}
}
