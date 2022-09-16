import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChallengeParams {
	@IsString()
	@ApiProperty({
		description: 'The login challenge.',
		required: true,
		nullable: false,
	})
	challenge!: string;
}
