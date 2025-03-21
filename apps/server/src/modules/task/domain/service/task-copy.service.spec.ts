import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { CopyElementType, CopyHelperService, CopyStatusEnum } from '@modules/copy-helper';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { CopyFilesService } from '@modules/files-storage-client';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { lessonFactory } from '@modules/lesson/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { Submission, Task, TaskRepo } from '../../repo';
import { taskFactory } from '../../testing';
import { TaskCopyService } from './task-copy.service';

describe('task copy service', () => {
	let module: TestingModule;
	let copyService: TaskCopyService;
	let copyFilesService: DeepMocked<CopyFilesService>;
	let taskRepo: DeepMocked<TaskRepo>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		await setupEntities([User, Task, Submission, CourseEntity, CourseGroupEntity, LessonEntity, Material]);
		module = await Test.createTestingModule({
			providers: [
				TaskCopyService,
				{
					provide: TaskRepo,
					useValue: createMock<TaskRepo>(),
				},
				{
					provide: CopyHelperService,
					useValue: createMock<CopyHelperService>(),
				},
				{
					provide: CopyFilesService,
					useValue: createMock<CopyFilesService>(),
				},
			],
		}).compile();

		copyService = module.get(TaskCopyService);
		taskRepo = module.get(TaskRepo);
		copyFilesService = await module.get(CopyFilesService);
		copyFilesService.copyFilesOfEntity.mockResolvedValue({
			fileUrlReplacements: [],
			fileCopyStatus: { type: CopyElementType.FILE_GROUP, status: CopyStatusEnum.SUCCESS },
		});
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('handleCopyTask', () => {
		describe('when copying task within original course', () => {
			const setup = () => {
				const school = schoolEntityFactory.buildWithId();
				const user = userFactory.buildWithId({ school });
				const destinationCourse = courseEntityFactory.buildWithId({ school, teachers: [user] });
				const destinationLesson = lessonFactory.buildWithId({ course: destinationCourse });
				const originalTask = taskFactory.buildWithId({
					course: destinationCourse,
					lesson: destinationLesson,
					school,
					description: 'description of what you need to do',
				});
				const copyName = 'Copy(250)';
				taskRepo.findById.mockResolvedValueOnce(originalTask);
				return { user, destinationCourse, destinationLesson, originalTask, school, copyName };
			};

			it('should assign user as creator', async () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = await copyService.copyTask({
					originalTaskId: originalTask.id,
					destinationCourse,
					destinationLesson,
					user,
				});

				const task = status.copyEntity as Task;
				expect(task.creator).toEqual(user);
			});

			it('should set school of user', async () => {
				const { user, destinationCourse, destinationLesson, originalTask, school } = setup();

				const status = await copyService.copyTask({
					originalTaskId: originalTask.id,
					destinationCourse,
					destinationLesson,
					user,
				});

				const task = status.copyEntity as Task;
				expect(task.school).toEqual(school);
			});

			it('should set copy as draft', async () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = await copyService.copyTask({
					originalTaskId: originalTask.id,
					destinationCourse,
					destinationLesson,
					user,
				});

				const task = status.copyEntity as Task;
				expect(task.private).toEqual(true);
				expect(task.availableDate).not.toBeDefined();
			});

			it('should set name of copy to provided name', async () => {
				const { user, destinationCourse, destinationLesson, originalTask, copyName } = setup();

				const status = await copyService.copyTask({
					originalTaskId: originalTask.id,
					destinationCourse,
					destinationLesson,
					user,
					copyName,
				});

				const task = status.copyEntity as Task;
				expect(task.name).toEqual(copyName);
			});

			it('should set name of copy original when no name is provided', async () => {
				const { user, destinationCourse, originalTask } = setup();

				const status = await copyService.copyTask({
					originalTaskId: originalTask.id,
					destinationCourse,
					user,
				});

				const task = status.copyEntity as Task;
				expect(task.name).toEqual(originalTask.name);
			});

			it('should set course of the copy', async () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = await copyService.copyTask({
					originalTaskId: originalTask.id,
					destinationCourse,
					destinationLesson,
					user,
				});

				const task = status.copyEntity as Task;
				expect(task.course).toEqual(destinationCourse);
			});

			it('should set lesson of the copy', async () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = await copyService.copyTask({
					originalTaskId: originalTask.id,
					destinationCourse,
					destinationLesson,
					user,
				});

				const task = status.copyEntity as Task;
				expect(task.lesson).toEqual(destinationLesson);
			});

			it('should set description of copy', async () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = await copyService.copyTask({
					originalTaskId: originalTask.id,
					destinationCourse,
					destinationLesson,
					user,
				});

				const task = status.copyEntity as Task;
				expect(task.description).toEqual(originalTask.description);
			});

			it('should set teamSubmissions of copy', async () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();
				originalTask.teamSubmissions = true;

				const status = await copyService.copyTask({
					originalTaskId: originalTask.id,
					destinationCourse,
					destinationLesson,
					user,
				});

				const task = status.copyEntity as Task;
				expect(task.teamSubmissions).toEqual(originalTask.teamSubmissions);
			});

			it('should set status title to title of the copy', async () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = await copyService.copyTask({
					originalTaskId: originalTask.id,
					destinationCourse,
					destinationLesson,
					user,
				});

				const task = status.copyEntity as Task;
				expect(status.title).toEqual(task.name);
			});

			it('should set status type to task', async () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = await copyService.copyTask({
					originalTaskId: originalTask.id,
					destinationCourse,
					destinationLesson,
					user,
				});

				expect(status.type).toEqual(CopyElementType.TASK);
			});

			it('should set status original entity', async () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = await copyService.copyTask({
					originalTaskId: originalTask.id,
					destinationCourse,
					destinationLesson,
					user,
				});

				expect(status.originalEntity).toEqual(originalTask);
			});

			it('should set status of metadata', async () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = await copyService.copyTask({
					originalTaskId: originalTask.id,
					destinationCourse,
					destinationLesson,
					user,
				});

				const metadataStatus = status.elements?.find((el) => el.type === CopyElementType.METADATA);
				expect(metadataStatus).toBeDefined();
				expect(metadataStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should set status of description', async () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = await copyService.copyTask({
					originalTaskId: originalTask.id,
					destinationCourse,
					destinationLesson,
					user,
				});

				const descriptionStatus = status.elements?.find((el) => el.type === CopyElementType.CONTENT);
				expect(descriptionStatus).toBeDefined();
				expect(descriptionStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should set status of submissions', async () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = await copyService.copyTask({
					originalTaskId: originalTask.id,
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
			it('should set the school of the copy to the school of the user', async () => {
				const originalSchool = schoolEntityFactory.buildWithId();
				const destinationSchool = schoolEntityFactory.buildWithId();
				const originalCourse = courseEntityFactory.build({ school: originalSchool });
				const originalLesson = lessonFactory.build({ course: originalCourse });
				const destinationCourse = courseEntityFactory.buildWithId({ school: destinationSchool });
				const destinationLesson = lessonFactory.build({ course: destinationCourse });
				const user = userFactory.build({ school: destinationSchool });
				const originalTask = taskFactory.buildWithId({
					course: originalCourse,
					lesson: originalLesson,
					school: originalSchool,
				});

				const status = await copyService.copyTask({
					originalTaskId: originalTask.id,
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
				const originalCourse = courseEntityFactory.build({});
				const originalLesson = lessonFactory.build({ course: originalCourse });
				const destinationCourse = courseEntityFactory.buildWithId({});
				const destinationLesson = lessonFactory.build({ course: destinationCourse });
				const user = userFactory.build({});
				const originalTask = taskFactory.buildWithId({ course: originalCourse, lesson: originalLesson });
				taskRepo.findById.mockResolvedValueOnce(originalTask);
				return { user, destinationCourse, destinationLesson, originalTask };
			};
			it('should set destination course as course of the copy', async () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = await copyService.copyTask({
					originalTaskId: originalTask.id,
					destinationCourse,
					destinationLesson,
					user,
				});

				const task = status.copyEntity as Task;
				expect(task.course).toEqual(destinationCourse);
			});

			it('should set destination lesson as lesson of the copy', async () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = await copyService.copyTask({
					originalTaskId: originalTask.id,
					destinationCourse,
					destinationLesson,
					user,
				});

				const task = status.copyEntity as Task;
				expect(task.lesson).toEqual(destinationLesson);
			});
		});

		describe('when copying without course', () => {
			it('should copy the task without course and lesson', async () => {
				const user = userFactory.build({});
				const originalTask = taskFactory.buildWithId({ creator: user });

				const status = await copyService.copyTask({
					originalTaskId: originalTask.id,
					user,
				});

				const task = status.copyEntity as Task;
				expect(task).toBeDefined();
				expect(task.course).toBeUndefined();
				expect(task.lesson).toBeUndefined();
			});
		});

		describe('repo', () => {
			it('should persist copy', async () => {
				const user = userFactory.build({});
				const originalTask = taskFactory.buildWithId({ creator: user });

				await copyService.copyTask({
					originalTaskId: originalTask.id,
					user,
				});

				expect(taskRepo.createTask).toHaveBeenCalledTimes(1);
				expect(taskRepo.save).toHaveBeenCalledTimes(1);
			});
		});

		describe('copyFilesService', () => {
			it('should try to copy files from original task to task copy', async () => {
				const user = userFactory.build({});
				const originalTask = taskFactory.buildWithId({ creator: user });

				await copyService.copyTask({
					originalTaskId: originalTask.id,
					user,
				});
				expect(copyFilesService.copyFilesOfEntity).toHaveBeenCalled();
			});
		});

		describe('replace file links in text', () => {
			const getImageHTML = (id: string, name: string) => {
				const fileUrl = `"/api/v3/file/download/${id}/${name}"`;
				return `<figure class="image"><img src=${fileUrl} alt /></figure>`;
			};

			const setupWithFiles = () => {
				const school = schoolEntityFactory.build();
				const fileId1 = new ObjectId().toHexString();
				const fileId2 = new ObjectId().toHexString();
				const fileName1 = 'file-1.jpg';
				const fileName2 = 'file-2.jpg';
				const imageHTML1 = getImageHTML(fileId1, fileName1);
				const imageHTML2 = getImageHTML(fileId2, fileName2);

				const description = `<p>Some images: ${imageHTML1} ${imageHTML2}</p>`;
				const user = userFactory.build({});
				const originalCourse = courseEntityFactory.build();
				const originalTask = taskFactory.buildWithId({ creator: user, description, course: originalCourse });
				taskRepo.findById.mockResolvedValueOnce(originalTask);
				return { school, fileId1, fileId2, user, originalTask };
			};

			it('it should replace urls of copied files in task description', async () => {
				const { fileId1, fileId2, originalTask, user } = setupWithFiles();

				const replacement1 = '...weired_replacement1...';
				const replacement2 = '...weired_replacement2...';

				const fileUrlReplacements = [
					{
						regex: new RegExp(`${fileId1}.+?"`, 'g'),
						replacement: replacement1,
					},
					{
						regex: new RegExp(`${fileId2}.+?"`, 'g'),
						replacement: replacement2,
					},
				];

				copyFilesService.copyFilesOfEntity.mockResolvedValue({
					fileUrlReplacements,
					fileCopyStatus: { type: CopyElementType.TASK, status: CopyStatusEnum.SUCCESS },
				});

				const status = await copyService.copyTask({
					originalTaskId: originalTask.id,
					user,
				});

				const { description } = status.copyEntity as Task;
				expect(description).not.toContain(fileId1);
				expect(description).not.toContain(fileId2);
				expect(description).toContain(replacement1);
				expect(description).toContain(replacement2);
			});
		});
	});
});
