import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';

/**
 * DTO for creating a task copy.
 */
export class LessonCopyApiParams {
	@IsOptional()
	@IsMongoId()
	@ApiPropertyOptional({
		pattern: '[a-f0-9]{24}',
		description: 'Destination course parent Id the lesson is copied to',
	})
	courseId?: string;
}
