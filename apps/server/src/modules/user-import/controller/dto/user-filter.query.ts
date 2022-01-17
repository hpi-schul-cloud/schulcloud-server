import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UserFilterQuery {
	/**
	 * full name filter
	 */
	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	name?: string;
}
