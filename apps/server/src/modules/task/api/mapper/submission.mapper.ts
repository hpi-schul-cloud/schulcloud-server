import { Submission } from '../../repo';
import { SubmissionStatusResponse } from '../dto';

export class SubmissionMapper {
	static mapToStatusResponse(submission: Submission): SubmissionStatusResponse {
		const dto = new SubmissionStatusResponse({
			id: submission.id,
			submitters: submission.getSubmitterIds(),
			isSubmitted: submission.isSubmitted(),
			grade: submission.grade,
			isGraded: submission.isGraded(),
			submittingCourseGroupName: submission.courseGroup?.name,
		});

		return dto;
	}
}
