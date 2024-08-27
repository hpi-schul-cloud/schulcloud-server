import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CopyElementType, CopyHelperService, CopyStatusEnum } from '@modules/copy-helper';
import { LessonCopyService } from '@modules/lesson/service';
import { ToolContextType } from '@modules/tool/common/enum';
import { ContextExternalTool } from '@modules/tool/context-external-tool/domain';
import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import { ToolConfig } from '@modules/tool/tool-config';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Course } from '@shared/domain/entity';
import { CourseRepo, LegacyBoardRepo, UserRepo } from '@shared/repo';
import {
	boardFactory,
	courseFactory,
	courseGroupFactory,
	schoolEntityFactory,
	setupEntities,
	userFactory,
} from '@shared/testing';
import { contextExternalToolFactory } from '../../tool/context-external-tool/testing';
import { BoardCopyService } from './board-copy.service';
import { CourseCopyService } from './course-copy.service';
import { CourseRoomsService } from './course-rooms.service';

describe('course copy service', () => {
	let module: TestingModule;
	let service: CourseCopyService;
	let courseRepo: DeepMocked<CourseRepo>;
	let boardRepo: DeepMocked<LegacyBoardRepo>;
	let roomsService: DeepMocked<CourseRoomsService>;
	let boardCopyService: DeepMocked<BoardCopyService>;
	let lessonCopyService: DeepMocked<LessonCopyService>;
	let copyHelperService: DeepMocked<CopyHelperService>;
	let userRepo: DeepMocked<UserRepo>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let configService: DeepMocked<ConfigService<ToolConfig, true>>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		await setupEntities();
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
					provide: LegacyBoardRepo,
					useValue: createMock<LegacyBoardRepo>(),
				},
				{
					provide: CourseRoomsService,
					useValue: createMock<CourseRoomsService>(),
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
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: ContextExternalToolService,
					useValue: createMock<ContextExternalToolService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<ToolConfig, true>>(),
				},
			],
		}).compile();

		service = module.get(CourseCopyService);
		courseRepo = module.get(CourseRepo);
		boardRepo = module.get(LegacyBoardRepo);
		roomsService = module.get(CourseRoomsService);
		boardCopyService = module.get(BoardCopyService);
		lessonCopyService = module.get(LessonCopyService);
		copyHelperService = module.get(CopyHelperService);
		userRepo = module.get(UserRepo);
		contextExternalToolService = module.get(ContextExternalToolService);
		configService = module.get(ConfigService);
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
			const tools: ContextExternalTool[] = contextExternalToolFactory.buildList(2);

			userRepo.findById.mockResolvedValue(user);
			courseRepo.findById.mockResolvedValue(course);
			courseRepo.findAllByUserId.mockResolvedValue([allCourses, allCourses.length]);
			boardRepo.findByCourseId.mockResolvedValue(originalBoard);
			roomsService.updateLegacyBoard.mockResolvedValue(originalBoard);
			contextExternalToolService.findAllByContext.mockResolvedValue(tools);

			const courseCopyName = 'Copy';
			copyHelperService.deriveCopyName.mockReturnValue(courseCopyName);
			copyHelperService.deriveStatusFromElements.mockReturnValue(CopyStatusEnum.SUCCESS);

			const boardCopyStatus = {
				title: 'boardCopy',
				type: CopyElementType.BOARD,
				status: CopyStatusEnum.SUCCESS,
				copyEntity: boardFactory.build(),
				elements: [],
			};
			boardCopyService.copyBoard.mockResolvedValue(boardCopyStatus);

			lessonCopyService.updateCopiedEmbeddedTasks.mockReturnValue(boardCopyStatus);

			configService.get.mockReturnValue(true);

			return {
				user,
				course,
				originalBoard,
				courseCopy,
				boardCopy,
				courseCopyName,
				allCourses,
				boardCopyStatus,
				tools,
			};
		};

		it('should fetch the user', async () => {
			const { course, user } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(userRepo.findById).toBeCalledWith(user.id, true);
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
			const { course, originalBoard, user, courseCopyName } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			const expectedDestinationCourse = expect.objectContaining({ name: courseCopyName }) as Course;
			expect(boardCopyService.copyBoard).toBeCalledWith(
				expect.objectContaining({ originalBoard, destinationCourse: expectedDestinationCourse, user })
			);
		});

		it('should return status', async () => {
			const { course, user, courseCopyName } = setup();
			const result = await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(result).toEqual(
				expect.objectContaining({
					title: courseCopyName,
					type: CopyElementType.COURSE,
					status: CopyStatusEnum.SUCCESS,
				})
			);
		});

		it('should ensure course has up to date board', async () => {
			const { course, user, originalBoard } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(roomsService.updateLegacyBoard).toHaveBeenCalledWith(originalBoard, course.id, user.id);
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

		it('should use findAllByUserId to determine existing course names', async () => {
			const { course, user } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });

			expect(courseRepo.findAllByUserId).toHaveBeenCalledWith(user.id);
		});

		it('should set status type to course', async () => {
			const { course, user } = setup();
			const status = await service.copyCourse({ userId: user.id, courseId: course.id });

			expect(status.type).toEqual(CopyElementType.COURSE);
		});

		it('should set original entity in status', async () => {
			const { course, user } = setup();
			const status = await service.copyCourse({ userId: user.id, courseId: course.id });

			expect(status.originalEntity).toEqual(course);
		});

		it('should set status to success', async () => {
			const { course, user } = setup();
			const status = await service.copyCourse({ userId: user.id, courseId: course.id });

			expect(status.status).toEqual(CopyStatusEnum.SUCCESS);
		});

		it('should set status title to title of the copy', async () => {
			const { course, user } = setup();
			const status = await service.copyCourse({ userId: user.id, courseId: course.id });

			expect(status.title).toEqual((status.copyEntity as Course).name);
		});

		it('should set static statuses (metadata, ltitools, usergroup, timegroup)', async () => {
			const { course, user } = setup();
			const status = await service.copyCourse({ userId: user.id, courseId: course.id });

			const metadataStatus = status.elements?.find((el) => el.type === CopyElementType.METADATA);
			const ltiToolsStatus = status.elements?.find((el) => el.type === CopyElementType.LTITOOL_GROUP);
			const teachersStatus = status.elements?.find((el) => el.type === CopyElementType.USER_GROUP);
			const timesStatus = status.elements?.find((el) => el.type === CopyElementType.TIME_GROUP);

			expect(metadataStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
			expect(ltiToolsStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
			expect(teachersStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
			expect(timesStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
		});

		it('should not set status of course groups in absence of course groups', async () => {
			const { course, user } = setup();
			const status = await service.copyCourse({ userId: user.id, courseId: course.id });
			const coursegroupsStatus = status.elements?.find((el) => el.type === CopyElementType.COURSEGROUP_GROUP);

			expect(coursegroupsStatus).not.toBeDefined();
		});

		it('should call copyHelperService', async () => {
			const { course, user } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });

			expect(copyHelperService.deriveStatusFromElements).toHaveBeenCalled();
		});

		it('should assign user as teacher', async () => {
			const { course, user } = setup();
			const status = await service.copyCourse({ userId: user.id, courseId: course.id });
			const courseCopy = status.copyEntity as Course;

			expect(courseCopy.teachers ?? []).toContain(user);
		});

		it('should set school of user', async () => {
			const { course } = setup();

			const destinationSchool = schoolEntityFactory.buildWithId();
			const targetUser = userFactory.build({ school: destinationSchool });
			userRepo.findById.mockResolvedValue(targetUser);

			const status = await service.copyCourse({ userId: targetUser.id, courseId: course.id });
			const courseCopy = status.copyEntity as Course;

			expect(courseCopy.school.name).toEqual(targetUser.school.name);
		});

		it('should set start date of course', async () => {
			const { course, user } = setup();
			const status = await service.copyCourse({ userId: user.id, courseId: course.id });
			const courseCopy = status.copyEntity as Course;

			expect(courseCopy.startDate).toEqual(user.school.currentYear?.startDate);
		});

		it('should set start and end-date of course to undefined when school year is undefined', async () => {
			const { course, user } = setup();
			user.school.currentYear = undefined;
			const status = await service.copyCourse({ userId: user.id, courseId: course.id });
			const courseCopy = status.copyEntity as Course;

			expect(courseCopy.startDate).toEqual(undefined);
			expect(courseCopy.untilDate).toEqual(undefined);
		});

		it('should set end date of course', async () => {
			const { course, user } = setup();
			const status = await service.copyCourse({ userId: user.id, courseId: course.id });
			const courseCopy = status.copyEntity as Course;

			expect(courseCopy.untilDate).toEqual(user.school.currentYear?.endDate);
		});

		it('should set color of course', async () => {
			const { course, user } = setup();
			const status = await service.copyCourse({ userId: user.id, courseId: course.id });
			const courseCopy = status.copyEntity as Course;

			expect(courseCopy.color).toEqual(course.color);
		});

		it('should find all ctl tools for this course', async () => {
			const { course, user } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });

			expect(contextExternalToolService.findAllByContext).toHaveBeenCalledWith({
				id: course.id,
				type: ToolContextType.COURSE,
			});
		});

		it('should copy all ctl tools', async () => {
			const { course, user, tools } = setup();
			const status = await service.copyCourse({ userId: user.id, courseId: course.id });
			const courseCopy = status.copyEntity as Course;

			expect(contextExternalToolService.copyContextExternalTool).toHaveBeenCalledWith(tools[0], courseCopy.id);
			expect(contextExternalToolService.copyContextExternalTool).toHaveBeenCalledWith(tools[1], courseCopy.id);
		});
	});

	describe('when FEATURE_CTL_TOOLS_COPY_ENABLED is false', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const allCourses = courseFactory.buildList(3, { teachers: [user] });
			const course = allCourses[0];
			const originalBoard = boardFactory.build({ course });

			userRepo.findById.mockResolvedValue(user);
			courseRepo.findById.mockResolvedValue(course);
			courseRepo.findAllByUserId.mockResolvedValue([allCourses, allCourses.length]);
			boardRepo.findByCourseId.mockResolvedValue(originalBoard);
			roomsService.updateLegacyBoard.mockResolvedValue(originalBoard);

			const courseCopyName = 'Copy';
			copyHelperService.deriveCopyName.mockReturnValue(courseCopyName);
			copyHelperService.deriveStatusFromElements.mockReturnValue(CopyStatusEnum.SUCCESS);

			const boardCopyStatus = {
				title: 'boardCopy',
				type: CopyElementType.BOARD,
				status: CopyStatusEnum.SUCCESS,
				copyEntity: boardFactory.build(),
				elements: [],
			};
			boardCopyService.copyBoard.mockResolvedValue(boardCopyStatus);

			lessonCopyService.updateCopiedEmbeddedTasks.mockReturnValue(boardCopyStatus);

			configService.get.mockReturnValue(false);

			return {
				user,
				course,
			};
		};

		it('should not find ctl tools', async () => {
			const { course, user } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });

			expect(contextExternalToolService.findAllByContext).not.toHaveBeenCalled();
		});

		it('should not copy ctl tools', async () => {
			const { course, user } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });

			expect(contextExternalToolService.copyContextExternalTool).not.toHaveBeenCalled();
		});
	});

	describe('when course is empty', () => {
		const setup = () => {
			const user = userFactory.build();
			const course = courseFactory.build();
			courseRepo.findById.mockResolvedValue(course);
			courseRepo.findAllByUserId.mockResolvedValue([[course], 1]);
			userRepo.findById.mockResolvedValue(user);
			// boardRepo.findByCourseId.mockResolvedValue(originalBoard);
			// roomsService.updateBoard.mockResolvedValue(originalBoard);
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

			return { user, course, boardCopyStatus, copyName };
		};

		describe('copy course entity', () => {
			it('should assign user as teacher', async () => {
				const { course } = setup();
				const destinationSchool = schoolEntityFactory.buildWithId();
				const targetUser = userFactory.build({ school: destinationSchool });
				userRepo.findById.mockResolvedValue(targetUser);
				const status = await service.copyCourse({ userId: targetUser.id, courseId: course.id });
				const courseCopy = status.copyEntity as Course;

				expect(courseCopy.teachers).toContain(targetUser);
			});

			it('should set school of user', async () => {
				const { course } = setup();
				const destinationSchool = schoolEntityFactory.buildWithId();
				const targetUser = userFactory.build({ school: destinationSchool });
				userRepo.findById.mockResolvedValue(targetUser);
				const status = await service.copyCourse({ userId: targetUser.id, courseId: course.id });
				const courseCopy = status.copyEntity as Course;

				expect(courseCopy.school.name).toEqual(destinationSchool.name);
			});

			it('should set start date of course', async () => {
				const { course, user } = setup();
				const status = await service.copyCourse({ userId: user.id, courseId: course.id });
				const courseCopy = status.copyEntity as Course;

				expect(courseCopy.startDate).toEqual(user.school.currentYear?.startDate);
			});

			it('should set start date and until date of course to undefined when school year is undefined', async () => {
				const { course, user } = setup();
				user.school.currentYear = undefined;
				const status = await service.copyCourse({ userId: user.id, courseId: course.id });
				const courseCopy = status.copyEntity as Course;

				expect(courseCopy.startDate).toBeUndefined();
				expect(courseCopy.untilDate).toBeUndefined();
			});

			it('should set end date of course', async () => {
				const { course, user } = setup();
				const status = await service.copyCourse({ userId: user.id, courseId: course.id });
				const courseCopy = status.copyEntity as Course;

				expect(courseCopy.untilDate).toEqual(user.school.currentYear?.endDate);
			});

			it('should set color of course', async () => {
				const { course, user } = setup();
				const status = await service.copyCourse({ userId: user.id, courseId: course.id });
				const courseCopy = status.copyEntity as Course;

				expect(courseCopy.color).toEqual(course.color);
			});
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

			courseRepo.findById.mockResolvedValue(originalCourse);
			courseRepo.findAllByUserId.mockResolvedValue([[originalCourse], 1]);

			userRepo.findById.mockResolvedValue(user);
			boardRepo.findByCourseId.mockResolvedValue(originalBoard);
			roomsService.updateLegacyBoard.mockResolvedValue(originalBoard);

			const courseCopyName = 'Copy';
			copyHelperService.deriveCopyName.mockReturnValue(courseCopyName);
			copyHelperService.deriveStatusFromElements.mockReturnValue(CopyStatusEnum.SUCCESS);

			return { user, originalBoard, originalCourse };
		};

		it('should not set any students in the copy', async () => {
			const { originalCourse, user } = setupWithAdditionalUsers();
			const status = await service.copyCourse({ userId: user.id, courseId: originalCourse.id });
			const courseCopy = status.copyEntity as Course;

			expect(courseCopy.students.length).toEqual(0);
		});

		it('should not set any additional teachers', async () => {
			const { originalCourse, user } = setupWithAdditionalUsers();
			const status = await service.copyCourse({ userId: user.id, courseId: originalCourse.id });
			const courseCopy = status.copyEntity as Course;

			expect(courseCopy.teachers.length).toEqual(1);
		});

		it('should not set any substitution Teachers in the copy', async () => {
			const { originalCourse, user } = setupWithAdditionalUsers();
			const status = await service.copyCourse({ userId: user.id, courseId: originalCourse.id });
			const courseCopy = status.copyEntity as Course;

			expect(courseCopy.substitutionTeachers.length).toEqual(0);
		});
	});

	describe('when course contains course groups', () => {
		const setupWithCourseGroups = () => {
			const user = userFactory.build();
			const originalCourse = courseFactory.build();
			const originalBoard = boardFactory.build({ course: originalCourse });
			courseGroupFactory.build({ course: originalCourse });
			courseRepo.findById.mockResolvedValue(originalCourse);
			courseRepo.findAllByUserId.mockResolvedValue([[originalCourse], 1]);

			userRepo.findById.mockResolvedValue(user);
			boardRepo.findByCourseId.mockResolvedValue(originalBoard);
			roomsService.updateLegacyBoard.mockResolvedValue(originalBoard);

			const boardCopy = boardFactory.build();
			const boardCopyStatus = {
				title: 'board',
				type: CopyElementType.BOARD,
				status: CopyStatusEnum.SUCCESS,
				copyEntity: boardCopy,
			};
			boardCopyService.copyBoard.mockResolvedValue(boardCopyStatus);
			// copyHelperService.deriveStatusFromElements.mockReturnValue(CopyStatusEnum.PARTIAL);

			return { user, originalCourse, boardCopyStatus };
		};

		it('should set status of coursegroups', async () => {
			const { originalCourse, user } = setupWithCourseGroups();

			const status = await service.copyCourse({ userId: user.id, courseId: originalCourse.id });
			const coursegroupsStatus = status.elements?.find((el) => el.type === CopyElementType.COURSEGROUP_GROUP);

			expect(coursegroupsStatus).toBeDefined();
			expect(coursegroupsStatus?.status).toEqual(CopyStatusEnum.NOT_IMPLEMENTED);
		});
	});
});
