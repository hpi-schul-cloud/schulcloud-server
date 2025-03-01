import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { User } from '@modules/user/repo';
import { LessonEntity, Material, Submission, Task } from '@shared/domain/entity';
import { setupEntities } from '@testing/database';
import { submissionFactory } from '@testing/factory/submission.factory';
import { SubmissionStatusResponse } from '../controller/dto';
import { SubmissionMapper } from './submission.mapper';

describe('Submission Mapper', () => {
	beforeAll(async () => {
		await setupEntities([User, Task, Submission, CourseEntity, CourseGroupEntity, LessonEntity, Material]);
	});

	describe('mapToStatusResponse', () => {
		const setup = () => {
			const submission = submissionFactory.buildWithId();

			const expected = new SubmissionStatusResponse({
				id: submission.id,
				submitters: submission.getSubmitterIds(),
				isSubmitted: submission.isSubmitted(),
				grade: submission.grade,
				isGraded: submission.isGraded(),
				submittingCourseGroupName: submission.courseGroup?.name,
			});

			return { submission, expected };
		};
		it('should map submission', () => {
			const { submission, expected } = setup();

			const result = SubmissionMapper.mapToStatusResponse(submission);

			expect(result).toStrictEqual(expected);
		});
	});
});
