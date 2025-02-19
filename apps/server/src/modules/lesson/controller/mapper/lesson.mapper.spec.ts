import { User } from '@modules/user/repo';
import { Course, CourseGroup, LessonEntity, Material, Submission, Task } from '@shared/domain/entity';
import { setupEntities } from '@testing/database';
import { submissionFactory } from '@testing/factory/submission.factory';
import { taskFactory } from '@testing/factory/task.factory';
import { userFactory } from '@testing/factory/user.factory';
import { LessonLinkedTaskResponse } from '../dto/lesson-linked-task.response';
import { LessonMapper } from './lesson.mapper';

describe('LessonMapper', () => {
	beforeAll(async () => {
		await setupEntities([User, Task, Submission, Course, CourseGroup, LessonEntity, Material]);
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
