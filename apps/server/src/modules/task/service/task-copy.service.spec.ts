import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Task } from '@shared/domain/entity';
import { TaskRepo } from '@shared/repo';
import {
	courseFactory,
	fileFactory,
	lessonFactory,
	schoolFactory,
	setupEntities,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { CopyElementType, CopyHelperService, CopyStatusEnum } from '@src/modules/copy-helper';
import { CopyFilesService } from '@src/modules/files-storage-client';
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
		await setupEntities();
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

			it('should assign user as creator', async () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = await copyService.copyTask({
					originalTask,
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
					originalTask,
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
					originalTask,
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
					originalTask,
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
					originalTask,
					destinationCourse,
					user,
				});

				const task = status.copyEntity as Task;
				expect(task.name).toEqual(originalTask.name);
			});

			it('should set course of the copy', async () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = await copyService.copyTask({
					originalTask,
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
					originalTask,
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
					originalTask,
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
					originalTask,
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
					originalTask,
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
					originalTask,
					destinationCourse,
					destinationLesson,
					user,
				});

				expect(status.type).toEqual(CopyElementType.TASK);
			});

			it('should set status original entity', async () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = await copyService.copyTask({
					originalTask,
					destinationCourse,
					destinationLesson,
					user,
				});

				expect(status.originalEntity).toEqual(originalTask);
			});

			it('should set status of metadata', async () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = await copyService.copyTask({
					originalTask,
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
					originalTask,
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
			it('should set the school of the copy to the school of the user', async () => {
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

				const status = await copyService.copyTask({
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
			it('should set destination course as course of the copy', async () => {
				const { user, destinationCourse, destinationLesson, originalTask } = setup();

				const status = await copyService.copyTask({
					originalTask,
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
			it('should copy the task without course and lesson', async () => {
				const user = userFactory.build({});
				const originalTask = taskFactory.build({ creator: user });

				const status = await copyService.copyTask({
					originalTask,
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
				const originalTask = taskFactory.build({ creator: user });

				await copyService.copyTask({
					originalTask,
					user,
				});

				expect(taskRepo.createTask).toHaveBeenCalledTimes(1);
				expect(taskRepo.save).toHaveBeenCalledTimes(1);
			});
		});

		describe('copyFilesService', () => {
			it('should try to copy files from original task to task copy', async () => {
				const user = userFactory.build({});
				const originalTask = taskFactory.build({ creator: user });

				await copyService.copyTask({
					originalTask,
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
				const school = schoolFactory.build();
				const file1 = fileFactory.buildWithId({ name: 'file1.jpg' });
				const file2 = fileFactory.buildWithId({ name: 'file2.jpg' });
				const imageHTML1 = getImageHTML(file1.id, file1.name);
				const imageHTML2 = getImageHTML(file2.id, file2.name);

				const description = `<p>Some images: ${imageHTML1} ${imageHTML2}</p>`;
				const user = userFactory.build({});
				const originalCourse = courseFactory.build();
				const originalTask = taskFactory.build({ creator: user, description, course: originalCourse });
				return { school, file1, file2, user, originalTask };
			};

			it('it should replace urls of copied files in task description', async () => {
				const { file1, file2, originalTask, user } = setupWithFiles();

				const replacement1 = '...weired_replacement1...';
				const replacement2 = '...weired_replacement2...';

				const fileUrlReplacements = [
					{
						regex: new RegExp(`${file1.id}.+?"`, 'g'),
						replacement: replacement1,
					},
					{
						regex: new RegExp(`${file2.id}.+?"`, 'g'),
						replacement: replacement2,
					},
				];

				copyFilesService.copyFilesOfEntity.mockResolvedValue({
					fileUrlReplacements,
					fileCopyStatus: { type: CopyElementType.TASK, status: CopyStatusEnum.SUCCESS },
				});

				const status = await copyService.copyTask({
					originalTask,
					user,
				});

				const { description } = status.copyEntity as Task;
				expect(description).not.toContain(file1.id);
				expect(description).not.toContain(file2.id);
				expect(description).toContain(replacement1);
				expect(description).toContain(replacement2);
			});
		});
	});
});
