import { ApiProperty } from '@nestjs/swagger';

export class TaskStatusResponse {
	constructor({ submitted, maxSubmissions, graded, isDraft, isSubstitutionTeacher }: TaskStatusResponse) {
		this.submitted = submitted;
		this.maxSubmissions = maxSubmissions;
		this.graded = graded;
		this.isDraft = isDraft;
		this.isSubstitutionTeacher = isSubstitutionTeacher;
	}

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
