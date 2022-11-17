import { MikroORM } from '@mikro-orm/core';
import { setupEntities, submissionFactory } from '@shared/testing';
import { SubmissionResponse } from '../controller/dto';
import { SubmissionMapper } from './submission.mapper';

describe('Submission Mapper', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('mapToResponse', () => {
		const setup = () => {
			const submission = submissionFactory.buildWithId();
			const submittingTeamMembers = [...submission.teamMembers].map((member) => member.id);
			const submissionFiles = [...submission.studentFiles].map((file) => file.id);
			const gradeFiles = [...submission.gradeFiles].map((file) => file.id);

			const expected = new SubmissionResponse({
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

			return { submission, expected };
		};
		it('should map submission', () => {
			const { submission, expected } = setup();

			const result = SubmissionMapper.mapToResponse(submission);

			expect(result).toStrictEqual(expected);
		});
	});
});
