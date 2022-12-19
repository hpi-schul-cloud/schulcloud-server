import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { SanitizeHtml } from '@shared/controller';

export class CreateTaskCardParams {
	@IsString()
	@SanitizeHtml()
	@ApiProperty({
		description: 'Title of the card',
		required: true,
	})
	title!: string;

	@IsOptional()
	@IsArray()
	@ApiPropertyOptional({ description: 'Description of the card' })
	text?: string[];
}
