import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';

/**
 * DTO for returning a submission document via api.
 */
export class SubmissionResponse {
	constructor({
		id,
		taskId,
		creatorId,
		submittingCourseGroupId,
		submittingTeamMembers,
		comment,
		submissionFiles,
		grade,
		gradeComment,
		gradeFiles,
	}: SubmissionResponse) {
		this.id = id;
		this.taskId = taskId;
		this.creatorId = creatorId;
		this.submittingCourseGroupId = submittingCourseGroupId;
		this.submittingTeamMembers = submittingTeamMembers;
		this.comment = comment;
		this.submissionFiles = submissionFiles;
		this.grade = grade;
		this.gradeComment = gradeComment;
		this.gradeFiles = gradeFiles;
	}

	@ApiProperty()
	id: string;

	@ApiProperty()
	taskId: string;

	@ApiProperty()
	creatorId: string;

	@ApiPropertyOptional()
	submittingCourseGroupId?: string;

	@ApiPropertyOptional()
	submittingTeamMembers?: string[];

	@ApiPropertyOptional()
	comment?: string;

	@ApiProperty()
	submissionFiles: string[];

	@ApiPropertyOptional()
	grade?: number;

	@ApiPropertyOptional()
	gradeComment?: string;

	@ApiProperty()
	gradeFiles: string[];
}

export class SubmissionListResponse extends PaginationResponse<SubmissionResponse[]> {
	constructor(data: SubmissionResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [SubmissionResponse] })
	data: SubmissionResponse[];
}
