import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { SystemEntity } from '@modules/system/repo';
import { UserLoginMigrationEntity } from '@modules/user-login-migration/repo';
import { User } from '@modules/user/repo';
import { setupEntities } from '@testing/database';
import { Submission, Task } from '../../repo';
import { submissionFactory } from '../../testing';
import { SubmissionStatusResponse } from '../dto';
import { SubmissionMapper } from './submission.mapper';

describe('Submission Mapper', () => {
	beforeAll(async () => {
		await setupEntities([
			CourseEntity,
			CourseGroupEntity,
			LessonEntity,
			Material,
			SchoolSystemOptionsEntity,
			Submission,
			SystemEntity,
			Task,
			User,
			UserLoginMigrationEntity,
		]);
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
