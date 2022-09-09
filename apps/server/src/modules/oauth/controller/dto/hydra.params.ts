import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HydraParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the ltiTool.',
		required: true,
		nullable: false,
	})
	oauthClientId!: string;
}
