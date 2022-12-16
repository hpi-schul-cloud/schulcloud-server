import { IsDate } from 'class-validator';

export class MigrationResponse {
	@IsDate()
	oauthMigrationPossible: Date | undefined;

	@IsDate()
	oauthMigrationMandatory: Date | undefined;

	@IsDate()
	oauthMigrationFinished: Date | undefined;

	enableMigrationStart!: boolean;

	constructor(params: MigrationResponse) {
		this.oauthMigrationPossible = params.oauthMigrationPossible;
		this.oauthMigrationMandatory = params.oauthMigrationMandatory;
		this.oauthMigrationFinished = params.oauthMigrationFinished;
		this.enableMigrationStart = params.enableMigrationStart;
	}
}
