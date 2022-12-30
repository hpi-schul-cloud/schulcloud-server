import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { SanitizeHtml } from '@shared/controller';

// TODO make this more like the update params - specify the input format type
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
	@ApiPropertyOptional({ description: 'Description of the card (ck5)' })
	text?: string[];
}
