import { ApiProperty } from '@nestjs/swagger';

export class TaskStatusResponse {
	@ApiProperty()
	submitted: number;

	@ApiProperty()
	maxSubmissions: number;

	@ApiProperty()
	graded: number;

	@ApiProperty()
	isDraft: boolean;

	@ApiProperty()
	isSubstitutionTeacher: boolean;
}
