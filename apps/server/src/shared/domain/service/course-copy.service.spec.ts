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
	});
});
