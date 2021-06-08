import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDate, IsOptional, IsString } from 'class-validator';

/**
 * DTO for Updating a news document.
 * A PartialType is a halper which allows to extend an existing class by making all its properties optional.
 */
export class UpdateNewsParams {
	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	title: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	body: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsDate()
	displayAt: Date;
}
