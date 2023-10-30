import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller/transformer/sanitize-html.transformer';
import { InputFormat } from '@shared/domain/types/input-format.types';
import { ITaskUpdate } from '@shared/domain/types/task.types';
import { IsDate, IsMongoId, IsOptional, IsString } from 'class-validator';

export class TaskUpdateParams implements ITaskUpdate {
	@IsString()
	@IsMongoId()
	@IsOptional()
	@ApiPropertyOptional({
		description: 'The id of an course object.',
		pattern: '[a-f0-9]{24}',
		required: true,
		nullable: false,
	})
	courseId?: string;

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
