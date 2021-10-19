import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';

/**
 * DTO for returning a task document via api.
 */
export class TaskResponse {
	@ApiProperty()
	@DecodeHtmlEntities()
	name: string;

	@ApiProperty()
	availableDate?: Date;

	@ApiProperty()
	duedate?: Date;

	@ApiPropertyOptional()
	@DecodeHtmlEntities()
	courseName?: string;

	@ApiPropertyOptional()
	displayColor?: string;

	@ApiProperty()
	id: string;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;

	@ApiProperty()
	status: {
		submitted?: number;
		maxSubmissions?: number;
		graded?: number;
		isDraft: boolean;
	};
}
