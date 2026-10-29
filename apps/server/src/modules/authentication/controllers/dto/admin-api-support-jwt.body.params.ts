import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class AdminApiSupportJwtBodyParams {
	@ApiProperty({ description: 'User ID for which to create the support JWT.' })
	@IsMongoId()
	userId!: string;

	@ApiProperty({ description: 'Superhero support user requesting the token.' })
	@IsMongoId()
	supportUserId!: string;
}
