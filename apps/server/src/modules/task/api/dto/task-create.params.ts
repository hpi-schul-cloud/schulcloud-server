import { TaskCreate } from '@modules/task';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { SanitizeHtml } from '@shared/controller/transformer';
import { InputFormat } from '@shared/domain/types';
import { IsDate, IsMongoId, IsOptional, IsString } from 'class-validator';

export class TaskCreateParams implements TaskCreate {
	@IsString()
	@IsMongoId()
	@IsOptional()
	@ApiPropertyOptional({
		description: 'The id of an course object.',
		pattern: bsonStringPattern,
		required: true,
		nullable: false,
	})
	courseId?: string;

	@IsString()
	@IsMongoId()
	@IsOptional()
	@ApiPropertyOptional({
		description: 'The id of an lesson object.',
		pattern: bsonStringPattern,
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
