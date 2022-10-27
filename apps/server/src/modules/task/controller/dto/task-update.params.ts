import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsMongoId, IsOptional, IsString } from 'class-validator';
import { SanitizeHtml } from '@shared/controller';
import { dateType } from 'aws-sdk/clients/iam';

export class TaskUpdateParams {
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
	@SanitizeHtml({ keep: 'richtext' })
	@ApiPropertyOptional({
		description: 'The description of the task',
	})
	description?: string;

	@IsDate()
	@ApiPropertyOptional({
		description: 'Date until the task is published',
		type: Date,
	})
	availableDate?: Date;

	@IsDate()
	@ApiPropertyOptional({
		description: 'Date until the task submissions can be sent',
		type: Date,
	})
	dueDate?: Date;
}
