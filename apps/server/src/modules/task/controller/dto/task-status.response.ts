import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaskCardStatusResponse {
	@ApiPropertyOptional({
		description: 'List of users who marked task card as completed',
	})
	completedBy?: string[];

	@ApiPropertyOptional({
		description: 'Returns wether the student completed the task card or not',
	})
	isCompleted?: boolean;
}

export class TaskStatusResponse {
	constructor({
		submitted,
		maxSubmissions,
		graded,
		isDraft,
		isSubstitutionTeacher,
		isFinished,
		taskCard,
	}: TaskStatusResponse) {
		this.submitted = submitted;
		this.maxSubmissions = maxSubmissions;
		this.graded = graded;
		this.isDraft = isDraft;
		this.isSubstitutionTeacher = isSubstitutionTeacher;
		this.isFinished = isFinished;
		this.taskCard = taskCard;
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

	@ApiProperty()
	isFinished: boolean;

	@ApiProperty()
	taskCard: TaskCardStatusResponse;
}
