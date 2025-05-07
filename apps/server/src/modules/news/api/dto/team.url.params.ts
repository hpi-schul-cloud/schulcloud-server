import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class TeamUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the team.',
		required: true,
		nullable: false,
	})
	teamId!: string;
}
