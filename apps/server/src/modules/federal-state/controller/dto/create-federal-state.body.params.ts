import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { SanitizeHtml } from '@shared/controller';

/**
 * DTO for creating a news document.
 */
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
}
