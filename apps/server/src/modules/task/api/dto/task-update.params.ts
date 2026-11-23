import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { SanitizeHtml } from '@shared/controller/transformer';
import { InputFormat } from '@shared/domain/types';
import { IsBoolean, IsDate, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { TaskUpdate } from '../../domain';

export class TaskUpdateParams implements TaskUpdate {
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

	@IsBoolean()
	@IsOptional()
	@ApiPropertyOptional({ description: 'Whether the task remains a draft.' })
	private?: boolean;

	@IsBoolean()
	@IsOptional()
	@ApiPropertyOptional({ description: 'Whether students can see each other submissions.' })
	publicSubmissions?: boolean;

	@IsBoolean()
	@IsOptional()
	@ApiPropertyOptional({ description: 'Whether students may submit as a group.' })
	teamSubmissions?: boolean;

	@IsInt()
	@Min(2)
	@IsOptional()
	@ApiPropertyOptional({ description: 'Maximum number of members in a submission group.' })
	maxTeamMembers?: number;

	@IsString()
	@IsNotEmpty()
	@SanitizeHtml()
	@ApiProperty({
		description: 'The title of the task',
		required: true,
	})
	name!: string;

	@IsString()
	@IsOptional()
	@SanitizeHtml(InputFormat.RICH_TEXT_CK5_TASK)
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
