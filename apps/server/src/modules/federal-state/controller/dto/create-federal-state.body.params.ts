import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, ValidateNested } from 'class-validator';
import { SanitizeHtml } from '@shared/controller';
import { Type } from 'class-transformer';
import { CreateCountyBodyParams } from './create-county.body.params';
/**
 * DTO for creating a news document.
 */

// TODO: Add County to Federal State
export class CreateFederalStateBodyParams {
	@IsString()
	@SanitizeHtml()
	@ApiProperty({
		description: 'Title of the Federal State entity',
	})
	name!: string;

	@IsString()
	@SanitizeHtml()
	@ApiProperty({
		description: 'Abbreviation of the Federal State',
	})
	abbreviation!: string;

	@IsString()
	@SanitizeHtml()
	@ApiProperty({
		description: 'Link to the logo of the Federal State',
	})
	logoUrl!: string;

	@ValidateNested({ each: true })
	@Type(() => CreateCountyBodyParams)
	@ApiPropertyOptional({
		description: 'Counties of the Federal State',
		required: false,
	})
	counties?: CreateCountyBodyParams[];
}
