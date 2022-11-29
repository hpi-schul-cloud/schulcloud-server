import { Submission } from '@shared/domain';
import { SubmissionStatusResponse } from '../controller/dto';

export class SubmissionMapper {
	static mapToStatusResponse(submission: Submission): SubmissionStatusResponse {
		const dto = new SubmissionStatusResponse({
			id: submission.id,
			submitters: submission.getSubmitterIds(),
			isSubmitted: submission.isSubmitted(),
			grade: submission.grade,
			isGraded: submission.isGraded(),
		});

		return dto;
	}
}
