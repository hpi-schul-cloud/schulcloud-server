import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class Oauth2AuthorizationBodyParams {
	@IsString()
	@IsNotEmpty()
	@ApiProperty()
	redirectUri!: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty()
	code!: string;

	@IsMongoId()
	@ApiProperty()
	systemId!: string;
}
