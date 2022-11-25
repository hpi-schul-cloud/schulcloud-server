import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmissionStatusResponse {
	constructor({ id, creatorId, grade }: SubmissionStatusResponse) {
		this.id = id;
		this.creatorId = creatorId;
		this.grade = grade;
	}

	@ApiProperty()
	id: string;

	@ApiProperty()
	creatorId: string;

	@ApiPropertyOptional()
	grade?: number;
}

export class SubmissionStatusListResponse {
	constructor(data: SubmissionStatusResponse[]) {
		this.data = data;
	}

	@ApiProperty({ type: [SubmissionStatusResponse] })
	data: SubmissionStatusResponse[];
}
