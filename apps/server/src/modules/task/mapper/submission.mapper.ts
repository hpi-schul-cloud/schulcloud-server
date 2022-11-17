import { Submission } from '@shared/domain';
import { SubmissionResponse } from '../controller/dto';

export class SubmissionMapper {
	static mapToResponse(submission: Submission): SubmissionResponse {
		const submittingTeamMembers = [...submission.teamMembers].map((member) => member.id);
		const submissionFiles = [...submission.studentFiles].map((file) => file.id);
		const gradeFiles = [...submission.gradeFiles].map((file) => file.id);

		const dto = new SubmissionResponse({
			id: submission.id,
			taskId: submission.task.id,
			creatorId: submission.student.id,
			submittingCourseGroupId: submission.courseGroup?.id,
			submittingTeamMembers,
			comment: submission.comment,
			submissionFiles,
			grade: submission.grade,
			gradeComment: submission.gradeComment,
			gradeFiles,
		});

		return dto;
	}
}
