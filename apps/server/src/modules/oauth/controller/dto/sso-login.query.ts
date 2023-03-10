import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class SSOLoginQuery {
	@IsOptional()
	@IsString()
	@ApiProperty()
	postLoginRedirect?: string;

	@IsOptional()
	@IsBoolean()
	@ApiProperty()
	migration?: boolean;
}
