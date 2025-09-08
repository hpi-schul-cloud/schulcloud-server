import { ApiPropertyOptional } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { IsMongoId, IsOptional } from 'class-validator';

/**
 * DTO for creating a task copy.
 */
export class LessonCopyApiParams {
	@IsOptional()
	@IsMongoId()
	@ApiPropertyOptional({
		pattern: bsonStringPattern,
		description: 'Destination course parent Id the lesson is copied to',
	})
	courseId?: string;
}
