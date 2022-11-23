import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { CopyElementType, CopyHelperService, CopyStatusEnum, Course } from '@shared/domain';
import { BoardRepo, CourseRepo, UserRepo } from '@shared/repo';
import {
	boardFactory,
	courseFactory,
	courseGroupFactory,
	schoolFactory,
	setupEntities,
	userFactory,
} from '@shared/testing';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { BoardCopyService } from './board-copy.service';
import { CourseCopyService } from './course-copy.service';
import { CourseEntityCopyService } from './course-entity-copy.service';
import { LessonCopyService } from './lesson-copy.service';
import { RoomsService } from './rooms.service';

describe('course copy service', () => {
	let module: TestingModule;
	let service: CourseCopyService;
	let courseRepo: DeepMocked<CourseRepo>;
	let boardRepo: DeepMocked<BoardRepo>;
	let roomsService: DeepMocked<RoomsService>;
	let courseEntityCopyService: DeepMocked<CourseEntityCopyService>;
	let boardCopyService: DeepMocked<BoardCopyService>;
	let lessonCopyService: DeepMocked<LessonCopyService>;
	let copyHelperService: DeepMocked<CopyHelperService>;
	let authorization: DeepMocked<AuthorizationService>;
	let orm: MikroORM;

	afterAll(async () => {
		await orm.close();
		await module.close();
	});

	beforeAll(async () => {
		orm = await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				CourseCopyService,
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
				{
					provide: BoardRepo,
					useValue: createMock<BoardRepo>(),
				},
				{
					provide: RoomsService,
					useValue: createMock<RoomsService>(),
				},
				{
					provide: CourseEntityCopyService,
					useValue: createMock<CourseEntityCopyService>(),
				},
				{
					provide: BoardCopyService,
					useValue: createMock<BoardCopyService>(),
				},
				{
					provide: LessonCopyService,
					useValue: createMock<LessonCopyService>(),
				},
				{
					provide: CopyHelperService,
					useValue: createMock<CopyHelperService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		service = module.get(CourseCopyService);
		courseRepo = module.get(CourseRepo);
		boardRepo = module.get(BoardRepo);
		roomsService = module.get(RoomsService);
		courseEntityCopyService = module.get(CourseEntityCopyService);
		boardCopyService = module.get(BoardCopyService);
		lessonCopyService = module.get(LessonCopyService);
		copyHelperService = module.get(CopyHelperService);
		authorization = module.get(AuthorizationService);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('copy course', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const allCourses = courseFactory.buildList(3, { teachers: [user] });
			const course = allCourses[0];
			const originalBoard = boardFactory.build({ course });
			const courseCopy = courseFactory.buildWithId({ teachers: [user] });
			const boardCopy = boardFactory.build({ course: courseCopy });

			authorization.getUserWithPermissions.mockResolvedValue(user);
			courseRepo.findById.mockResolvedValue(course);
			courseRepo.findAllByUserId.mockResolvedValue([allCourses, allCourses.length]);
			boardRepo.findByCourseId.mockResolvedValue(originalBoard);
			authorization.checkPermission.mockReturnValue();
			roomsService.updateBoard.mockResolvedValue(originalBoard);

			const courseCopyName = 'Copy';
			copyHelperService.deriveCopyName.mockReturnValue(courseCopyName);
			copyHelperService.deriveStatusFromElements.mockReturnValue(CopyStatusEnum.SUCCESS);

			const boardCopyStatus = {
				title: 'boardCopy',
				type: CopyElementType.BOARD,
				status: CopyStatusEnum.SUCCESS,
				copyEntity: boardCopy,
			};
			boardCopyService.copyBoard.mockResolvedValue(boardCopyStatus);

			lessonCopyService.updateCopiedEmbeddedTasks.mockReturnValue(boardCopyStatus);

			const status = {
				title: 'courseCopy',
				type: CopyElementType.COURSE,
				status: CopyStatusEnum.SUCCESS,
				copyEntity: courseCopy,
			};

			courseEntityCopyService.copyCourse.mockReturnValue(status);

			return {
				user,
				course,
				originalBoard,
				courseCopy,
				boardCopy,
				status,
				courseCopyName,
				allCourses,
				boardCopyStatus,
			};
		};

		it('should fetch the user', async () => {
			const { course, user } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(authorization.getUserWithPermissions).toBeCalledWith(user.id);
		});

		it('should fetch original course', async () => {
			const { course, user } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(courseRepo.findById).toBeCalledWith(course.id);
		});

		it('should fetch original board', async () => {
			const { course, user } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(boardRepo.findByCourseId).toBeCalledWith(course.id);
		});

		it('should persist course copy', async () => {
			const { course, user } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(courseRepo.createCourse).toBeCalled();
		});

		it('should call board copy service', async () => {
			const { course, originalBoard, user } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			const expectedDestinationCourse = expect.objectContaining({ name: 'Copy' }) as Course;
			expect(boardCopyService.copyBoard).toBeCalledWith(
				expect.objectContaining({ originalBoard, destinationCourse: expectedDestinationCourse, user })
			);
		});

		it('should persist board copy', async () => {
			const { course, user, boardCopy } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(boardRepo.save).toBeCalledWith(boardCopy);
		});

		it('should return status', async () => {
			const { course, user, status } = setup();
			const result = await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(result).toEqual(
				expect.objectContaining({ title: 'Copy', type: CopyElementType.COURSE, status: CopyStatusEnum.SUCCESS })
			);
		});

		it('should ensure course has up to date board', async () => {
			const { course, user, originalBoard } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(roomsService.updateBoard).toHaveBeenCalledWith(originalBoard, course.id, user.id);
		});

		it('should use deriveCopyName from copyHelperService', async () => {
			const { course, user, allCourses } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			const allCourseNames = allCourses.map((c) => c.name);
			expect(copyHelperService.deriveCopyName).toHaveBeenCalledWith(course.name, allCourseNames);
		});

		it('should use deriveStatusFromElements from copyHelperService', async () => {
			const { course, user } = setup();
			const result = await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(copyHelperService.deriveStatusFromElements).toHaveBeenCalledWith(result.elements);
		});

		it('should use lessonCopyService.updateCopiedEmbeddedTasks', async () => {
			const { course, user } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(lessonCopyService.updateCopiedEmbeddedTasks).toHaveBeenCalled();
		});

		it('should use findAllByUserId to determine existing course names', async () => {
			const { course, user } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(courseRepo.findAllByUserId).toHaveBeenCalledWith(user.id);
		});
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

			describe('copy course entity', () => {
				it('should assign user as teacher', async () => {
					const { originalCourse, user, copyName } = setup();

					const courseCopy = await service.copyCourseEntity({
						originalCourse,
						user,
						copyName,
					});

					expect(courseCopy.teachers.contains(user)).toEqual(true);
				});

				it('should set school of user', async () => {
					const { originalCourse } = setup();

					const destinationSchool = schoolFactory.buildWithId();
					const user = userFactory.build({ school: destinationSchool });

					const courseCopy = await service.copyCourseEntity({
						originalCourse,
						user,
					});

					expect(courseCopy.school).toEqual(destinationSchool);
				});

				it('should use provided copyName', async () => {
					const { originalCourse, user } = setup();
					const copyName = 'Name of the Copy';

					const courseCopy = await service.copyCourseEntity({
						originalCourse,
						user,
						copyName,
					});

					expect(courseCopy.name).toEqual(copyName);
				});

				it('should use original courseName if no copyName is provided', async () => {
					const { originalCourse, user } = setup();

					const courseCopy = await service.copyCourseEntity({
						originalCourse,
						user,
					});

					expect(courseCopy.name).toEqual(originalCourse.name);
				});

				it('should set start date of course', async () => {
					const { originalCourse, user } = setup();

					const courseCopy = await service.copyCourseEntity({
						originalCourse,
						user,
					});

					expect(user.school.schoolYear).toBeDefined();
					expect(courseCopy.startDate).toEqual(user.school.schoolYear?.startDate);
				});

				it('should set start date of course to undefined when school year is undefined', async () => {
					const { originalCourse, user } = setup();
					user.school.schoolYear = undefined;

					const courseCopy = await service.copyCourseEntity({
						originalCourse,
						user,
					});

					expect(courseCopy.startDate).toEqual(undefined);
				});

				it('should set end date of course', async () => {
					const { originalCourse, user } = setup();

					const courseCopy = await service.copyCourseEntity({
						originalCourse,
						user,
					});

					expect(user.school.schoolYear).toBeDefined();
					expect(courseCopy.untilDate).toEqual(user.school.schoolYear?.endDate);
				});

				it('should set end date of course- to undefined when school year is undefined', async () => {
					const { originalCourse, user } = setup();
					user.school.schoolYear = undefined;

					const courseCopy = await service.copyCourseEntity({
						originalCourse,
						user,
					});

					expect(courseCopy.untilDate).toEqual(undefined);
				});

				it('should set color of course', async () => {
					const { originalCourse, user } = setup();

					const courseCopy = await service.copyCourseEntity({
						originalCourse,
						user,
					});

					expect(courseCopy.color).toEqual(originalCourse.color);
				});
			});

			it('should set status type to course', async () => {
				const { originalCourse, user } = setup();

				const courseCopy = await service.copyCourseEntity({
					originalCourse,
					user,
				});
				const status = service.getDefaultCourseStatus(originalCourse, courseCopy);

				expect(status.type).toEqual(CopyElementType.COURSE);
			});

			it('should set original entity in status', async () => {
				const { originalCourse, user } = setup();

				const courseCopy = await service.copyCourseEntity({
					originalCourse,
					user,
				});
				const status = service.getDefaultCourseStatus(originalCourse, courseCopy);

				expect(status.originalEntity).toEqual(originalCourse);
			});

			it('should set status to partial', async () => {
				const { originalCourse, user } = setup();

				const courseCopy = await service.copyCourseEntity({
					originalCourse,
					user,
				});
				const status = service.getDefaultCourseStatus(originalCourse, courseCopy);

				expect(status.status).toEqual(CopyStatusEnum.PARTIAL);
			});

			it('should set status title to title of the copy', async () => {
				const { originalCourse, user } = setup();

				const courseCopy = await service.copyCourseEntity({
					originalCourse,
					user,
				});
				const status = service.getDefaultCourseStatus(originalCourse, courseCopy);

				expect(status.title).toEqual((status.copyEntity as Course).name);
			});

			it('should set status of metadata', async () => {
				const { originalCourse, user } = setup();

				const courseCopy = await service.copyCourseEntity({
					originalCourse,
					user,
				});
				const status = service.getDefaultCourseStatus(originalCourse, courseCopy);
				const metadataStatus = status.elements?.find((el) => el.type === CopyElementType.METADATA);

				expect(metadataStatus).toBeDefined();
				expect(metadataStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should set status of users', async () => {
				const { originalCourse, user } = setup();

				const courseCopy = await service.copyCourseEntity({
					originalCourse,
					user,
				});
				const status = service.getDefaultCourseStatus(originalCourse, courseCopy);
				const teachersStatus = status.elements?.find((el) => el.type === CopyElementType.USER_GROUP);

				expect(teachersStatus).toBeDefined();
				expect(teachersStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
			});

			it('should set status of ltiTools', async () => {
				const { originalCourse, user } = setup();

				const courseCopy = await service.copyCourseEntity({
					originalCourse,
					user,
				});
				const status = service.getDefaultCourseStatus(originalCourse, courseCopy);
				const ltiToolsStatus = status.elements?.find((el) => el.type === CopyElementType.LTITOOL_GROUP);

				expect(ltiToolsStatus).toBeDefined();
				expect(ltiToolsStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
			});

			it('should set status of times', async () => {
				const { originalCourse, user } = setup();

				const courseCopy = await service.copyCourseEntity({
					originalCourse,
					user,
				});

				const status = service.getDefaultCourseStatus(originalCourse, courseCopy);
				const timesStatus = status.elements?.find((el) => el.type === CopyElementType.TIME_GROUP);

				expect(timesStatus).toBeDefined();
				expect(timesStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
			});

			it('should not set status of course groups in absence of course groups', async () => {
				const { originalCourse, user } = setup();

				const courseCopy = await service.copyCourseEntity({
					originalCourse,
					user,
				});
				const status = service.getDefaultCourseStatus(originalCourse, courseCopy);
				const coursegroupsStatus = status.elements?.find((el) => el.type === CopyElementType.COURSEGROUP_GROUP);

				expect(coursegroupsStatus).not.toBeDefined();
			});

			it('should call copyHelperService', async () => {
				const { originalCourse, user } = setup();

				const courseCopy = await service.copyCourseEntity({
					originalCourse,
					user,
				});
				service.getDefaultCourseStatus(originalCourse, courseCopy);

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

			it('should not set any students in the copy', async () => {
				const { originalCourse, user } = setupWithAdditionalUsers();

				const courseCopy = await service.copyCourseEntity({
					originalCourse,
					user,
				});

				expect(courseCopy.students.length).toEqual(0);
			});

			it('should not set any additional teachers', async () => {
				const { originalCourse, user } = setupWithAdditionalUsers();

				const courseCopy = await service.copyCourseEntity({
					originalCourse,
					user,
				});

				expect(courseCopy.teachers.length).toEqual(1);
			});

			it('should not set any substitution Teachers in the copy', async () => {
				const { originalCourse, user } = setupWithAdditionalUsers();

				const courseCopy = await service.copyCourseEntity({
					originalCourse,
					user,
				});

				expect(courseCopy.substitutionTeachers.length).toEqual(0);
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

			it('should set status of coursegroups', async () => {
				const { originalCourse, user } = setupWithCourseGroups();

				const courseCopy = await service.copyCourseEntity({
					originalCourse,
					user,
				});
				const status = service.getDefaultCourseStatus(originalCourse, courseCopy);
				const coursegroupsStatus = status.elements?.find((el) => el.type === CopyElementType.COURSEGROUP_GROUP);

				expect(coursegroupsStatus).toBeDefined();
				expect(coursegroupsStatus?.status).toEqual(CopyStatusEnum.NOT_IMPLEMENTED);
			});
		});
	});
});
