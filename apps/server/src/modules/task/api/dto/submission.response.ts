import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmissionStatusResponse {
	constructor({ id, submitters, isSubmitted, grade, isGraded, submittingCourseGroupName }: SubmissionStatusResponse) {
		this.id = id;
		this.submitters = submitters;
		this.isSubmitted = isSubmitted;
		this.grade = grade;
		this.isGraded = isGraded;
		this.submittingCourseGroupName = submittingCourseGroupName;
	}

	@ApiProperty()
	id: string;

	@ApiProperty()
	submitters: string[];

	@ApiProperty()
	isSubmitted: boolean;

	@ApiPropertyOptional()
	grade?: number;

	@ApiProperty()
	isGraded: boolean;

	@ApiPropertyOptional()
	submittingCourseGroupName?: string;
}

export class SubmissionStatusListResponse {
	constructor(data: SubmissionStatusResponse[]) {
		this.data = data;
	}

	@ApiProperty({ type: [SubmissionStatusResponse] })
	data: SubmissionStatusResponse[];
}
