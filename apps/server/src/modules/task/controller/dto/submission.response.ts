import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';

/**
 * DTO for returning a submission document via api.
 */
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

export class SubmissionStatusListResponse extends PaginationResponse<SubmissionStatusResponse[]> {
	constructor(data: SubmissionStatusResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [SubmissionStatusResponse] })
	data: SubmissionStatusResponse[];
}
