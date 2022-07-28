import { createMock } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { CopyHelperService, TaskCopyService } from '@shared/domain';
import { CopyElementType, CopyStatusEnum } from '@shared/domain/types';
import {
	courseFactory,
	fileFactory,
	lessonFactory,
	schoolFactory,
	setupEntities,
	taskFactory,
	userFactory,
} from '../../testing';
import { Task } from '../entity';

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
			providers: [
				TaskCopyService,
				{
					provide: CopyHelperService,
					useValue: createMock<CopyHelperService>(),
				},
			],
		}).compile();

		copyService = module.get(TaskCopyService);
	});

	describe('handleCopyTask', () => {
		describe('when copying task within original course', () => {
			const setup = () => {
				const school = schoolFactory.buildWithId();
				const user = userFactory.buildWithId({ school });
				const destinationCourse = courseFactory.buildWithId({ school, teachers: [user] });
				const destinationLesson = lessonFactory.buildWithId({ course: destinationCourse });
				const originalTask = taskFactory.buildWithId({
					course: destinationCourse,
					lesson: destinationLesson,
					school,
					description: 'description of what you need to do',
				});
				const copyName = 'Copy(250)';
				return { user, destinationCourse, destinationLesson, originalTask, school, copyName };
			};

			it('should assign user as creator', () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					destinationLesson,
					user,
				});

				const task = status.copyEntity as Task;
				expect(task.creator).toEqual(user);
			});

			it('should set school of user', () => {
				const { user, destinationCourse, destinationLesson, originalTask, school } = setup();

				const status = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					destinationLesson,
					user,
				});

				const task = status.copyEntity as Task;
				expect(task.school).toEqual(school);
			});

			it('should set copy as draft', () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					destinationLesson,
					user,
				});

				const task = status.copyEntity as Task;
				expect(task.private).toEqual(true);
				expect(task.availableDate).not.toBeDefined();
			});

			it('should set name of copy to provided name', () => {
				const { user, destinationCourse, destinationLesson, originalTask, copyName } = setup();

				const status = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					destinationLesson,
					user,
					copyName,
				});

				const task = status.copyEntity as Task;
				expect(task.name).toEqual(copyName);
			});

			it('should set name of copy original when no name is provided', () => {
				const { user, destinationCourse, originalTask } = setup();

				const status = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					user,
				});

				const task = status.copyEntity as Task;
				expect(task.name).toEqual(originalTask.name);
			});

			it('should set course of the copy', () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					destinationLesson,
					user,
				});

				const task = status.copyEntity as Task;
				expect(task.course).toEqual(destinationCourse);
			});

			it('should set lesson of the copy', () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					destinationLesson,
					user,
				});

				const task = status.copyEntity as Task;
				expect(task.lesson).toEqual(destinationLesson);
			});

			it('should set description of copy', () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					destinationLesson,
					user,
				});

				const task = status.copyEntity as Task;
				expect(task.description).toEqual(originalTask.description);
			});

			it('should set status title to title of the copy', () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					destinationLesson,
					user,
				});

				const task = status.copyEntity as Task;
				expect(status.title).toEqual(task.name);
			});

			it('should set status type to task', () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					destinationLesson,
					user,
				});

				expect(status.type).toEqual(CopyElementType.TASK);
			});

			it('should set status original entity', () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					destinationLesson,
					user,
				});

				expect(status.originalEntity).toEqual(originalTask);
			});

			it('should set status of metadata', () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					destinationLesson,
					user,
				});

				const metadataStatus = status.elements?.find((el) => el.type === CopyElementType.METADATA);
				expect(metadataStatus).toBeDefined();
				expect(metadataStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should set status of description', () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					destinationLesson,
					user,
				});

				const descriptionStatus = status.elements?.find((el) => el.type === CopyElementType.CONTENT);
				expect(descriptionStatus).toBeDefined();
				expect(descriptionStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should set status of submissions', () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					destinationLesson,
					user,
				});

				const submissionsStatus = status.elements?.find((el) => el.type === CopyElementType.SUBMISSION_GROUP);
				expect(submissionsStatus).toBeDefined();
				expect(submissionsStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
			});
		});

		describe('when copying task into different school', () => {
			it('should set the school of the copy to the school of the user', () => {
				const originalSchool = schoolFactory.buildWithId();
				const destinationSchool = schoolFactory.buildWithId();
				const originalCourse = courseFactory.build({ school: originalSchool });
				const originalLesson = lessonFactory.build({ course: originalCourse });
				const destinationCourse = courseFactory.build({ school: destinationSchool });
				const destinationLesson = lessonFactory.build({ course: destinationCourse });
				const user = userFactory.build({ school: destinationSchool });
				const originalTask = taskFactory.build({
					course: originalCourse,
					lesson: originalLesson,
					school: originalSchool,
				});

				const status = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					destinationLesson,
					user,
				});

				const task = status.copyEntity as Task;
				expect(task.school).toEqual(destinationSchool);
			});
		});

		describe('when copying into a different course', () => {
			const setup = () => {
				const originalCourse = courseFactory.build({});
				const originalLesson = lessonFactory.build({ course: originalCourse });
				const destinationCourse = courseFactory.build({});
				const destinationLesson = lessonFactory.build({ course: destinationCourse });
				const user = userFactory.build({});
				const originalTask = taskFactory.build({ course: originalCourse, lesson: originalLesson });
				return { user, destinationCourse, destinationLesson, originalTask };
			};
			it('should set destination course as course of the copy', () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					destinationLesson,
					user,
				});

				const task = status.copyEntity as Task;
				expect(task.course).toEqual(destinationCourse);
			});

			it('should set destination lesson as lesson of the copy', () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					destinationLesson,
					user,
				});

				const task = status.copyEntity as Task;
				expect(task.lesson).toEqual(destinationLesson);
			});
		});

		describe('when copying without course', () => {
			it('should copy the task without course and lesson', () => {
				const user = userFactory.build({});
				const originalTask = taskFactory.build({ creator: user });

				const status = copyService.copyTaskMetadata({
					originalTask,
					user,
				});

				const task = status.copyEntity as Task;
				expect(task).toBeDefined();
				expect(task.course).toBeUndefined();
				expect(task.lesson).toBeUndefined();
			});
		});

		describe('when task contains no files', () => {
			const setup = () => {
				const school = schoolFactory.buildWithId();
				const user = userFactory.buildWithId({ school });
				const destinationCourse = courseFactory.buildWithId({ school, teachers: [user] });
				const destinationLesson = lessonFactory.buildWithId({ course: destinationCourse });
				const originalTask = taskFactory.buildWithId({
					course: destinationCourse,
					lesson: destinationLesson,
					school,
					description: 'description of what you need to do',
				});
				return { user, destinationCourse, destinationLesson, originalTask, school };
			};

			it('should not set files leaf in absence of attached files', () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					destinationLesson,
					user,
				});

				const fileGroup = status.elements?.find((el) => el.type === CopyElementType.FILE_GROUP);
				expect(fileGroup).not.toBeDefined();
			});
		});

		describe('when task contains a single file', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const destinationCourse = courseFactory.buildWithId();
				const destinationLesson = lessonFactory.buildWithId({ course: destinationCourse });
				const file = fileFactory.buildWithId();
				const originalTask = taskFactory.buildWithId({
					course: destinationCourse,
					lesson: destinationLesson,
					files: [file],
				});
				return { user, destinationCourse, destinationLesson, file, originalTask };
			};

			it('should add file leaf with status "not implemented"', () => {
				const { user, file, destinationCourse, destinationLesson, originalTask } = setup();

				const status = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					destinationLesson,
					user,
				});

				const fileGroup = status.elements?.find((el) => el.type === CopyElementType.FILE_GROUP);
				expect(fileGroup).toBeDefined();
				const fileStatus = fileGroup?.elements?.find(
					(el) => el.type === CopyElementType.FILE && el.title === file.name
				);
				expect(fileStatus).toBeDefined();
				expect(fileStatus?.status).toEqual(CopyStatusEnum.NOT_IMPLEMENTED);
			});
		});

		describe('when task contains multiple files', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const destinationCourse = courseFactory.buildWithId();
				const destinationLesson = lessonFactory.buildWithId({ course: destinationCourse });
				const files = [fileFactory.buildWithId(), fileFactory.buildWithId()];
				const originalTask = taskFactory.buildWithId({ course: destinationCourse, lesson: destinationLesson, files });
				return { user, destinationCourse, destinationLesson, files, originalTask };
			};

			it('should add a status for files leaf', () => {
				const { originalTask, destinationCourse, destinationLesson, user } = setup();

				const status = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					destinationLesson,
					user,
				});

				const fileGroup = status.elements?.find((el) => el.type === CopyElementType.FILE_GROUP);
				expect(fileGroup).toBeDefined();
				expect(fileGroup?.status).toEqual(CopyStatusEnum.NOT_IMPLEMENTED);
			});

			it('should add a status for each file under files', () => {
				const { originalTask, destinationCourse, destinationLesson, user, files } = setup();

				const status = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					destinationLesson,
					user,
				});

				const fileGroup = status.elements?.find((el) => el.type === CopyElementType.FILE_GROUP);
				const statusFileNames = fileGroup?.elements?.map((el) => el.title);
				const setupFileNames = files.map((file) => file.name);

				expect(statusFileNames?.sort()).toEqual(setupFileNames.sort());
			});

			it('should set "not implemented" as the status of every file', () => {
				const { originalTask, destinationCourse, destinationLesson, user } = setup();

				const status = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					destinationLesson,
					user,
				});

				const fileGroup = status.elements?.find((el) => el.type === CopyElementType.FILE_GROUP);
				fileGroup?.elements?.forEach((el) => {
					expect(el.status).toEqual(CopyStatusEnum.NOT_IMPLEMENTED);
				});
			});
		});
	});
});
