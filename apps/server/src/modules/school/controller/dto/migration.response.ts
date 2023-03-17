import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MigrationResponse {
	@ApiPropertyOptional({
		description: 'Date from when Migration is possible',
		type: Date,
	})
	oauthMigrationPossible?: Date;

	@ApiPropertyOptional({
		description: 'Date from when Migration is mandatory',
		type: Date,
	})
	oauthMigrationMandatory?: Date;

	@ApiPropertyOptional({
		description: 'Date from when Migration is finished',
		type: Date,
	})
	oauthMigrationFinished?: Date;

	@ApiPropertyOptional({
		description: 'Date from when Migration is finally finished and cannot be restarted again',
		type: Date,
	})
	oauthMigrationFinalFinished?: Date;

	@ApiProperty({
		description: 'Enable the Migration',
	})
	enableMigrationStart!: boolean;

	constructor(params: MigrationResponse) {
		this.oauthMigrationPossible = params.oauthMigrationPossible;
		this.oauthMigrationMandatory = params.oauthMigrationMandatory;
		this.oauthMigrationFinished = params.oauthMigrationFinished;
		this.oauthMigrationFinalFinished = params.oauthMigrationFinalFinished;
		this.enableMigrationStart = params.enableMigrationStart;
	}
}
