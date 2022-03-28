import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FilterUserParams {
	/**
	 * filter firstname or lastname for given value
	 */
	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	name?: string;
}
