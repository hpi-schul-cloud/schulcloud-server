import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { boardFactory, courseFactory, schoolFactory, setupEntities, userFactory } from '../../testing';
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
				const originalBoard = boardFactory.build({ course: originalCourse });

				const boardCopy = boardFactory.build();
				const boardCopyStatus = {
					copy: boardCopy,
					status: { title: 'board', type: CopyElementType.BOARD, status: CopyStatusEnum.SUCCESS },
				};
				boardCopyService.copyBoard.mockReturnValue(boardCopyStatus);

				return { user, originalBoard, originalCourse, boardCopyStatus };
			};

			it('should assign user as teacher', () => {
				const { originalBoard, originalCourse, user } = setup();

				const result = copyService.copyCourse({
					originalCourse,
					originalBoard,
					user,
				});

				expect(result.copy.teachers.contains(user)).toEqual(true);
			});

			it('should set school of user', () => {
				const { originalBoard, originalCourse } = setup();

				const destinationSchool = schoolFactory.buildWithId();
				const user = userFactory.build({ school: destinationSchool });

				const result = copyService.copyCourse({
					originalCourse,
					originalBoard,
					user,
				});

				expect(result.copy.school).toEqual(destinationSchool);
			});

			it('should set name of course', () => {
				const { originalBoard, originalCourse, user } = setup();

				const result = copyService.copyCourse({
					originalCourse,
					originalBoard,
					user,
				});

				expect(result.copy.name).toEqual(originalCourse.name);
			});

			it('should set color of course', () => {
				const { originalBoard, originalCourse, user } = setup();

				const result = copyService.copyCourse({
					originalCourse,
					originalBoard,
					user,
				});

				expect(result.copy.color).toEqual(originalCourse.color);
			});

			it('should add copy to status', () => {
				const { originalBoard, originalCourse, user } = setup();

				const result = copyService.copyCourse({
					originalCourse,
					originalBoard,
					user,
				});

				expect(result.status.copyEntity).toEqual(result.copy);
			});

			it('should set status type to course', () => {
				const { originalBoard, originalCourse, user } = setup();

				const result = copyService.copyCourse({
					originalCourse,
					originalBoard,
					user,
				});

				expect(result.status.type).toEqual(CopyElementType.COURSE);
			});

			it('should set status to partial', () => {
				const { originalBoard, originalCourse, user } = setup();

				const result = copyService.copyCourse({
					originalCourse,
					originalBoard,
					user,
				});

				expect(result.status.status).toEqual(CopyStatusEnum.PARTIAL);
			});

			it('should set status title to title of the copy', () => {
				const { originalBoard, originalCourse, user } = setup();

				const result = copyService.copyCourse({
					originalCourse,
					originalBoard,
					user,
				});

				expect(result.status.title).toEqual(result.copy.name);
			});

			it('should set status of metadata', () => {
				const { originalBoard, originalCourse, user } = setup();

				const result = copyService.copyCourse({
					originalCourse,
					originalBoard,
					user,
				});

				const metadataStatus = result.status.elements?.find(
					(el) => el.type === CopyElementType.LEAF && el.title === 'metadata'
				);
				expect(metadataStatus).toBeDefined();
				expect(metadataStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should set status of teachers', () => {
				const { originalBoard, originalCourse, user } = setup();

				const result = copyService.copyCourse({
					originalCourse,
					originalBoard,
					user,
				});

				const teachersStatus = result.status.elements?.find(
					(el) => el.type === CopyElementType.LEAF && el.title === 'teachers'
				);
				expect(teachersStatus).toBeDefined();
				expect(teachersStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
			});

			it('should set status of substitutionTeachers', () => {
				const { originalBoard, originalCourse, user } = setup();

				const result = copyService.copyCourse({
					originalCourse,
					originalBoard,
					user,
				});

				const substitutionTeachersStatus = result.status.elements?.find(
					(el) => el.type === CopyElementType.LEAF && el.title === 'substitutionTeachers'
				);
				expect(substitutionTeachersStatus).toBeDefined();
				expect(substitutionTeachersStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
			});

			it('should set status of students', () => {
				const { originalBoard, originalCourse, user } = setup();

				const result = copyService.copyCourse({
					originalCourse,
					originalBoard,
					user,
				});

				const studentsStatus = result.status.elements?.find(
					(el) => el.type === CopyElementType.LEAF && el.title === 'students'
				);
				expect(studentsStatus).toBeDefined();
				expect(studentsStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
			});

			it('should set status of classes', () => {
				const { originalBoard, originalCourse, user } = setup();

				const result = copyService.copyCourse({
					originalCourse,
					originalBoard,
					user,
				});

				const classesStatus = result.status.elements?.find(
					(el) => el.type === CopyElementType.LEAF && el.title === 'classes'
				);
				expect(classesStatus).toBeDefined();
				expect(classesStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
			});

			it('should set status of ltiTools', () => {
				const { originalBoard, originalCourse, user } = setup();

				const result = copyService.copyCourse({
					originalCourse,
					originalBoard,
					user,
				});

				const ltiToolsStatus = result.status.elements?.find(
					(el) => el.type === CopyElementType.LEAF && el.title === 'ltiTools'
				);
				expect(ltiToolsStatus).toBeDefined();
				expect(ltiToolsStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
			});

			it('should set status of tasks', () => {
				const { originalBoard, originalCourse, user } = setup();

				const result = copyService.copyCourse({
					originalCourse,
					originalBoard,
					user,
				});

				const tasksStatus = result.status.elements?.find(
					(el) => el.type === CopyElementType.TASK && el.title === 'tasks'
				);
				expect(tasksStatus).toBeDefined();
				expect(tasksStatus?.status).toEqual(CopyStatusEnum.NOT_IMPLEMENTED);
			});

			it('should set status of times', () => {
				const { originalBoard, originalCourse, user } = setup();

				const result = copyService.copyCourse({
					originalCourse,
					originalBoard,
					user,
				});

				const timesStatus = result.status.elements?.find(
					(el) => el.type === CopyElementType.LEAF && el.title === 'times'
				);
				expect(timesStatus).toBeDefined();
				expect(timesStatus?.status).toEqual(CopyStatusEnum.NOT_IMPLEMENTED);
			});

			it('should set status of lessons', () => {
				const { originalBoard, originalCourse, user } = setup();

				const result = copyService.copyCourse({
					originalCourse,
					originalBoard,
					user,
				});

				const lessonsStatus = result.status.elements?.find(
					(el) => el.type === CopyElementType.LEAF && el.title === 'lessons'
				);
				expect(lessonsStatus).toBeDefined();
				expect(lessonsStatus?.status).toEqual(CopyStatusEnum.NOT_IMPLEMENTED);
			});

			it('should set status of files', () => {
				const { originalBoard, originalCourse, user } = setup();

				const result = copyService.copyCourse({
					originalCourse,
					originalBoard,
					user,
				});

				const filesStatus = result.status.elements?.find(
					(el) => el.type === CopyElementType.FILE && el.title === 'files'
				);
				expect(filesStatus).toBeDefined();
				expect(filesStatus?.status).toEqual(CopyStatusEnum.NOT_IMPLEMENTED);
			});

			it('should set status of coursegroups', () => {
				const { originalBoard, originalCourse, user } = setup();

				const result = copyService.copyCourse({
					originalCourse,
					originalBoard,
					user,
				});

				const coursegroupsStatus = result.status.elements?.find(
					(el) => el.type === CopyElementType.LEAF && el.title === 'coursegroups'
				);
				expect(coursegroupsStatus).toBeDefined();
				expect(coursegroupsStatus?.status).toEqual(CopyStatusEnum.NOT_IMPLEMENTED);
			});

			it('should add status of board to copy status', () => {
				const { originalBoard, originalCourse, user, boardCopyStatus } = setup();

				const result = copyService.copyCourse({
					originalCourse,
					originalBoard,
					user,
				});

				const coursegroupsStatus = result.status.elements?.find(
					(el) => el.type === boardCopyStatus.status.type && el.title === boardCopyStatus.status.title
				);
				expect(coursegroupsStatus).toBeDefined();
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
				const { originalBoard, originalCourse, user } = setupWithAdditionalUsers();

				const result = copyService.copyCourse({
					originalCourse,
					originalBoard,
					user,
				});

				expect(result.copy.students.length).toEqual(0);
			});

			it('should not set any additional teachers', () => {
				const { originalBoard, originalCourse, user } = setupWithAdditionalUsers();

				const result = copyService.copyCourse({
					originalCourse,
					originalBoard,
					user,
				});

				expect(result.copy.teachers.length).toEqual(1);
			});

			it('should not set any substitution Teachers in the copy', () => {
				const { originalBoard, originalCourse, user } = setupWithAdditionalUsers();

				const result = copyService.copyCourse({
					originalCourse,
					originalBoard,
					user,
				});

				expect(result.copy.substitutionTeachers.length).toEqual(0);
			});
		});
	});
});
