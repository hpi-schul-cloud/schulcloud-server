import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Oauth2AuthorizationParams {
	@IsString()
	@ApiProperty()
	redirectUri!: string;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional()
	code!: string;

	@IsMongoId()
	@ApiProperty()
	systemId!: string;
}
