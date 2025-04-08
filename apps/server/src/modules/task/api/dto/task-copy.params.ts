import { ApiPropertyOptional } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { IsMongoId, IsOptional } from 'class-validator';

/**
 * DTO for creating a task copy.
 */
export class TaskCopyApiParams {
	@IsOptional()
	@IsMongoId()
	@ApiPropertyOptional({
		pattern: bsonStringPattern,
		description: 'Destination course parent Id the task is copied to',
	})
	courseId?: string;

	@IsOptional()
	@IsMongoId()
	@ApiPropertyOptional({
		pattern: bsonStringPattern,
		description: 'Destination lesson parent Id the task is copied to',
	})
	lessonId?: string;
}
