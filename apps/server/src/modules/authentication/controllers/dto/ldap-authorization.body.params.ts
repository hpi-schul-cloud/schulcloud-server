import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LdapAuthorizationBodyParams {
	@IsMongoId()
	@ApiProperty()
	systemId!: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty()
	username!: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty()
	password!: string;

	@IsMongoId()
	@ApiProperty()
	schoolId!: string;

	@IsOptional()
	@IsBoolean()
	@ApiPropertyOptional()
	createLoginCookies?: boolean
}
