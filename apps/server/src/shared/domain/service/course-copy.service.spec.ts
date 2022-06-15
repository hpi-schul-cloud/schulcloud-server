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

			const result = copyService.copyCourse({
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

			const result = copyService.copyCourse({
				originalCourse,
				user,
			});

			expect(result.copy.school).toEqual(destinationSchool);
		});

		it('should set name of course', () => {
			const user = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId();

			const result = copyService.copyCourse({
				originalCourse,
				user,
			});

			expect(result.copy.name).toEqual(originalCourse.name);
		});

		it('should set color of course', () => {
			const user = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId();

			const result = copyService.copyCourse({
				originalCourse,
				user,
			});

			expect(result.copy.color).toEqual(originalCourse.color);
		});

		it('should not set any students', () => {
			const user = userFactory.buildWithId();
			const studentUser = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId({ students: [studentUser] });

			const result = copyService.copyCourse({
				originalCourse,
				user,
			});

			expect(result.copy.students.contains(studentUser)).toEqual(false);
		});

		it('should not set any additional teachers', () => {
			const user = userFactory.buildWithId();
			const secondUser = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId({ teachers: [secondUser] });

			const result = copyService.copyCourse({
				originalCourse,
				user,
			});

			expect(result.copy.teachers.contains(secondUser)).toEqual(false);
		});

		it('should add copy to status', () => {
			const user = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId();

			const result = copyService.copyCourse({
				originalCourse,
				user,
			});

			expect(result.status.copyEntity).toEqual(result.copy);
		});

		it('should set status type to course', () => {
			const user = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId();

			const result = copyService.copyCourse({
				originalCourse,
				user,
			});

			expect(result.status.type).toEqual(CopyElementType.COURSE);
		});

		it('should set status to partial', () => {
			const user = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId();

			const result = copyService.copyCourse({
				originalCourse,
				user,
			});

			expect(result.status.status).toEqual(CopyStatusEnum.PARTIAL);
		});

		it('should set status title to title of the copy', () => {
			const user = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId();

			const result = copyService.copyCourse({
				originalCourse,
				user,
			});

			expect(result.status.title).toEqual(result.copy.name);
		});

		it('should set status of metadata', () => {
			const user = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId();

			const result = copyService.copyCourse({
				originalCourse,
				user,
			});

			const metadataStatus = result.status.elements?.find(
				(el) => el.type === CopyElementType.LEAF && el.title === 'metadata'
			);
			expect(metadataStatus).toBeDefined();
			expect(metadataStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
		});

		it('should set status of teachers', () => {
			const user = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId();

			const result = copyService.copyCourse({
				originalCourse,
				user,
			});

			const teachersStatus = result.status.elements?.find(
				(el) => el.type === CopyElementType.LEAF && el.title === 'teachers'
			);
			expect(teachersStatus).toBeDefined();
			expect(teachersStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
		});

		it('should set status of substitutionTeachers', () => {
			const user = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId();

			const result = copyService.copyCourse({
				originalCourse,
				user,
			});

			const substitutionTeachersStatus = result.status.elements?.find(
				(el) => el.type === CopyElementType.LEAF && el.title === 'substitutionTeachers'
			);
			expect(substitutionTeachersStatus).toBeDefined();
			expect(substitutionTeachersStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
		});

		it('should set status of students', () => {
			const user = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId();

			const result = copyService.copyCourse({
				originalCourse,
				user,
			});

			const studentsStatus = result.status.elements?.find(
				(el) => el.type === CopyElementType.LEAF && el.title === 'students'
			);
			expect(studentsStatus).toBeDefined();
			expect(studentsStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
		});

		it('should set status of classes', () => {
			const user = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId();

			const result = copyService.copyCourse({
				originalCourse,
				user,
			});

			const classesStatus = result.status.elements?.find(
				(el) => el.type === CopyElementType.LEAF && el.title === 'classes'
			);
			expect(classesStatus).toBeDefined();
			expect(classesStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
		});

		it('should set status of ltiTools', () => {
			const user = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId();

			const result = copyService.copyCourse({
				originalCourse,
				user,
			});

			const ltiToolsStatus = result.status.elements?.find(
				(el) => el.type === CopyElementType.LEAF && el.title === 'ltiTools'
			);
			expect(ltiToolsStatus).toBeDefined();
			expect(ltiToolsStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
		});

		it('should set status of tasks', () => {
			const user = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId();

			const result = copyService.copyCourse({
				originalCourse,
				user,
			});

			const tasksStatus = result.status.elements?.find(
				(el) => el.type === CopyElementType.TASK && el.title === 'tasks'
			);
			expect(tasksStatus).toBeDefined();
			expect(tasksStatus?.status).toEqual(CopyStatusEnum.NOT_IMPLEMENTED);
		});

		it('should set status of times', () => {
			const user = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId();

			const result = copyService.copyCourse({
				originalCourse,
				user,
			});

			const timesStatus = result.status.elements?.find(
				(el) => el.type === CopyElementType.LEAF && el.title === 'times'
			);
			expect(timesStatus).toBeDefined();
			expect(timesStatus?.status).toEqual(CopyStatusEnum.NOT_IMPLEMENTED);
		});

		it('should set status of lessons', () => {
			const user = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId();

			const result = copyService.copyCourse({
				originalCourse,
				user,
			});

			const lessonsStatus = result.status.elements?.find(
				(el) => el.type === CopyElementType.LEAF && el.title === 'lessons'
			);
			expect(lessonsStatus).toBeDefined();
			expect(lessonsStatus?.status).toEqual(CopyStatusEnum.NOT_IMPLEMENTED);
		});

		it('should set status of files', () => {
			const user = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId();

			const result = copyService.copyCourse({
				originalCourse,
				user,
			});

			const filesStatus = result.status.elements?.find(
				(el) => el.type === CopyElementType.FILE && el.title === 'files'
			);
			expect(filesStatus).toBeDefined();
			expect(filesStatus?.status).toEqual(CopyStatusEnum.NOT_IMPLEMENTED);
		});

		it('should set status of coursegroups', () => {
			const user = userFactory.buildWithId();
			const originalCourse = courseFactory.buildWithId();

			const result = copyService.copyCourse({
				originalCourse,
				user,
			});

			const coursegroupsStatus = result.status.elements?.find(
				(el) => el.type === CopyElementType.LEAF && el.title === 'coursegroups'
			);
			expect(coursegroupsStatus).toBeDefined();
			expect(coursegroupsStatus?.status).toEqual(CopyStatusEnum.NOT_IMPLEMENTED);
		});
	});
});
