import { Submission } from '@shared/domain/entity';
import { SubmissionStatusResponse } from '../controller/dto';

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
