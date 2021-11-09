import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaskStatusResponse {
	@ApiPropertyOptional()
	submitted?: number;

	@ApiPropertyOptional()
	maxSubmissions?: number;

	@ApiPropertyOptional()
	graded?: number;

	@ApiProperty()
	isDraft: boolean;

	@ApiProperty()
	isSubstitutionTeacher: boolean;
}
