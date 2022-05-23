import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { CopyElementType, CopyStatusEnum } from '@shared/domain/types';
import { courseFactory, schoolFactory, setupEntities, taskFactory, userFactory } from '../../testing';
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
		it('should assign user as creator', () => {
			const user = userFactory.buildWithId();
			const course = courseFactory.buildWithId();
			const originalTask = taskFactory.buildWithId();

			const result = copyService.copyTaskMetadata({
				originalTask,
				destinationCourse: course,
				user,
			});

			expect(result.copy.creator).toEqual(user);
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

			expect(result.copy.school).toEqual(destinationSchool);
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

			expect(result.copy.course).toEqual(destinationCourse);
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

			expect(result.copy.private).toEqual(true);
			expect(result.copy.availableDate).not.toBeDefined();
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

			expect(result.copy.name).toEqual(originalTask.name);
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

			expect(result.copy.description).toEqual(originalTask.description);
		});

		it('should set course', () => {
			const user = userFactory.buildWithId();
			const course = courseFactory.buildWithId();
			const originalTask = taskFactory.buildWithId({});

			const result = copyService.copyTaskMetadata({
				originalTask,
				destinationCourse: course,
				user,
			});

			expect(result.copy.course).toEqual(course);
		});

		it('should set copy to status', () => {
			const user = userFactory.buildWithId();
			const course = courseFactory.buildWithId();
			const originalTask = taskFactory.buildWithId({});

			const result = copyService.copyTaskMetadata({
				originalTask,
				destinationCourse: course,
				user,
			});

			expect(result.status.copyEntity).toEqual(result.copy);
		});

		it('should set status to partial, as long as file is not-implemented', () => {
			const user = userFactory.buildWithId();
			const course = courseFactory.buildWithId();
			const originalTask = taskFactory.buildWithId({});

			const result = copyService.copyTaskMetadata({
				originalTask,
				destinationCourse: course,
				user,
			});

			expect(result.status.status).toEqual(CopyStatusEnum.PARTIAL);

			// TODO once files status is no longer NOT_IMPLEMENTED, task status should change.
			const fileStatus = result.status.elements?.find((el) => el.type === CopyElementType.LEAF && el.title === 'files');
			expect(fileStatus).toBeDefined();
			expect(fileStatus?.status).toEqual(CopyStatusEnum.NOT_IMPLEMENTED);
		});

		it('should set status title to title of the copy', () => {
			const user = userFactory.buildWithId();
			const course = courseFactory.buildWithId();
			const originalTask = taskFactory.buildWithId({});

			const result = copyService.copyTaskMetadata({
				originalTask,
				destinationCourse: course,
				user,
			});

			expect(result.status.title).toEqual(result.copy.name);
		});

		it('should set status type to task', () => {
			const user = userFactory.buildWithId();
			const course = courseFactory.buildWithId();
			const originalTask = taskFactory.buildWithId({});

			const result = copyService.copyTaskMetadata({
				originalTask,
				destinationCourse: course,
				user,
			});

			expect(result.status.type).toEqual(CopyElementType.TASK);
		});

		it('should set status of metadata', () => {
			const user = userFactory.buildWithId();
			const course = courseFactory.buildWithId();
			const originalTask = taskFactory.buildWithId({});

			const result = copyService.copyTaskMetadata({
				originalTask,
				destinationCourse: course,
				user,
			});

			const metadataStatus = result.status.elements?.find(
				(el) => el.type === CopyElementType.LEAF && el.title === 'metadata'
			);
			expect(metadataStatus).toBeDefined();
			expect(metadataStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
		});

		it('should set status of description', () => {
			const user = userFactory.buildWithId();
			const course = courseFactory.buildWithId();
			const originalTask = taskFactory.buildWithId({});

			const result = copyService.copyTaskMetadata({
				originalTask,
				destinationCourse: course,
				user,
			});

			const descriptionStatus = result.status.elements?.find(
				(el) => el.type === CopyElementType.LEAF && el.title === 'description'
			);
			expect(descriptionStatus).toBeDefined();
			expect(descriptionStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
		});

		it('should set status of submissions', () => {
			const user = userFactory.buildWithId();
			const course = courseFactory.buildWithId();
			const originalTask = taskFactory.buildWithId({});

			const result = copyService.copyTaskMetadata({
				originalTask,
				destinationCourse: course,
				user,
			});

			const submissionsStatus = result.status.elements?.find(
				(el) => el.type === CopyElementType.LEAF && el.title === 'submissions'
			);
			expect(submissionsStatus).toBeDefined();
			expect(submissionsStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
		});

		it('should set status of files', () => {
			const user = userFactory.buildWithId();
			const course = courseFactory.buildWithId();
			const originalTask = taskFactory.buildWithId({});

			const result = copyService.copyTaskMetadata({
				originalTask,
				destinationCourse: course,
				user,
			});

			const filesStatus = result.status.elements?.find(
				(el) => el.type === CopyElementType.LEAF && el.title === 'submissions'
			);
			expect(filesStatus).toBeDefined();
			expect(filesStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
		});
	});
});
