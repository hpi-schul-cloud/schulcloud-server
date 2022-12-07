import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { InputFormat } from '@shared/domain';
import { SanitizeHtml } from '@shared/controller';

export class CreateTaskCardParams {
	@IsString()
	@SanitizeHtml()
	@ApiProperty({
		description: 'Title of the text card',
	})
	title!: string;

	// sanitize happens in RichText class itself
	@ApiProperty({
		description: 'Description of the card',
	})
	@IsOptional()
	@ApiPropertyOptional()
	@SanitizeHtml(InputFormat.RICH_TEXT_CK5_SIMPLE)
	description?: string[];
}
