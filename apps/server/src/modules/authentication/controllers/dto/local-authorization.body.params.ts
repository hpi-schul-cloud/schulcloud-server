import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LocalAuthorizationBodyParams {
	@IsString()
	@IsNotEmpty()
	@ApiProperty()
	username!: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty()
	password!: string;

	@IsOptional()
	@IsBoolean()
	@ApiPropertyOptional()
	createLoginCookies?: boolean
}
