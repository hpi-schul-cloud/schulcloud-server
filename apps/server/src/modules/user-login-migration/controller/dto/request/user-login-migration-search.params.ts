import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UserLoginMigrationSearchParams {
	@ApiPropertyOptional()
	@IsString()
	@IsOptional()
	userId?: string;
}
