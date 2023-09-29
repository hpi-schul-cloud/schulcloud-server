import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class MigrationBody {
	@IsBoolean()
	@IsOptional()
	@ApiProperty({
		description: 'Set if migration is possible in this school',
		required: false,
		nullable: true,
	})
	oauthMigrationPossible?: boolean;

	@IsBoolean()
	@IsOptional()
	@ApiProperty({
		description: 'Set if migration is mandatory in this school',
		required: false,
		nullable: true,
	})
	oauthMigrationMandatory?: boolean;

	@IsBoolean()
	@IsOptional()
	@ApiProperty({
		description: 'Set if migration is finished in this school',
		required: false,
		nullable: true,
	})
	oauthMigrationFinished?: boolean;
}
