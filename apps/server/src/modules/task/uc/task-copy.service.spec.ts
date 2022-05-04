import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, schoolFactory, setupEntities, taskFactory, userFactory } from '../../../shared/testing';
import { TaskCopyService } from './task-copy.service';

describe('task copy service', () => {
	let module: TestingModule;
	let copyService: TaskCopyService;

	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [TaskCopyService],
		}).compile();

		copyService = module.get(TaskCopyService);
	});

	describe('handleCopyTask', () => {
		describe('when copying within course', () => {
			it('should assign user as creator', () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
				const originalTask = taskFactory.buildWithId();

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse: course,
					user,
				});

				expect(result.creator).toEqual(user);
			});

			it('should set school of user', () => {
				const originalSchool = schoolFactory.buildWithId();
				const destinationSchool = schoolFactory.buildWithId();
				const originalCourse = courseFactory.build({ school: originalSchool });
				const destinationCourse = courseFactory.build({ school: destinationSchool });
				const user = userFactory.build({ school: destinationSchool });
				const originalTask = taskFactory.build({ course: originalCourse, school: originalSchool });

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					user,
				});

				expect(result.school).toEqual(destinationSchool);
			});

			it('should set destination course as parent', () => {
				const originalCourse = courseFactory.build({});
				const destinationCourse = courseFactory.build({});
				const user = userFactory.build({});
				const originalTask = taskFactory.build({ course: originalCourse });

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					user,
				});

				expect(result.course).toEqual(destinationCourse);
			});

			it('should set copy as draft', () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
				const originalTask = taskFactory.buildWithId();

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse: course,
					user,
				});

				expect(result.private).toEqual(true);
				expect(result.availableDate).not.toBeDefined();
			});

			it('should set name of copy', () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
				const originalTask = taskFactory.buildWithId();

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse: course,
					user,
				});

				expect(result.name).toEqual(originalTask.name);
			});

			it('should set description of copy', () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
				const originalTask = taskFactory.buildWithId({ description: 'description of what you need to do' });

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse: course,
					user,
				});

				expect(result.description).toEqual(originalTask.description);
			});
		});
	});
});
