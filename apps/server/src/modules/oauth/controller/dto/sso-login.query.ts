import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SSOLoginQuery {
	@IsOptional()
	@IsString()
	@ApiProperty()
	postLoginRedirect?: string;
}
