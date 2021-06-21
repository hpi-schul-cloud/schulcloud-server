import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsOptional, IsString } from 'class-validator';

/**
 * DTO for Updating a news document.
 * A PartialType is a halper which allows to extend an existing class by making all its properties optional.
 */
export class UpdateNewsParams {
	@IsOptional()
	@IsString()
	@ApiPropertyOptional({
		description: 'Title of the News entity',
	})
	title: string;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional({
		description: 'Content of the News entity',
	})
	content: string;

	@IsOptional()
	@IsDate()
	@ApiPropertyOptional({
		description: 'The point in time from when the News entity schould be displayed',
	})
	displayAt: Date;
}
