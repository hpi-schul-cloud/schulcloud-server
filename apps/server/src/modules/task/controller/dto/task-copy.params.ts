import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';

/**
 * DTO for creating a task copy.
 */
export class TaskCopyApiParams {
	@IsOptional()
	@IsMongoId()
	@ApiPropertyOptional({
		pattern: '[a-f0-9]{24}',
		description: 'Destination course parent Id the task is copied to',
	})
	courseId?: string;

	@IsOptional()
	@IsMongoId()
	@ApiPropertyOptional({
		pattern: '[a-f0-9]{24}',
		description: 'Destination lesson parent Id the task is copied to',
	})
	lessonId?: string;
}
