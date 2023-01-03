import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class MigrationBody {
	@IsBoolean()
	@ApiProperty({
		description: 'Set if migration is possible in this school',
		required: true,
		nullable: false,
	})
	oauthMigrationPossible!: boolean;

	@IsBoolean()
	@ApiProperty({
		description: 'Set if migration is mandatory in this school',
		required: true,
		nullable: false,
	})
	oauthMigrationMandatory!: boolean;

	@IsBoolean()
	@ApiProperty({
		description: 'Set if migration is finished in this school',
		required: true,
		nullable: false,
	})
	oauthMigrationFinished!: boolean;
}
