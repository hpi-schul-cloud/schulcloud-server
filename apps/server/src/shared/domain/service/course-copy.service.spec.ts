import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { boardFactory, courseFactory, schoolFactory, setupEntities, userFactory } from '../../testing';
import { Course } from '../entity';
import { CopyElementType, CopyStatusEnum } from '../types';
import { BoardCopyService } from './board-copy.service';
import { CourseCopyService } from './course-copy.service';

describe('course copy service', () => {
	let module: TestingModule;
	let copyService: CourseCopyService;
	let boardCopyService: DeepMocked<BoardCopyService>;

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
				CourseCopyService,
				{
					provide: BoardCopyService,
					useValue: createMock<BoardCopyService>(),
				},
			],
		}).compile();

		copyService = module.get(CourseCopyService);
		boardCopyService = module.get(BoardCopyService);
	});

	describe('handleCopyCourse', () => {
		describe('when course is empty', () => {
			const setup = () => {
				const user = userFactory.build();
				const originalCourse = courseFactory.build();

				const boardCopy = boardFactory.build();
				const boardCopyStatus = {
					title: 'board',
					type: CopyElementType.BOARD,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: boardCopy,
				};
				boardCopyService.copyBoard.mockReturnValue(boardCopyStatus);

				return { user, originalCourse, boardCopyStatus };
			};

			it('should assign user as teacher', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				expect((status.copyEntity as Course).teachers.contains(user)).toEqual(true);
			});

			it('should set school of user', () => {
				const { originalCourse } = setup();

				const destinationSchool = schoolFactory.buildWithId();
				const user = userFactory.build({ school: destinationSchool });

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const course = status.copyEntity as Course;
				expect(course.school).toEqual(destinationSchool);
			});

			it('should set name of course and extend it by number in brackets', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const course = status.copyEntity as Course;
				expect(course.name).toEqual(`${originalCourse.name} (1)`);
			});

			it('should set name of course and increase an existing number in brackets', () => {
				const { originalCourse, user } = setup();
				const basename = originalCourse.name;
				originalCourse.name += ' (12)';

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const course = status?.copyEntity as Course;
				expect(course.name).toEqual(`${basename} (13)`);
			});

			it('should set color of course', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const course = status.copyEntity as Course;
				expect(course.color).toEqual(originalCourse.color);
			});

			it('should set status type to course', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				expect(status.type).toEqual(CopyElementType.COURSE);
			});

			it('should set status to partial', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				expect(status.status).toEqual(CopyStatusEnum.PARTIAL);
			});

			it('should set status title to title of the copy', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				expect(status.title).toEqual((status.copyEntity as Course).name);
			});

			it('should set status of metadata', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const metadataStatus = status.elements?.find(
					(el) => el.type === CopyElementType.LEAF && el.title === 'metadata'
				);
				expect(metadataStatus).toBeDefined();
				expect(metadataStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should set status of teachers', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const teachersStatus = status.elements?.find(
					(el) => el.type === CopyElementType.LEAF && el.title === 'teachers'
				);
				expect(teachersStatus).toBeDefined();
				expect(teachersStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
			});

			it('should set status of substitutionTeachers', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const substitutionTeachersStatus = status.elements?.find(
					(el) => el.type === CopyElementType.LEAF && el.title === 'substitutionTeachers'
				);
				expect(substitutionTeachersStatus).toBeDefined();
				expect(substitutionTeachersStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
			});

			it('should set status of students', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const studentsStatus = status.elements?.find(
					(el) => el.type === CopyElementType.LEAF && el.title === 'students'
				);
				expect(studentsStatus).toBeDefined();
				expect(studentsStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
			});

			it('should set status of classes', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const classesStatus = status.elements?.find((el) => el.type === CopyElementType.LEAF && el.title === 'classes');
				expect(classesStatus).toBeDefined();
				expect(classesStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
			});

			it('should set status of ltiTools', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const ltiToolsStatus = status.elements?.find(
					(el) => el.type === CopyElementType.LEAF && el.title === 'ltiTools'
				);
				expect(ltiToolsStatus).toBeDefined();
				expect(ltiToolsStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
			});

			it('should set status of times', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const timesStatus = status.elements?.find((el) => el.type === CopyElementType.LEAF && el.title === 'times');
				expect(timesStatus).toBeDefined();
				expect(timesStatus?.status).toEqual(CopyStatusEnum.NOT_IMPLEMENTED);
			});

			it('should set status of files', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const filesStatus = status.elements?.find((el) => el.type === CopyElementType.FILE && el.title === 'files');
				expect(filesStatus).toBeDefined();
				expect(filesStatus?.status).toEqual(CopyStatusEnum.NOT_IMPLEMENTED);
			});

			it('should set status of coursegroups', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const coursegroupsStatus = status.elements?.find(
					(el) => el.type === CopyElementType.LEAF && el.title === 'coursegroups'
				);
				expect(coursegroupsStatus).toBeDefined();
				expect(coursegroupsStatus?.status).toEqual(CopyStatusEnum.NOT_IMPLEMENTED);
			});
		});

		describe('when course contains additional users', () => {
			const setupWithAdditionalUsers = () => {
				const user = userFactory.build();
				const teachers = userFactory.buildList(1);

				const substitutionTeachers = userFactory.buildList(1);
				const students = userFactory.buildList(1);

				const originalCourse = courseFactory.build({ teachers: [user, ...teachers], substitutionTeachers, students });
				const originalBoard = boardFactory.build({ course: originalCourse });

				return { user, originalBoard, originalCourse };
			};

			it('should not set any students in the copy', () => {
				const { originalCourse, user } = setupWithAdditionalUsers();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				expect(status.copyEntity).toBeDefined();
				const course = status.copyEntity as Course;
				expect(course.students.length).toEqual(0);
			});

			it('should not set any additional teachers', () => {
				const { originalCourse, user } = setupWithAdditionalUsers();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const course = status.copyEntity as Course;
				expect(course.teachers.length).toEqual(1);
			});

			it('should not set any substitution Teachers in the copy', () => {
				const { originalCourse, user } = setupWithAdditionalUsers();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const course = status.copyEntity as Course;
				expect(course.substitutionTeachers.length).toEqual(0);
			});
		});
	});
});
