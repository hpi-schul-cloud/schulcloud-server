import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { Submission, Task } from '@modules/task/repo';
import { submissionFactory, taskFactory } from '@modules/task/testing';
import { UserLoginMigrationEntity } from '@modules/user-login-migration/repo';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { setupEntities } from '@testing/database';
import { LessonEntity, Material } from '../../repo';
import { type LessonLinkedTaskResponse } from '../dto/lesson-linked-task.response';
import { LessonMapper } from './lesson.mapper';

describe('LessonMapper', () => {
	beforeAll(async () => {
		await setupEntities([
			CourseEntity,
			CourseGroupEntity,
			LessonEntity,
			Material,
			SchoolSystemOptionsEntity,
			Submission,
			Task,
			User,
			UserLoginMigrationEntity,
		]);
	});

	describe('mapTaskToResponse', () => {
		describe('when mapping task to response', () => {
			const setup = () => {
				const task = taskFactory.buildWithId({
					publicSubmissions: true,
					teamSubmissions: true,
					submissions: submissionFactory.buildListWithId(2),
					finished: userFactory.buildListWithId(2),
				});

				return { task };
			};

			it('should map task to response', () => {
				const { task } = setup();

				const result = LessonMapper.mapTaskToResponse(task);

				expect(result).toEqual<LessonLinkedTaskResponse>({
					name: task.name,
					description: task.description,
					descriptionInputFormat: task.descriptionInputFormat,
					availableDate: task.availableDate,
					dueDate: task.dueDate,
					private: task.private,
					creator: task.creator?.id,
					publicSubmissions: task.publicSubmissions,
					teamSubmissions: task.teamSubmissions,
					courseId: task.course?.id,
					submissionIds: task.submissions.toArray().map((submission) => submission.id),
					finishedIds: task.finished.toArray().map((submission) => submission.id),
				});
			});
		});
	});
});
