import { Submission } from '@shared/domain';
import { SubmissionStatusResponse } from '../controller/dto';

export class SubmissionMapper {
	static mapToStatusResponse(submission: Submission): SubmissionStatusResponse {
		const dto = new SubmissionStatusResponse({
			id: submission.id,
			creatorId: submission.student.id,
			isSubmitted: submission.isSubmitted(),
			grade: submission.grade,
		});

		return dto;
	}
}
