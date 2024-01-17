import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ChallengeParams {
	@IsString()
	@ApiProperty({
		description: 'The login challenge.',
		required: true,
		nullable: false,
	})
	challenge!: string;
}
