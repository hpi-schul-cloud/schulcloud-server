import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller';
import { IsArray, IsDate, IsOptional, IsString, MinDate } from 'class-validator';

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
	@MinDate(new Date())
	@ApiPropertyOptional({ description: 'Visible at date of the card' })
	visibleAtDate?: Date;

	@IsOptional()
	@IsDate()
	@MinDate(new Date())
	@ApiPropertyOptional({ description: 'Due date of the card' })
	dueDate?: Date;
}
