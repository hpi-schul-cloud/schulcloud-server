import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { CopyElementType, CopyStatusEnum } from '@shared/domain/types';
import { courseFactory, fileFactory, schoolFactory, setupEntities, taskFactory, userFactory } from '../../testing';
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
		describe('when copying task within original course', () => {
			const setup = () => {
				const school = schoolFactory.buildWithId();
				const user = userFactory.buildWithId({ school });
				const destinationCourse = courseFactory.buildWithId({ school, teachers: [user] });
				const originalTask = taskFactory.buildWithId({
					course: destinationCourse,
					school,
					description: 'description of what you need to do',
				});
				return { user, destinationCourse, originalTask, school };
			};

			it('should assign user as creator', () => {
				const { user, destinationCourse, originalTask } = setup();

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					user,
				});

				expect(result.copy.creator).toEqual(user);
			});

			it('should set school of user', () => {
				const { user, destinationCourse, originalTask, school } = setup();

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					user,
				});

				expect(result.copy.school).toEqual(school);
			});

			it('should set copy as draft', () => {
				const { user, destinationCourse, originalTask } = setup();

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					user,
				});

				expect(result.copy.private).toEqual(true);
				expect(result.copy.availableDate).not.toBeDefined();
			});

			it('should set name of copy', () => {
				const { user, destinationCourse, originalTask } = setup();

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					user,
				});

				expect(result.copy.name).toEqual(originalTask.name);
			});

			it('should set course of the copy', () => {
				const { user, destinationCourse, originalTask } = setup();

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					user,
				});

				expect(result.copy.course).toEqual(destinationCourse);
			});

			it('should set description of copy', () => {
				const { user, destinationCourse, originalTask } = setup();

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					user,
				});

				expect(result.copy.description).toEqual(originalTask.description);
			});

			it('should set copy to status', () => {
				const { user, destinationCourse, originalTask } = setup();

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					user,
				});

				expect(result.status.copyEntity).toEqual(result.copy);
			});

			it('should set status title to title of the copy', () => {
				const { user, destinationCourse, originalTask } = setup();

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					user,
				});

				expect(result.status.title).toEqual(result.copy.name);
			});

			it('should set status type to task', () => {
				const { user, destinationCourse, originalTask } = setup();

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					user,
				});

				expect(result.status.type).toEqual(CopyElementType.TASK);
			});

			it('should set status of metadata', () => {
				const { user, destinationCourse, originalTask } = setup();

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					user,
				});

				const metadataStatus = result.status.elements?.find(
					(el) => el.type === CopyElementType.LEAF && el.title === 'metadata'
				);
				expect(metadataStatus).toBeDefined();
				expect(metadataStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should set status of description', () => {
				const { user, destinationCourse, originalTask } = setup();

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					user,
				});

				const descriptionStatus = result.status.elements?.find(
					(el) => el.type === CopyElementType.LEAF && el.title === 'description'
				);
				expect(descriptionStatus).toBeDefined();
				expect(descriptionStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should set status of submissions', () => {
				const { user, destinationCourse, originalTask } = setup();

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					user,
				});

				const submissionsStatus = result.status.elements?.find(
					(el) => el.type === CopyElementType.LEAF && el.title === 'submissions'
				);
				expect(submissionsStatus).toBeDefined();
				expect(submissionsStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
			});

			it('should set status to success in absence of attached files', () => {
				const { user, destinationCourse, originalTask } = setup();

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					user,
				});

				expect(result.status.status).toEqual(CopyStatusEnum.SUCCESS);
			});
		});

		describe('when copying task into different school', () => {
			it('should set the school of the copy to the school of the user', () => {
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

				expect(result.copy.school).toEqual(destinationSchool);
			});
		});

		describe('when copying into a different course', () => {
			it('should set destination course as course of the copy', () => {
				const originalCourse = courseFactory.build({});
				const destinationCourse = courseFactory.build({});
				const user = userFactory.build({});
				const originalTask = taskFactory.build({ course: originalCourse });

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					user,
				});

				expect(result.copy.course).toEqual(destinationCourse);
			});
		});

		describe('when task contains no files', () => {
			const setup = () => {
				const school = schoolFactory.buildWithId();
				const user = userFactory.buildWithId({ school });
				const destinationCourse = courseFactory.buildWithId({ school, teachers: [user] });
				const originalTask = taskFactory.buildWithId({
					course: destinationCourse,
					school,
					description: 'description of what you need to do',
				});
				return { user, destinationCourse, originalTask, school };
			};

			it('should not set files leaf in absence of attached files', () => {
				const { user, destinationCourse, originalTask } = setup();

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					user,
				});

				const filesStatus = result.status.elements?.find(
					(el) => el.type === CopyElementType.LEAF && el.title === 'files'
				);
				expect(filesStatus).not.toBeDefined();
			});
		});

		describe('when task contains a single file', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const destinationCourse = courseFactory.buildWithId();
				const file = fileFactory.buildWithId();
				const originalTask = taskFactory.buildWithId({ course: destinationCourse, files: [file] });
				return { user, destinationCourse, file, originalTask };
			};

			it('should set task status to partial', () => {
				const { user, destinationCourse, originalTask } = setup();

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					user,
				});

				expect(result.status.status).toEqual(CopyStatusEnum.PARTIAL);
			});

			it('should add file leaf with status "not implemented"', () => {
				const { user, file, destinationCourse, originalTask } = setup();

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					user,
				});

				const fileStatus = result.status.elements?.find(
					(el) => el.type === CopyElementType.LEAF && el.title === file.name
				);
				expect(fileStatus).toBeDefined();
				expect(fileStatus?.status).toEqual(CopyStatusEnum.NOT_IMPLEMENTED);
			});
		});

		describe('when task contains multiple files', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const destinationCourse = courseFactory.buildWithId();
				const files = [fileFactory.buildWithId(), fileFactory.buildWithId()];
				const originalTask = taskFactory.buildWithId({ course: destinationCourse, files });
				return { user, destinationCourse, files, originalTask };
			};

			it('should set task status to partial', () => {
				const { originalTask, destinationCourse, user } = setup();

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					user,
				});

				expect(result.status.status).toEqual(CopyStatusEnum.PARTIAL);
			});

			it('should add a status for files leaf', () => {
				const { originalTask, destinationCourse, user } = setup();

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					user,
				});

				const fileStatus = result.status.elements?.find(
					(el) => el.type === CopyElementType.LEAF && el.title === 'files'
				);
				expect(fileStatus).toBeDefined();
				expect(fileStatus?.status).toEqual(CopyStatusEnum.NOT_IMPLEMENTED);
			});

			it('should add a status for each file under files', () => {
				const { originalTask, destinationCourse, user, files } = setup();

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					user,
				});

				const filestatus = result.status.elements?.find(
					(el) => el.type === CopyElementType.LEAF && el.title === 'files'
				);

				const fileStatusNames = filestatus?.elements?.map((el) => el.title);
				const fileNames = files.map((file) => file.name);

				expect(fileStatusNames?.sort()).toEqual(fileNames.sort());
			});

			it('should set "not implemented" as the status of every file', () => {
				const { originalTask, destinationCourse, user } = setup();

				const result = copyService.copyTaskMetadata({
					originalTask,
					destinationCourse,
					user,
				});

				const fileStatus = result.status.elements?.find(
					(el) => el.type === CopyElementType.LEAF && el.title === 'files'
				);

				fileStatus?.elements?.forEach((el) => {
					expect(el.status).toEqual(CopyStatusEnum.NOT_IMPLEMENTED);
				});
			});
		});
	});
});
