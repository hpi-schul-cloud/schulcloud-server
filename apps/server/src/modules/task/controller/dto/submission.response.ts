import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmissionStatusResponse {
	constructor({ id, submitters, isSubmitted, grade, isGraded }: SubmissionStatusResponse) {
		this.id = id;
		this.submitters = submitters;
		this.isSubmitted = isSubmitted;
		this.grade = grade;
		this.isGraded = isGraded;
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
}

export class SubmissionStatusListResponse {
	constructor(data: SubmissionStatusResponse[]) {
		this.data = data;
	}

	@ApiProperty({ type: [SubmissionStatusResponse] })
	data: SubmissionStatusResponse[];
}
