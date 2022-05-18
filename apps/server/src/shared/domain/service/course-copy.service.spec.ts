import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, schoolFactory, setupEntities, userFactory } from '../../testing';
import { CopyElementType, CopyStatusEnum } from '../types/copy.types';
import { CourseCopyService } from './course-copy.service';

describe('course copy service', () => {
	let module: TestingModule;
	let copyService: CourseCopyService;

	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [CourseCopyService],
		}).compile();

		copyService = module.get(CourseCopyService);
	});

	describe('handleCopyCourse', () => {
		it('should assign user as teacher', () => {
			const user = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId();

			const result = copyService.copyCourseMetadata({
				originalCourse,
				user,
			});

			expect(result.copy.teachers.contains(user)).toEqual(true);
		});

		it('should set school of user', () => {
			const originalSchool = schoolFactory.buildWithId();
			const destinationSchool = schoolFactory.buildWithId();
			const originalCourse = courseFactory.build({ school: originalSchool });
			const user = userFactory.build({ school: destinationSchool });

			const result = copyService.copyCourseMetadata({
				originalCourse,
				user,
			});

			expect(result.copy.school).toEqual(destinationSchool);
		});

		it('should set name of course', () => {
			const user = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId();

			const result = copyService.copyCourseMetadata({
				originalCourse,
				user,
			});

			expect(result.copy.name).toEqual(originalCourse.name);
		});

		it('should set color of course', () => {
			const user = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId();

			const result = copyService.copyCourseMetadata({
				originalCourse,
				user,
			});

			expect(result.copy.color).toEqual(originalCourse.color);
		});

		/* it.todo('should set dates of course according to current school year of user school', () => {
			const user = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId();

			const result = copyService.copyCourseMetadata({
				originalCourse,
				user,
			});

			expect(true).toEqual(false);
		}); */

		it('should not set any students', () => {
			const user = userFactory.buildWithId();
			const studentUser = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId({ students: [studentUser] });

			const result = copyService.copyCourseMetadata({
				originalCourse,
				user,
			});

			expect(result.copy.students.contains(studentUser)).toEqual(false);
		});

		it('should not set any additional teachers', () => {
			const user = userFactory.buildWithId();
			const secondUser = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId({ teachers: [secondUser] });

			const result = copyService.copyCourseMetadata({
				originalCourse,
				user,
			});

			expect(result.copy.teachers.contains(secondUser)).toEqual(false);
		});

		it('should set status id to course copy id', () => {
			const user = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId();

			const result = copyService.copyCourseMetadata({
				originalCourse,
				user,
			});

			expect(result.status.id).toEqual(result.copy.getMetadata().id);
		});
		it('should set status type to course', () => {
			const user = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId();

			const result = copyService.copyCourseMetadata({
				originalCourse,
				user,
			});

			expect(result.status.type).toEqual(CopyElementType.COURSE);
		});

		it('should set status to success', () => {
			const user = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId();

			const result = copyService.copyCourseMetadata({
				originalCourse,
				user,
			});

			expect(result.status.status).toEqual(CopyStatusEnum.SUCCESS);
		});

		it('should set status title to title of the copy', () => {
			const user = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId();

			const result = copyService.copyCourseMetadata({
				originalCourse,
				user,
			});

			expect(result.status.title).toEqual(result.copy.name);
		});

		/* it('should set destination course as parent', () => {
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
		}); */
	});
});
