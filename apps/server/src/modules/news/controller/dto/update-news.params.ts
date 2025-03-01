import { ApiPropertyOptional } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller/transformer';
import { InputFormat } from '@shared/domain/types';
import { IsDate, IsOptional, IsString } from 'class-validator';

/**
 * DTO for Updating a news document.
 * A PartialType is a halper which allows to extend an existing class by making all its properties optional.
 */
export class UpdateNewsParams {
	@IsOptional()
	@IsString()
	@SanitizeHtml()
	@ApiPropertyOptional({
		description: 'Title of the News entity',
	})
	title!: string;

	@IsOptional()
	@IsString()
	@SanitizeHtml(InputFormat.RICH_TEXT_CK5_SIMPLE)
	@ApiPropertyOptional({
		description: 'Content of the News entity',
	})
	content!: string;

	@IsOptional()
	@IsDate()
	@ApiPropertyOptional({
		description: 'The point in time from when the News entity schould be displayed',
	})
	displayAt!: Date;
}
