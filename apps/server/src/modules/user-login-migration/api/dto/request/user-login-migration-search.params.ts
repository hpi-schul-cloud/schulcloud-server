import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UserLoginMigrationSearchParams {
	@ApiPropertyOptional()
	@IsString()
	@IsOptional()
	userId?: string;
}
