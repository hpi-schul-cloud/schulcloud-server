import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller';
import { IsArray, IsDate, IsOptional, IsString } from 'class-validator';

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

	@IsOptional()
	@IsDate()
	@ApiPropertyOptional({ description: 'Completion date of the card' })
	completionDate?: Date;
}
