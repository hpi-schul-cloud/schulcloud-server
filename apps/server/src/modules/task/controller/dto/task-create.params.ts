import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsMongoId, IsOptional, IsString } from 'class-validator';
import { InputFormat, ITaskCreate } from '@shared/domain';
import { SanitizeHtml } from '@shared/controller';

export class TaskCreateParams implements ITaskCreate {
	@IsString()
	@IsMongoId()
	@ApiProperty({
		description: 'The id of an course object.',
		pattern: '[a-f0-9]{24}',
		required: true,
		nullable: false,
	})
	courseId!: string;

	@IsString()
	@IsMongoId()
	@IsOptional()
	@ApiPropertyOptional({
		description: 'The id of an lesson object.',
		pattern: '[a-f0-9]{24}',
	})
	lessonId?: string;

	@IsString()
	@SanitizeHtml()
	@ApiProperty({
		description: 'The title of the task',
		required: true,
	})
	name!: string;

	@IsString()
	@IsOptional()
	@SanitizeHtml(InputFormat.RICH_TEXT_CK5)
	@ApiPropertyOptional({
		description: 'The description of the task',
	})
	description?: string;

	@IsDate()
	@IsOptional()
	@ApiPropertyOptional({
		description: 'Date since the task is published',
		type: Date,
	})
	availableDate?: Date;

	@IsDate()
	@IsOptional()
	@ApiPropertyOptional({
		description: 'Date until the task submissions can be sent',
		type: Date,
	})
	dueDate?: Date;
}
