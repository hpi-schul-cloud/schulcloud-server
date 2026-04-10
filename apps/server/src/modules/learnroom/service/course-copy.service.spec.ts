import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CopyElementType, CopyHelperService, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { CourseService } from '@modules/course';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory, courseGroupEntityFactory } from '@modules/course/testing';
import { LessonCopyService } from '@modules/lesson';
import { schoolEntityFactory } from '@modules/school/testing';
import { ToolContextType } from '@modules/tool/common/enum';
import { ContextExternalTool, CopyContextExternalToolRejectData } from '@modules/tool/context-external-tool/domain';
import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { schoolExternalToolFactory } from '@modules/tool/school-external-tool/testing';
import { UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import {
	contextExternalToolFactory,
	copyContextExternalToolRejectDataFactory,
} from '../../tool/context-external-tool/testing';
import { LEARNROOM_CONFIG_TOKEN, LearnroomConfig } from '../learnroom.config';
import { LegacyBoard, LegacyBoardElement, LegacyBoardRepo } from '../repo';
import { boardFactory } from '../testing';
import { CourseCopyService } from './course-copy.service';
import { CourseRoomsService } from './course-rooms.service';
import { LegacyBoardCopyService } from './legacy-board-copy.service';

describe('course copy service', () => {
	let module: TestingModule;
	let service: CourseCopyService;
	let courseService: DeepMocked<CourseService>;
	let boardRepo: DeepMocked<LegacyBoardRepo>;
	let roomsService: DeepMocked<CourseRoomsService>;
	let boardCopyService: DeepMocked<LegacyBoardCopyService>;
	let lessonCopyService: DeepMocked<LessonCopyService>;
	let copyHelperService: DeepMocked<CopyHelperService>;
	let userService: DeepMocked<UserService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let config: LearnroomConfig;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		await setupEntities([User, CourseEntity, CourseGroupEntity, LegacyBoard, LegacyBoardElement]);
		module = await Test.createTestingModule({
			providers: [
				CourseCopyService,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
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
					provide: LegacyBoardCopyService,
					useValue: createMock<LegacyBoardCopyService>(),
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
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: ContextExternalToolService,
					useValue: createMock<ContextExternalToolService>(),
				},
				{
					provide: LEARNROOM_CONFIG_TOKEN,
					useValue: {
						featureCtlToolsCopyEnabled: true,
					},
				},
			],
		}).compile();

		service = module.get(CourseCopyService);
		courseService = module.get(CourseService);
		boardRepo = module.get(LegacyBoardRepo);
		roomsService = module.get(CourseRoomsService);
		boardCopyService = module.get(LegacyBoardCopyService);
		lessonCopyService = module.get(LessonCopyService);
		copyHelperService = module.get(CopyHelperService);
		userService = module.get(UserService);
		contextExternalToolService = module.get(ContextExternalToolService);
		config = module.get<LearnroomConfig>(LEARNROOM_CONFIG_TOKEN);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('copy course', () => {
		const setup = () => {
			const school = schoolEntityFactory.buildWithId();
			const user = userFactory.buildWithId({ school });
			const allCourses = courseEntityFactory.buildList(3, { teachers: [user], school });
			const course = allCourses[0];
			const originalBoard = boardFactory.build({ course });
			const courseCopy = courseEntityFactory.buildWithId({ teachers: [user], school });
			const boardCopy = boardFactory.build({ course: courseCopy });
			const schoolTool: SchoolExternalTool = schoolExternalToolFactory.build({ schoolId: school.id });
			const tools: ContextExternalTool[] = contextExternalToolFactory.buildList(2, {
				schoolToolRef: {
					schoolToolId: schoolTool.id,
					schoolId: school.id,
				},
			});

			userService.getUserEntityWithRoles.mockResolvedValue(user);
			courseService.findById.mockResolvedValue(course);
			courseService.findAllByUserId.mockResolvedValue([allCourses, allCourses.length]);

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

			return {
				user,
				course,
				school,
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
			expect(userService.getUserEntityWithRoles).toBeCalledWith(user.id);
		});

		it('should fetch original course', async () => {
			const { course, user } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(courseService.findById).toBeCalledWith(course.id);
		});

		it('should fetch original board', async () => {
			const { course, user } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(boardRepo.findByCourseId).toBeCalledWith(course.id);
		});

		it('should persist course copy', async () => {
			const { course, user } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(courseService.create).toBeCalled();
		});

		it('should call board copy service', async () => {
			const { course, originalBoard, user, courseCopyName } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			const expectedDestinationCourse = expect.objectContaining({ name: courseCopyName }) as CourseEntity;
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
			const { course, user, school } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });

			expect(courseService.findAllByUserId).toHaveBeenCalledWith(user.id, school.id);
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

			expect(status.title).toEqual((status.copyEntity as CourseEntity).name);
		});

		it('should set static statuses (metadata, usergroup, timegroup)', async () => {
			const { course, user } = setup();
			const status = await service.copyCourse({ userId: user.id, courseId: course.id });

			const metadataStatus = status.elements?.find((el) => el.type === CopyElementType.METADATA);
			const teachersStatus = status.elements?.find((el) => el.type === CopyElementType.USER_GROUP);
			const timesStatus = status.elements?.find((el) => el.type === CopyElementType.TIME_GROUP);

			expect(metadataStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
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
			const courseCopy = status.copyEntity as CourseEntity;

			expect(courseCopy.teachers ?? []).toContain(user);
		});

		it('should set school of user', async () => {
			const { course } = setup();

			const destinationSchool = schoolEntityFactory.buildWithId();
			const targetUser = userFactory.build({ school: destinationSchool });
			userService.getUserEntityWithRoles.mockResolvedValue(targetUser);

			const status = await service.copyCourse({ userId: targetUser.id, courseId: course.id });
			const courseCopy = status.copyEntity as CourseEntity;

			expect(courseCopy.school.name).toEqual(targetUser.school.name);
		});

		it('should set start date of course', async () => {
			const { course, user } = setup();
			const status = await service.copyCourse({ userId: user.id, courseId: course.id });
			const courseCopy = status.copyEntity as CourseEntity;

			expect(courseCopy.startDate).toEqual(user.school.currentYear?.startDate);
		});

		it('should set start and end-date of course to undefined when school year is undefined', async () => {
			const { course, user } = setup();
			user.school.currentYear = undefined;
			const status = await service.copyCourse({ userId: user.id, courseId: course.id });
			const courseCopy = status.copyEntity as CourseEntity;

			expect(courseCopy.startDate).toEqual(undefined);
			expect(courseCopy.untilDate).toEqual(undefined);
		});

		it('should set end date of course', async () => {
			const { course, user } = setup();
			const status = await service.copyCourse({ userId: user.id, courseId: course.id });
			const courseCopy = status.copyEntity as CourseEntity;

			expect(courseCopy.untilDate).toEqual(user.school.currentYear?.endDate);
		});

		it('should set color of course', async () => {
			const { course, user } = setup();
			const status = await service.copyCourse({ userId: user.id, courseId: course.id });
			const courseCopy = status.copyEntity as CourseEntity;

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
			const courseCopy = status.copyEntity as CourseEntity;

			expect(contextExternalToolService.copyContextExternalTool).toHaveBeenCalledWith(
				tools[0],
				courseCopy.id,
				tools[0].schoolToolRef.schoolId
			);
			expect(contextExternalToolService.copyContextExternalTool).toHaveBeenCalledWith(
				tools[1],
				courseCopy.id,
				tools[0].schoolToolRef.schoolId
			);
		});

		describe('when the all ctl tools of course are successfully copied', () => {
			it('should return in the elements field the copy status for course tools as success', async () => {
				const { course, user } = setup();
				const status = await service.copyCourse({ userId: user.id, courseId: course.id });
				const courseToolCopyStatus: CopyStatus | undefined = status.elements?.find(
					(copyStatus: CopyStatus) => copyStatus.type === CopyElementType.EXTERNAL_TOOL
				);

				expect(courseToolCopyStatus).not.toBeUndefined();
				expect(courseToolCopyStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
			});
		});

		describe('when only some of the ctl tools of course are successfully copied', () => {
			const setupPartialCopySuccessTools = () => {
				const { course, user, tools } = setup();

				const copyRejectData = copyContextExternalToolRejectDataFactory.build();
				const mockWithCorrectType = Object.create(
					CopyContextExternalToolRejectData.prototype
				) as CopyContextExternalToolRejectData;
				Object.assign(mockWithCorrectType, { ...copyRejectData });

				contextExternalToolService.copyContextExternalTool.mockResolvedValueOnce(mockWithCorrectType);
				contextExternalToolService.copyContextExternalTool.mockResolvedValueOnce(tools[0]);

				copyHelperService.deriveStatusFromElements.mockReturnValue(CopyStatusEnum.PARTIAL);

				return { course, user };
			};

			it('should return in the elements field the copy status for course tools as partial', async () => {
				const { course, user } = setupPartialCopySuccessTools();
				const status = await service.copyCourse({ userId: user.id, courseId: course.id });
				const courseToolCopyStatus: CopyStatus | undefined = status.elements?.find(
					(copyStatus: CopyStatus) => copyStatus.type === CopyElementType.EXTERNAL_TOOL
				);

				expect(courseToolCopyStatus).not.toBeUndefined();
				expect(courseToolCopyStatus?.status).toEqual(CopyStatusEnum.PARTIAL);
			});
		});

		describe('when the all ctl tools of course failed to be copied', () => {
			const setupAllCopyFailedTools = () => {
				const { course, user } = setup();

				const copyRejectData = copyContextExternalToolRejectDataFactory.build();
				const mockWithCorrectType = Object.create(
					CopyContextExternalToolRejectData.prototype
				) as CopyContextExternalToolRejectData;
				Object.assign(mockWithCorrectType, { ...copyRejectData });

				contextExternalToolService.copyContextExternalTool.mockResolvedValueOnce(mockWithCorrectType);
				contextExternalToolService.copyContextExternalTool.mockResolvedValueOnce(mockWithCorrectType);

				copyHelperService.deriveStatusFromElements.mockReturnValue(CopyStatusEnum.FAIL);

				return { course, user };
			};

			it('should return in the elements field the copy status for course tools as partial', async () => {
				const { course, user } = setupAllCopyFailedTools();
				const status = await service.copyCourse({ userId: user.id, courseId: course.id });
				const courseToolCopyStatus: CopyStatus | undefined = status.elements?.find(
					(copyStatus: CopyStatus) => copyStatus.type === CopyElementType.EXTERNAL_TOOL
				);

				expect(courseToolCopyStatus).not.toBeUndefined();
				expect(courseToolCopyStatus?.status).toEqual(CopyStatusEnum.FAIL);
			});
		});

		describe('when there are no ctl tools to copy', () => {
			const setupNoTools = () => {
				const { course, user } = setup();

				contextExternalToolService.findAllByContext.mockResolvedValueOnce([]);

				copyHelperService.deriveStatusFromElements.mockReturnValue(CopyStatusEnum.SUCCESS);

				return { course, user };
			};

			it('should not return copy status of course tools in the elements field', async () => {
				const { course, user } = setupNoTools();

				const status = await service.copyCourse({ userId: user.id, courseId: course.id });
				const courseToolCopyStatus: CopyStatus | undefined = status.elements?.find(
					(copyStatus: CopyStatus) => copyStatus.type === CopyElementType.EXTERNAL_TOOL
				);

				expect(courseToolCopyStatus).toBeUndefined();
			});
		});
	});

	describe('when FEATURE_CTL_TOOLS_COPY_ENABLED is false', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const allCourses = courseEntityFactory.buildList(3, { teachers: [user] });
			const course = allCourses[0];
			const originalBoard = boardFactory.build({ course });

			userService.getUserEntityWithRoles.mockResolvedValue(user);
			courseService.findById.mockResolvedValue(course);
			courseService.findAllByUserId.mockResolvedValue([allCourses, allCourses.length]);
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

			config.featureCtlToolsCopyEnabled = false;

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

		it('should not return copy status of course tools in the elements field', async () => {
			const { course, user } = setup();

			const status = await service.copyCourse({ userId: user.id, courseId: course.id });
			const courseToolCopyStatus: CopyStatus | undefined = status.elements?.find(
				(copyStatus: CopyStatus) => copyStatus.type === CopyElementType.EXTERNAL_TOOL
			);

			expect(courseToolCopyStatus).toBeUndefined();
		});
	});

	describe('when course is empty', () => {
		const setup = () => {
			const user = userFactory.build();
			const course = courseEntityFactory.build();

			userService.getUserEntityWithRoles.mockResolvedValue(user);
			courseService.findById.mockResolvedValue(course);
			courseService.findAllByUserId.mockResolvedValue([[course], 1]);

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
				userService.getUserEntityWithRoles.mockResolvedValue(targetUser);
				const status = await service.copyCourse({ userId: targetUser.id, courseId: course.id });
				const courseCopy = status.copyEntity as CourseEntity;

				expect(courseCopy.teachers).toContain(targetUser);
			});

			it('should set school of user', async () => {
				const { course } = setup();
				const destinationSchool = schoolEntityFactory.buildWithId();
				const targetUser = userFactory.build({ school: destinationSchool });
				userService.getUserEntityWithRoles.mockResolvedValue(targetUser);
				const status = await service.copyCourse({ userId: targetUser.id, courseId: course.id });
				const courseCopy = status.copyEntity as CourseEntity;

				expect(courseCopy.school.name).toEqual(destinationSchool.name);
			});

			it('should set start date of course', async () => {
				const { course, user } = setup();
				const status = await service.copyCourse({ userId: user.id, courseId: course.id });
				const courseCopy = status.copyEntity as CourseEntity;

				expect(courseCopy.startDate).toEqual(user.school.currentYear?.startDate);
			});

			it('should set start date and until date of course to undefined when school year is undefined', async () => {
				const { course, user } = setup();
				user.school.currentYear = undefined;
				const status = await service.copyCourse({ userId: user.id, courseId: course.id });
				const courseCopy = status.copyEntity as CourseEntity;

				expect(courseCopy.startDate).toBeUndefined();
				expect(courseCopy.untilDate).toBeUndefined();
			});

			it('should set end date of course', async () => {
				const { course, user } = setup();
				const status = await service.copyCourse({ userId: user.id, courseId: course.id });
				const courseCopy = status.copyEntity as CourseEntity;

				expect(courseCopy.untilDate).toEqual(user.school.currentYear?.endDate);
			});

			it('should set color of course', async () => {
				const { course, user } = setup();
				const status = await service.copyCourse({ userId: user.id, courseId: course.id });
				const courseCopy = status.copyEntity as CourseEntity;

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

			const originalCourse = courseEntityFactory.build({
				teachers: [user, ...teachers],
				substitutionTeachers,
				students,
			});
			const originalBoard = boardFactory.build({ course: originalCourse });

			courseService.findById.mockResolvedValue(originalCourse);
			courseService.findAllByUserId.mockResolvedValue([[originalCourse], 1]);

			userService.getUserEntityWithRoles.mockResolvedValue(user);
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
			const courseCopy = status.copyEntity as CourseEntity;

			expect(courseCopy.students.length).toEqual(0);
		});

		it('should not set any additional teachers', async () => {
			const { originalCourse, user } = setupWithAdditionalUsers();
			const status = await service.copyCourse({ userId: user.id, courseId: originalCourse.id });
			const courseCopy = status.copyEntity as CourseEntity;

			expect(courseCopy.teachers.length).toEqual(1);
		});

		it('should not set any substitution Teachers in the copy', async () => {
			const { originalCourse, user } = setupWithAdditionalUsers();
			const status = await service.copyCourse({ userId: user.id, courseId: originalCourse.id });
			const courseCopy = status.copyEntity as CourseEntity;

			expect(courseCopy.substitutionTeachers.length).toEqual(0);
		});
	});

	describe('when course contains course groups', () => {
		const setupWithCourseGroups = () => {
			const user = userFactory.build();
			const originalCourse = courseEntityFactory.build();
			const originalBoard = boardFactory.build({ course: originalCourse });
			courseGroupEntityFactory.build({ course: originalCourse });
			courseService.findById.mockResolvedValue(originalCourse);
			courseService.findAllByUserId.mockResolvedValue([[originalCourse], 1]);

			userService.getUserEntityWithRoles.mockResolvedValue(user);
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
