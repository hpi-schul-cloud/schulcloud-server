import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { InputFormat } from '@shared/domain/types/input-format.types';
import { SanitizeHtml } from '@shared/controller';

export class CreateTaskCardParams {
	@IsString()
	@SanitizeHtml()
	@ApiProperty({
		description: 'Title of the text card',
		required: true,
	})
	title!: string;

	@IsOptional()
	@SanitizeHtml(InputFormat.RICH_TEXT_CK5)
	@ApiPropertyOptional({ description: 'Description of the card' })
	description?: string[];
}
