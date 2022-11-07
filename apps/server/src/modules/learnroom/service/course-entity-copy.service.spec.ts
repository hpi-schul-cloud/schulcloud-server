import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CopyHelperService, Course } from '@shared/domain';
import { CopyElementType, CopyStatusEnum } from '@shared/domain/types';
import {
	boardFactory,
	courseFactory,
	courseGroupFactory,
	schoolFactory,
	setupEntities,
	userFactory,
} from '@shared/testing';
import { BoardCopyService } from './board-copy.service';
import { CourseEntityCopyService } from './course-entity-copy.service';

describe('course entity copy service', () => {
	let module: TestingModule;
	let copyService: CourseEntityCopyService;
	let boardCopyService: DeepMocked<BoardCopyService>;
	let copyHelperService: DeepMocked<CopyHelperService>;

	beforeAll(async () => {
		await setupEntities();
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				CourseEntityCopyService,
				{
					provide: BoardCopyService,
					useValue: createMock<BoardCopyService>(),
				},
				{
					provide: CopyHelperService,
					useValue: createMock<CopyHelperService>(),
				},
			],
		}).compile();

		copyService = module.get(CourseEntityCopyService);
		boardCopyService = module.get(BoardCopyService);
		copyHelperService = module.get(CopyHelperService);
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
				const copyName = 'Copy';
				boardCopyService.copyBoard.mockResolvedValue(boardCopyStatus);
				copyHelperService.deriveStatusFromElements.mockReturnValue(CopyStatusEnum.PARTIAL);

				return { user, originalCourse, boardCopyStatus, copyName };
			};

			it('should assign user as teacher', () => {
				const { originalCourse, user, copyName } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
					copyName,
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

			it('should use provided copyName', () => {
				const { originalCourse, user } = setup();
				const copyName = 'Name of the Copy';

				const status = copyService.copyCourse({
					originalCourse,
					user,
					copyName,
				});

				expect((status.copyEntity as Course).name).toEqual(copyName);
			});

			it('should use original courseName if no copyName is provided', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				expect((status.copyEntity as Course).name).toEqual(originalCourse.name);
			});

			it('should set start date of course', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const course = status.copyEntity as Course;
				expect(user.school.schoolYear).toBeDefined();
				expect(course.startDate).toEqual(user.school.schoolYear?.startDate);
			});

			it('should set start date of course to undefined when school year is undefined', () => {
				const { originalCourse, user } = setup();
				user.school.schoolYear = undefined;

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const course = status.copyEntity as Course;
				expect(course.startDate).toEqual(undefined);
			});

			it('should set end date of course', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const course = status.copyEntity as Course;
				expect(user.school.schoolYear).toBeDefined();
				expect(course.untilDate).toEqual(user.school.schoolYear?.endDate);
			});

			it('should set end date of course- to undefined when school year is undefined', () => {
				const { originalCourse, user } = setup();
				user.school.schoolYear = undefined;

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const course = status.copyEntity as Course;
				expect(course.untilDate).toEqual(undefined);
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
			it('should set original entity in status', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				expect(status.originalEntity).toEqual(originalCourse);
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

				const metadataStatus = status.elements?.find((el) => el.type === CopyElementType.METADATA);
				expect(metadataStatus).toBeDefined();
				expect(metadataStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should set status of users', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const teachersStatus = status.elements?.find((el) => el.type === CopyElementType.USER_GROUP);
				expect(teachersStatus).toBeDefined();
				expect(teachersStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
			});

			it('should set status of ltiTools', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const ltiToolsStatus = status.elements?.find((el) => el.type === CopyElementType.LTITOOL_GROUP);
				expect(ltiToolsStatus).toBeDefined();
				expect(ltiToolsStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
			});

			it('should set status of times', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const timesStatus = status.elements?.find((el) => el.type === CopyElementType.TIME_GROUP);
				expect(timesStatus).toBeDefined();
				expect(timesStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
			});

			it('should not set status of course groups in absence of course groups', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const coursegroupsStatus = status.elements?.find((el) => el.type === CopyElementType.COURSEGROUP_GROUP);
				expect(coursegroupsStatus).not.toBeDefined();
			});

			it('should call copyHelperService', () => {
				const { originalCourse, user } = setup();

				copyService.copyCourse({
					originalCourse,
					user,
				});
				expect(copyHelperService.deriveStatusFromElements).toHaveBeenCalled();
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

		describe('when course contains course groups', () => {
			const setupWithCourseGroups = () => {
				const user = userFactory.build();
				const originalCourse = courseFactory.build();
				courseGroupFactory.build({ course: originalCourse });

				const boardCopy = boardFactory.build();
				const boardCopyStatus = {
					title: 'board',
					type: CopyElementType.BOARD,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: boardCopy,
				};
				boardCopyService.copyBoard.mockResolvedValue(boardCopyStatus);
				copyHelperService.deriveStatusFromElements.mockReturnValue(CopyStatusEnum.PARTIAL);

				return { user, originalCourse };
			};
			it('should set status of coursegroups', () => {
				const { originalCourse, user } = setupWithCourseGroups();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const coursegroupsStatus = status.elements?.find((el) => el.type === CopyElementType.COURSEGROUP_GROUP);
				expect(coursegroupsStatus).toBeDefined();
				expect(coursegroupsStatus?.status).toEqual(CopyStatusEnum.NOT_IMPLEMENTED);
			});
		});
	});
});
