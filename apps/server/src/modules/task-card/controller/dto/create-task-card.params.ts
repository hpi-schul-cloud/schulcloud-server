import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { RichText } from '@shared/domain/types/richtext.types';
import { SanitizeHtml } from '@shared/controller';

export class CreateTaskCardParams {
	@IsString()
	@SanitizeHtml()
	@ApiProperty({
		description: 'Title of the card',
		required: true,
	})
	title!: string;

	@IsArray()
	@IsOptional()
	@ApiPropertyOptional({ description: 'Description of the card' })
	text?: RichText[];
}
