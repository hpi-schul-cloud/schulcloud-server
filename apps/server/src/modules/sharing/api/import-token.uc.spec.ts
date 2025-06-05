import { LegacyLogger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { StorageLocation } from '@infra/files-storage-client';
import { AuthorizationService } from '@modules/authorization';
import { BoardExternalReferenceType, ColumnBoardService } from '@modules/board';
import { CopyColumnBoardParams } from '@modules/board/service/internal';
import { columnBoardFactory } from '@modules/board/testing';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { CourseService } from '@modules/course';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { CourseCopyService } from '@modules/learnroom';
import { LessonCopyService } from '@modules/lesson';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { lessonFactory } from '@modules/lesson/testing';
import { RoomService } from '@modules/room';
import { roomFactory } from '@modules//room/testing';
import { SagaService } from '@modules/saga';
import { schoolEntityFactory, schoolFactory } from '@modules/school/testing';
import { TaskCopyService } from '@modules/task';
import { Submission, Task } from '@modules/task/repo';
import { taskFactory } from '@modules/task/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { ShareTokenContextType, ShareTokenParentType, ShareTokenPayload } from '../domainobject/share-token.do';
import { ShareTokenService } from '../service';
import { shareTokenDOFactory } from '../testing/share-token.do.factory';
import { ImportTokenUC } from './import-token.uc';
import { ShareTokenPermissionService } from './service';

describe('ShareTokenUC', () => {
	let module: TestingModule;
	let uc: ImportTokenUC;
	let service: DeepMocked<ShareTokenService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let courseCopyService: DeepMocked<CourseCopyService>;
	let lessonCopyService: DeepMocked<LessonCopyService>;
	let taskCopyService: DeepMocked<TaskCopyService>;
	let courseService: DeepMocked<CourseService>;
	let roomService: DeepMocked<RoomService>;
	let columnBoardService: DeepMocked<ColumnBoardService>;
	let sagaService: DeepMocked<SagaService>;
	let shareTokenPermissionService: DeepMocked<ShareTokenPermissionService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ImportTokenUC,
				{
					provide: ShareTokenService,
					useValue: createMock<ShareTokenService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: CourseCopyService,
					useValue: createMock<CourseCopyService>(),
				},
				{
					provide: LessonCopyService,
					useValue: createMock<LessonCopyService>(),
				},
				{
					provide: TaskCopyService,
					useValue: createMock<TaskCopyService>(),
				},
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
				{
					provide: RoomService,
					useValue: createMock<RoomService>(),
				},
				{
					provide: ColumnBoardService,
					useValue: createMock<ColumnBoardService>(),
				},
				{
					provide: SagaService,
					useValue: createMock<SagaService>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: ShareTokenPermissionService,
					useValue: createMock<ShareTokenPermissionService>(),
				},
			],
		}).compile();

		uc = module.get(ImportTokenUC);
		service = module.get(ShareTokenService);
		authorizationService = module.get(AuthorizationService);
		courseCopyService = module.get(CourseCopyService);
		lessonCopyService = module.get(LessonCopyService);
		taskCopyService = module.get(TaskCopyService);
		courseService = module.get(CourseService);
		roomService = module.get(RoomService);
		columnBoardService = module.get(ColumnBoardService);
		sagaService = module.get(SagaService);
		shareTokenPermissionService = module.get(ShareTokenPermissionService);

		await setupEntities([User, CourseEntity, CourseGroupEntity, Task, Submission, LessonEntity, Material]);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('import share token', () => {
		describe('when parent is a course', () => {
			const setup = () => {
				const school = schoolEntityFactory.buildWithId();

				const user = userFactory.buildWithId({ school });
				authorizationService.getUserWithPermissions.mockResolvedValue(user);

				const shareToken = shareTokenDOFactory.build();
				service.lookupToken.mockResolvedValueOnce(shareToken);

				const course = courseEntityFactory.buildWithId();
				const status: CopyStatus = {
					type: CopyElementType.COURSE,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: course,
				};
				courseCopyService.copyCourse.mockResolvedValueOnce(status);

				return { user, school, shareToken, status };
			};

			it('should call shareTokenPermissionService.checkFeatureEnabled', async () => {
				const { user, shareToken } = setup();

				await uc.importShareToken(user.id, shareToken.token, 'NewName');

				expect(shareTokenPermissionService.checkFeatureEnabled).toHaveBeenCalledWith(shareToken.payload.parentType);
			});

			it('should load the share token', async () => {
				const { user, shareToken } = setup();

				const result = await uc.importShareToken(user.id, shareToken.token, 'NewName');

				expect(service.lookupToken).toBeCalledWith(shareToken.token);
				expect(result.status).toBe(CopyStatusEnum.SUCCESS);
			});

			it('should check the permission to create the course', async () => {
				const { user, shareToken } = setup();

				await uc.importShareToken(user.id, shareToken.token, 'NewName');

				expect(authorizationService.checkAllPermissions).toBeCalledWith(user, [Permission.COURSE_CREATE]);
			});

			it('should use the service to copy the course', async () => {
				const { user, shareToken } = setup();
				const newName = 'NewName';

				await uc.importShareToken(user.id, shareToken.token, newName);

				expect(courseCopyService.copyCourse).toBeCalledWith({
					userId: user.id,
					courseId: shareToken.payload.parentId,
					newName,
				});
			});

			it('should return the result', async () => {
				const { user, shareToken, status } = setup();
				const newName = 'NewName';

				const result = await uc.importShareToken(user.id, shareToken.token, newName);

				expect(result).toEqual(status);
			});
		});

		describe('when parent is a lesson', () => {
			const setup = () => {
				const school = schoolEntityFactory.buildWithId();

				const user = userFactory.buildWithId({ school });
				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				const course = courseEntityFactory.buildWithId();
				shareTokenPermissionService.checkCourseWritePermission.mockResolvedValueOnce({ course });
				const lesson = lessonFactory.buildWithId({ course });

				const status: CopyStatus = {
					type: CopyElementType.LESSON,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: lesson,
				};
				lessonCopyService.copyLesson.mockResolvedValueOnce(status);

				const payload: ShareTokenPayload = { parentType: ShareTokenParentType.Lesson, parentId: lesson._id.toString() };
				const shareToken = shareTokenDOFactory.build({ payload });
				service.lookupToken.mockResolvedValueOnce(shareToken);

				return { user, school, shareToken, status, course, lesson };
			};

			it('should throw if the destinationId is not passed', async () => {
				const { user, shareToken } = setup();

				await expect(uc.importShareToken(user.id, shareToken.token, 'NewName')).rejects.toThrowError(
					BadRequestException
				);
			});

			it('should load the share token', async () => {
				const { user, shareToken, course } = setup();

				const result = await uc.importShareToken(user.id, shareToken.token, 'NewName', course._id.toHexString());

				expect(service.lookupToken).toBeCalledWith(shareToken.token);
				expect(result.status).toBe(CopyStatusEnum.SUCCESS);
			});

			it('should check the permission to create topic in destination course ', async () => {
				const { user, shareToken, course } = setup();

				await uc.importShareToken(user.id, shareToken.token, 'NewName', course.id);

				expect(shareTokenPermissionService.checkCourseWritePermission).toHaveBeenCalledWith(
					user,
					course.id,
					Permission.TOPIC_CREATE
				);
			});

			it('should use the service to copy the lesson', async () => {
				const { user, shareToken, course, lesson } = setup();
				const copyName = 'NewName';

				await uc.importShareToken(user.id, shareToken.token, copyName, course._id.toHexString());

				expect(lessonCopyService.copyLesson).toBeCalledWith({
					copyName,
					destinationCourse: course,
					originalLessonId: lesson.id,
					user,
				});
			});

			it('should return the result', async () => {
				const { user, shareToken, status, course } = setup();
				const newName = 'NewName';

				const result = await uc.importShareToken(user.id, shareToken.token, newName, course._id.toHexString());

				expect(result).toEqual(status);
			});
		});

		describe('when parent is a task', () => {
			const setupTask = () => {
				const school = schoolEntityFactory.buildWithId();

				const user = userFactory.buildWithId({ school });
				authorizationService.getUserWithPermissions.mockResolvedValue(user);

				const course = courseEntityFactory.buildWithId();
				shareTokenPermissionService.checkCourseWritePermission.mockResolvedValueOnce({ course });
				const task = taskFactory.buildWithId({ course });
				const status: CopyStatus = {
					type: CopyElementType.TASK,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: task,
				};
				taskCopyService.copyTask.mockResolvedValueOnce(status);

				const payload: ShareTokenPayload = { parentType: ShareTokenParentType.Task, parentId: task._id.toString() };
				const shareToken = shareTokenDOFactory.build({ payload });
				service.lookupToken.mockResolvedValueOnce(shareToken);

				return { user, school, shareToken, status, course, task };
			};

			it('should throw if the destinationId is not passed', async () => {
				const { user, shareToken } = setupTask();

				await expect(uc.importShareToken(user.id, shareToken.token, 'NewName')).rejects.toThrowError(
					BadRequestException
				);
			});

			it('should load the share token', async () => {
				const { user, shareToken, course } = setupTask();

				const result = await uc.importShareToken(user.id, shareToken.token, 'NewName', course.id);

				expect(service.lookupToken).toBeCalledWith(shareToken.token);
				expect(result.status).toBe(CopyStatusEnum.SUCCESS);
			});

			it('should check the permission to create the task in the destination course', async () => {
				const { user, shareToken, course } = setupTask();

				await uc.importShareToken(user.id, shareToken.token, 'NewName', course.id);

				expect(shareTokenPermissionService.checkCourseWritePermission).toHaveBeenCalledWith(
					user,
					course.id,
					Permission.HOMEWORK_CREATE
				);
			});

			it('should use the service to copy the task', async () => {
				const { user, shareToken, task, course } = setupTask();
				const copyName = 'NewName';

				await uc.importShareToken(user.id, shareToken.token, copyName, course.id);

				expect(taskCopyService.copyTask).toBeCalledWith({
					copyName,
					destinationCourse: course,
					originalTaskId: task.id,
					user,
				});
			});

			it('should return the result', async () => {
				const { user, shareToken, status, task } = setupTask();
				const newName = 'NewName';

				const result = await uc.importShareToken(user.id, shareToken.token, newName, task.id);

				expect(result).toEqual(status);
			});
		});

		describe('when parent is a columnboard', () => {
			const setup = () => {
				const school = schoolEntityFactory.buildWithId();
				const user = userFactory.buildWithId({ school });
				const course = courseEntityFactory.buildWithId();
				courseService.findById.mockResolvedValue(course);

				const columnBoard = columnBoardFactory.build();
				columnBoardService.findById.mockResolvedValue(columnBoard);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				const payload: ShareTokenPayload = { parentType: ShareTokenParentType.ColumnBoard, parentId: columnBoard.id };
				const shareToken = shareTokenDOFactory.build({ payload });
				service.lookupToken.mockResolvedValueOnce(shareToken);

				return { user, shareToken, school, course, columnBoard };
			};
			it('should get token from service', async () => {
				const { user, shareToken, course } = setup();
				await uc.importShareToken(user.id, shareToken.token, 'NewName', course.id);
				expect(service.lookupToken).toHaveBeenCalledWith(shareToken.token);
			});
			it('should check the permission to create the columnboard', async () => {
				const { user, shareToken, course } = setup();

				await uc.importShareToken(user.id, shareToken.token, 'NewName', course.id);

				expect(shareTokenPermissionService.checkCourseWritePermission).toHaveBeenCalledWith(
					user,
					course.id,
					Permission.COURSE_EDIT
				);
			});
			it('should throw if destination course id is not given', async () => {
				const { user, shareToken } = setup();
				courseService.findById.mockRestore();

				await expect(uc.importShareToken(user.id, shareToken.token, 'NewName')).rejects.toThrowError(
					BadRequestException
				);
			});
			it('should call the columnboard copy service', async () => {
				const { user, shareToken, course, columnBoard } = setup();
				const newName = 'NewName';
				await uc.importShareToken(user.id, shareToken.token, newName, course.id);
				expect(columnBoardService.copyColumnBoard).toHaveBeenCalledWith<CopyColumnBoardParams[]>({
					originalColumnBoardId: columnBoard.id,
					targetExternalReference: { type: BoardExternalReferenceType.Course, id: course.id },
					sourceStorageLocationReference: { type: StorageLocation.SCHOOL, id: course.school.id },
					targetStorageLocationReference: { type: StorageLocation.SCHOOL, id: course.school.id },
					userId: user.id,
					copyTitle: newName,
					targetSchoolId: user.school.id,
				});
			});
			it('should return the result', async () => {
				const { user, shareToken, columnBoard } = setup();
				const status: CopyStatus = {
					type: CopyElementType.COLUMNBOARD,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: columnBoard,
				};
				columnBoardService.copyColumnBoard.mockResolvedValueOnce(status);
				const newName = 'NewName';

				const result = await uc.importShareToken(user.id, shareToken.token, newName, columnBoard.id);

				expect(result).toEqual(status);
			});
		});

		describe('when parent is a room', () => {
			const setup = () => {
				const school = schoolEntityFactory.buildWithId();
				const user = userFactory.buildWithId({ school });
				authorizationService.getUserWithPermissions.mockResolvedValue(user);

				const room = roomFactory.build({ schoolId: school.id });
				roomService.getSingleRoom.mockResolvedValue(room);

				const payload: ShareTokenPayload = { parentType: ShareTokenParentType.Room, parentId: room.id };
				const shareToken = shareTokenDOFactory.build({ payload });
				service.lookupToken.mockResolvedValueOnce(shareToken);

				const board = columnBoardFactory.build();

				sagaService.executeSaga.mockResolvedValueOnce({
					roomCopied: { id: room.id, name: 'copy' },
					boardsCopied: [board],
				});

				return { user, school, shareToken, room, board };
			};

			it('should check permission to create room', async () => {
				const { user, shareToken } = setup();

				await uc.importShareToken(user.id, shareToken.token, 'NewName', 'destination-id');

				expect(authorizationService.checkOneOfPermissions).toHaveBeenCalledWith(user, [Permission.ROOM_CREATE]);
			});

			it('should call sagaService.executeSaga', async () => {
				const { user, shareToken } = setup();
				const newName = 'NewName';

				await uc.importShareToken(user.id, shareToken.token, newName, 'destination-id');

				expect(sagaService.executeSaga).toBeCalledWith('roomCopy', {
					userId: user.id,
					roomId: shareToken.payload.parentId,
					newName,
				});
			});

			it('should return the result', async () => {
				const { user, shareToken, room, board } = setup();
				const status: CopyStatus = {
					type: CopyElementType.ROOM,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: {
						id: room.id,
					},
					title: 'copy',
					elements: [
						{
							title: board.title,
							type: CopyElementType.BOARD,
							status: CopyStatusEnum.SUCCESS,
							copyEntity: {
								id: board.id,
							},
						},
					],
				};

				const newName = 'NewName';

				const result = await uc.importShareToken(user.id, shareToken.token, newName, 'destination-id');

				expect(result).toEqual(status);
			});
		});

		describe('when restricted to same school', () => {
			const setup = () => {
				const schoolEntity = schoolEntityFactory.buildWithId();
				const school = schoolFactory.build();
				const user = userFactory.buildWithId({ school: schoolEntity });

				authorizationService.getUserWithPermissions.mockResolvedValue(user);

				const course = courseEntityFactory.buildWithId();
				const status: CopyStatus = {
					type: CopyElementType.COURSE,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: course,
				};
				courseCopyService.copyCourse.mockResolvedValueOnce(status);

				const shareToken = shareTokenDOFactory.build({
					payload: { parentType: ShareTokenParentType.Course, parentId: course.id },
					context: { contextType: ShareTokenContextType.School, contextId: schoolEntity.id },
				});
				service.lookupToken.mockResolvedValueOnce(shareToken);

				return { user, school, course, shareToken, status };
			};

			it('should check context read permission', async () => {
				const { user, shareToken, course } = setup();

				await uc.importShareToken(user.id, shareToken.token, 'NewName', course.id);

				expect(shareTokenPermissionService.checkContextReadPermission).toHaveBeenCalledWith(
					user.id,
					shareToken.context
				);
			});
		});

		describe('when not restricted to same school', () => {
			const setup = () => {
				const school = schoolEntityFactory.buildWithId();

				const user = userFactory.buildWithId({ school });
				authorizationService.getUserWithPermissions.mockResolvedValue(user);

				const course = courseEntityFactory.buildWithId();
				const status: CopyStatus = {
					type: CopyElementType.COURSE,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: course,
				};
				courseCopyService.copyCourse.mockResolvedValueOnce(status);

				const shareToken = shareTokenDOFactory.build({
					payload: { parentType: ShareTokenParentType.Course, parentId: course.id },
				});
				service.lookupToken.mockResolvedValueOnce(shareToken);

				return { user, school, course, shareToken, status };
			};
			it('should not check context read permission', async () => {
				const { user, shareToken } = setup();

				await uc.importShareToken(user.id, shareToken.token, 'NewName');

				expect(authorizationService.checkPermission).not.toHaveBeenCalled();
			});
		});
	});
});
