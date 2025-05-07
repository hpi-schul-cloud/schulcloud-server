import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { User } from '@modules/user/repo';
import { setupEntities } from '@testing/database';
import { Submission, Task } from '../../repo';
import { submissionFactory } from '../../testing';
import { SubmissionStatusResponse } from '../dto';
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
