import { LegacyLogger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { BoardNodeService, BoardNodeAuthorizableService, ColumnBoardService } from '@modules/board';
import { boardNodeAuthorizableFactory, columnBoardFactory, cardFactory } from '@modules/board/testing';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { LessonService } from '@modules/lesson';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { lessonFactory } from '@modules/lesson/testing';
import { schoolEntityFactory, schoolFactory } from '@modules/school/testing';
import { TaskService } from '@modules/task';
import { Submission, Task } from '@modules/task/repo';
import { taskFactory } from '@modules/task/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { roomEntityFactory } from '@modules/room/testing';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { ShareTokenContextType, ShareTokenParentType, ShareTokenPayload } from '../domainobject/share-token.do';
import { ShareTokenService } from '../service';
import { shareTokenDOFactory } from '../testing/share-token.do.factory';
import { ShareTokenUC } from './share-token.uc';
import { ShareTokenPermissionService } from './service';

describe('ShareTokenUC', () => {
	let module: TestingModule;
	let uc: ShareTokenUC;
	let service: DeepMocked<ShareTokenService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let boardNodeAuthorizableService: DeepMocked<BoardNodeAuthorizableService>;
	let boardNodeService: DeepMocked<BoardNodeService>;
	let lessonService: DeepMocked<LessonService>;
	let taskService: DeepMocked<TaskService>;
	let columnBoardService: DeepMocked<ColumnBoardService>;
	let shareTokenPermissionService: DeepMocked<ShareTokenPermissionService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ShareTokenUC,
				{
					provide: ShareTokenService,
					useValue: createMock<ShareTokenService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: BoardNodeAuthorizableService,
					useValue: createMock<BoardNodeAuthorizableService>(),
				},
				{
					provide: LessonService,
					useValue: createMock<LessonService>(),
				},
				{
					provide: TaskService,
					useValue: createMock<TaskService>(),
				},
				{
					provide: ColumnBoardService,
					useValue: createMock<ColumnBoardService>(),
				},
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
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

		uc = module.get(ShareTokenUC);
		service = module.get(ShareTokenService);
		authorizationService = module.get(AuthorizationService);
		boardNodeAuthorizableService = module.get(BoardNodeAuthorizableService);
		boardNodeService = module.get(BoardNodeService);
		lessonService = module.get(LessonService);
		taskService = module.get(TaskService);
		columnBoardService = module.get(ColumnBoardService);
		shareTokenPermissionService = module.get(ShareTokenPermissionService);

		await setupEntities([User, CourseEntity, CourseGroupEntity, Task, Submission, LessonEntity, Material]);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('create a sharetoken', () => {
		describe('when parent is a course', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const course = courseEntityFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				shareTokenPermissionService.checkCourseWritePermission.mockResolvedValueOnce({ course });

				return { user, course };
			};

			it('should call token permission service to check feature enabled', async () => {
				const { user, course } = setup();
				await uc.createShareToken(user.id, {
					parentId: course.id,
					parentType: ShareTokenParentType.Course,
				});

				expect(shareTokenPermissionService.checkFeatureEnabled).toHaveBeenCalledWith(ShareTokenParentType.Course);
			});

			it('should call token permission service to check parent write permission', async () => {
				const { user, course } = setup();

				await uc.createShareToken(user.id, {
					parentId: course.id,
					parentType: ShareTokenParentType.Course,
				});

				expect(shareTokenPermissionService.checkCourseWritePermission).toHaveBeenCalledWith(
					user,
					course.id,
					Permission.COURSE_CREATE
				);
			});

			it('should call the service', async () => {
				const { user, course } = setup();

				await uc.createShareToken(user.id, {
					parentId: course.id,
					parentType: ShareTokenParentType.Course,
				});

				expect(service.createToken).toHaveBeenCalledWith(
					{
						parentType: ShareTokenParentType.Course,
						parentId: course.id,
					},
					{}
				);
			});
		});

		describe('when parent is a lesson', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const lesson = lessonFactory.buildWithId();
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				lessonService.findById.mockResolvedValueOnce(lesson);

				return { user, lesson };
			};

			it('should check parent write permission', async () => {
				const { user, lesson } = setup();

				await uc.createShareToken(user.id, {
					parentId: lesson.id,
					parentType: ShareTokenParentType.Lesson,
				});

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					lesson,
					AuthorizationContextBuilder.write([Permission.TOPIC_CREATE])
				);
			});

			it('should call the service', async () => {
				const { user, lesson } = setup();

				await uc.createShareToken(user.id, {
					parentId: lesson.id,
					parentType: ShareTokenParentType.Lesson,
				});

				expect(service.createToken).toHaveBeenCalledWith(
					{
						parentType: ShareTokenParentType.Lesson,
						parentId: lesson.id,
					},
					{}
				);
			});
		});

		describe('when parent is a task', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				taskService.findById.mockResolvedValueOnce(task);

				return { user, task };
			};

			it('should check parent write permission', async () => {
				const { user, task } = setup();

				await uc.createShareToken(user.id, {
					parentId: task.id,
					parentType: ShareTokenParentType.Task,
				});

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					task,
					AuthorizationContextBuilder.write([Permission.HOMEWORK_CREATE])
				);
			});

			it('should call the service', async () => {
				const { user, task } = setup();

				await uc.createShareToken(user.id, {
					parentId: task.id,
					parentType: ShareTokenParentType.Task,
				});

				expect(service.createToken).toHaveBeenCalledWith(
					{
						parentType: ShareTokenParentType.Task,
						parentId: task.id,
					},
					{}
				);
			});
		});

		describe('when parent is a columnboard', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const columnBoard = columnBoardFactory.build();
				const boardNodeAuthorizable = boardNodeAuthorizableFactory.build();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				columnBoardService.findById.mockResolvedValueOnce(columnBoard);
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValue(boardNodeAuthorizable);

				return { user, columnBoard, boardNodeAuthorizable };
			};

			it('should check permission for parent', async () => {
				const { user, columnBoard, boardNodeAuthorizable } = setup();

				await uc.createShareToken(user.id, {
					parentId: columnBoard.id,
					parentType: ShareTokenParentType.ColumnBoard,
				});

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					boardNodeAuthorizable,
					AuthorizationContextBuilder.write([Permission.COURSE_EDIT])
				);
			});
		});

		describe('when parent is a room', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const room = roomEntityFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return { user, room };
			};

			it('should check parent write permission', async () => {
				const { user, room } = setup();

				await uc.createShareToken(user.id, {
					parentId: room.id,
					parentType: ShareTokenParentType.Room,
				});

				expect(shareTokenPermissionService.checkRoomWritePermission).toHaveBeenCalledWith(user, room.id, [
					Permission.ROOM_SHARE_ROOM,
				]);
			});

			it('should call the service', async () => {
				const { user, room } = setup();

				await uc.createShareToken(user.id, {
					parentId: room.id,
					parentType: ShareTokenParentType.Room,
				});

				expect(service.createToken).toHaveBeenCalledWith(
					{
						parentType: ShareTokenParentType.Room,
						parentId: room.id,
					},
					{}
				);
			});
		});

		describe('when parent is a card', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const card = cardFactory.build();
				const columnBoard = columnBoardFactory.build();
				const boardNodeAuthorizable = boardNodeAuthorizableFactory.build();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(card);
				columnBoardService.findById.mockResolvedValueOnce(columnBoard);
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValue(boardNodeAuthorizable);

				return { user, card, columnBoard, boardNodeAuthorizable };
			};

			it('should check parent write permission', async () => {
				const { user, card, boardNodeAuthorizable } = setup();
				await uc.createShareToken(user.id, {
					parentId: card.id,
					parentType: ShareTokenParentType.Card,
				});

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					boardNodeAuthorizable,
					AuthorizationContextBuilder.write([Permission.COURSE_EDIT])
				);
			});
		});

		describe('when parent type is not allowed', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return { user };
			};

			it('should throw', async () => {
				const { user } = setup();

				await expect(
					uc.createShareToken(user.id, {
						parentId: '123',
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						parentType: 'unknown-type',
					})
				).rejects.toThrow(new NotImplementedException('Share Feature not implemented'));
			});
		});

		describe('when restricted to same school', () => {
			const setup = () => {
				const school = schoolEntityFactory.buildWithId();
				const user = userFactory.buildWithId({ school });
				const course = courseEntityFactory.buildWithId();
				authorizationService.getUserWithPermissions.mockResolvedValue(user);

				return { user, course, school };
			};

			it('should call the service with school context', async () => {
				const { user, course, school } = setup();
				await uc.createShareToken(
					user.id,
					{
						parentId: course.id,
						parentType: ShareTokenParentType.Course,
					},
					{
						schoolExclusive: true,
					}
				);

				expect(service.createToken).toHaveBeenCalledWith(
					{
						parentType: ShareTokenParentType.Course,
						parentId: course.id,
					},
					{
						context: {
							contextId: school.id,
							contextType: ShareTokenContextType.School,
						},
					}
				);
			});
		});

		describe('when an expiration timespan is given', () => {
			it('should pass the expiration date to the service', async () => {
				const user = userFactory.buildWithId();
				const course = courseEntityFactory.buildWithId();
				const payload = {
					parentId: course.id,
					parentType: ShareTokenParentType.Course,
				};

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				shareTokenPermissionService.checkCourseWritePermission.mockResolvedValueOnce({ course });

				jest.useFakeTimers();
				jest.setSystemTime(new Date(2022, 10, 4));

				await uc.createShareToken(user.id, payload, { expiresInDays: 7 });

				expect(service.createToken).toHaveBeenCalledWith(payload, { expiresAt: new Date(2022, 10, 11) });

				jest.useRealTimers();
			});
		});

		it('should return service result', async () => {
			const user = userFactory.buildWithId();
			const course = courseEntityFactory.buildWithId();
			const shareToken = shareTokenDOFactory.build();

			authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
			shareTokenPermissionService.checkCourseWritePermission.mockResolvedValueOnce({ course });

			service.createToken.mockResolvedValueOnce(shareToken);

			const result = await uc.createShareToken(user.id, {
				parentId: course.id,
				parentType: ShareTokenParentType.Course,
			});

			expect(result).toEqual(shareToken);
		});
	});

	describe('lookup a sharetoken', () => {
		describe('when parent is a course', () => {
			const setup = () => {
				const school = schoolEntityFactory.buildWithId();

				const user = userFactory.buildWithId({ school });
				authorizationService.getUserWithPermissions.mockResolvedValue(user);

				const course = courseEntityFactory.buildWithId();
				const payload: ShareTokenPayload = {
					parentType: ShareTokenParentType.Course,
					parentId: course.id,
				};
				const shareToken = shareTokenDOFactory.build({ payload });
				service.lookupTokenWithParentName.mockResolvedValueOnce({ shareToken, parentName: course.name });

				return { user, school, shareToken, course };
			};

			it('should call ShareTokenPermissionService.checkFeatureEnabled', async () => {
				const { user, shareToken } = setup();

				await uc.lookupShareToken(user.id, shareToken.token);
				expect(shareTokenPermissionService.checkFeatureEnabled).toHaveBeenCalledWith(ShareTokenParentType.Course);
			});

			it('should load the share token', async () => {
				const { user, shareToken } = setup();

				await uc.lookupShareToken(user.id, shareToken.token);

				expect(service.lookupTokenWithParentName).toBeCalledWith(shareToken.token);
			});

			it('should check for permission', async () => {
				const { user, shareToken } = setup();
				await uc.lookupShareToken(user.id, shareToken.token);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.COURSE_CREATE]);
			});

			it('should return the result', async () => {
				const { user, shareToken, course } = setup();

				const result = await uc.lookupShareToken(user.id, shareToken.token);

				expect(result).toEqual({
					token: shareToken.token,
					parentType: ShareTokenParentType.Course,
					parentName: course.name,
				});
			});
		});

		describe('when parent is a lesson', () => {
			const setup = () => {
				const school = schoolEntityFactory.buildWithId();

				const user = userFactory.buildWithId({ school });
				authorizationService.getUserWithPermissions.mockResolvedValue(user);

				const course = courseEntityFactory.buildWithId();
				const lesson = lessonFactory.buildWithId({ course });
				const payload: ShareTokenPayload = {
					parentType: ShareTokenParentType.Lesson,
					parentId: lesson.id,
				};
				const shareToken = shareTokenDOFactory.build({ payload });
				service.lookupTokenWithParentName.mockResolvedValueOnce({ shareToken, parentName: lesson.name });

				return { user, school, shareToken, lesson, course };
			};

			it('should check for permission', async () => {
				const { user, shareToken } = setup();
				await uc.lookupShareToken(user.id, shareToken.token);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOPIC_CREATE]);
			});

			it('should return the result', async () => {
				const { user, shareToken, lesson } = setup();

				const result = await uc.lookupShareToken(user.id, shareToken.token);

				expect(result).toEqual({
					token: shareToken.token,
					parentType: ShareTokenParentType.Lesson,
					parentName: lesson.name,
				});
			});
		});

		describe('when parent is a task', () => {
			const setup = () => {
				const school = schoolEntityFactory.buildWithId();

				const user = userFactory.buildWithId({ school });
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				const course = courseEntityFactory.buildWithId();
				const task = taskFactory.buildWithId({ course });
				const payload: ShareTokenPayload = {
					parentType: ShareTokenParentType.Task,
					parentId: task.id,
				};
				const shareToken = shareTokenDOFactory.build({ payload });
				service.lookupTokenWithParentName.mockResolvedValueOnce({ shareToken, parentName: task.name });

				return { user, school, shareToken, task, course };
			};

			it('should check for permission', async () => {
				const { user, shareToken } = setup();
				await uc.lookupShareToken(user.id, shareToken.token);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.HOMEWORK_CREATE]);
			});

			it('should return the result', async () => {
				const { user, shareToken, task } = setup();

				const result = await uc.lookupShareToken(user.id, shareToken.token);

				expect(result).toEqual({
					token: shareToken.token,
					parentType: ShareTokenParentType.Task,
					parentName: task.name,
				});
			});
		});

		describe('when parent is a columnboard', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				const course = courseEntityFactory.buildWithId();
				const columnBoard = columnBoardFactory.build();
				const payload: ShareTokenPayload = {
					parentType: ShareTokenParentType.ColumnBoard,
					parentId: columnBoard.id,
				};
				const shareToken = shareTokenDOFactory.build({ payload });
				service.lookupTokenWithParentName.mockResolvedValueOnce({ shareToken, parentName: columnBoard.title });

				columnBoardService.findById.mockResolvedValueOnce(columnBoard);

				return { user, shareToken, columnBoard, course };
			};

			it('should check for permission', async () => {
				const { user, shareToken } = setup();
				await uc.lookupShareToken(user.id, shareToken.token);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.COURSE_EDIT]);
			});

			it('should return the result', async () => {
				const { user, shareToken, columnBoard } = setup();

				const result = await uc.lookupShareToken(user.id, shareToken.token);

				expect(result).toEqual({
					token: shareToken.token,
					parentType: ShareTokenParentType.ColumnBoard,
					parentName: columnBoard.title,
				});
			});
		});

		describe('when parent is a room', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				const room = roomEntityFactory.buildWithId();
				const payload: ShareTokenPayload = {
					parentType: ShareTokenParentType.Room,
					parentId: room.id,
				};
				const shareToken = shareTokenDOFactory.build({ payload });
				service.lookupTokenWithParentName.mockResolvedValueOnce({ shareToken, parentName: room.name });

				return { user, shareToken, room };
			};

			it('should check for permission', async () => {
				const { user, shareToken } = setup();
				await uc.lookupShareToken(user.id, shareToken.token);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.SCHOOL_CREATE_ROOM]);
			});

			it('should return the result', async () => {
				const { user, shareToken, room } = setup();

				const result = await uc.lookupShareToken(user.id, shareToken.token);

				expect(result).toEqual({
					token: shareToken.token,
					parentType: ShareTokenParentType.Room,
					parentName: room.name,
				});
			});
		});

		describe('when parent is a card', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				const course = courseEntityFactory.buildWithId();
				const columnBoard = columnBoardFactory.build();
				const card = cardFactory.build();
				boardNodeService.findByClassAndId.mockResolvedValue(card);
				columnBoardService.findById.mockResolvedValue(columnBoard);

				const payload: ShareTokenPayload = {
					parentType: ShareTokenParentType.Card,
					parentId: card.id,
				};
				const shareToken = shareTokenDOFactory.build({ payload });
				service.lookupTokenWithParentName.mockResolvedValueOnce({ shareToken, parentName: card.title || '' });

				return { user, shareToken, card, course, columnBoard };
			};

			it('should check for permission', async () => {
				const { user, shareToken } = setup();
				await uc.lookupShareToken(user.id, shareToken.token);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.COURSE_EDIT]);
			});

			it('should return the result', async () => {
				const { user, shareToken, card } = setup();
				const result = await uc.lookupShareToken(user.id, shareToken.token);

				expect(result).toEqual({
					token: shareToken.token,
					parentType: ShareTokenParentType.Card,
					parentName: card.title,
				});
			});
		});

		describe('when restricted to same school', () => {
			describe('when context type is school', () => {
				const setup = () => {
					const schoolEntity = schoolEntityFactory.buildWithId();
					const school = schoolFactory.build();
					const user = userFactory.buildWithId({ school: schoolEntity });
					const shareToken = shareTokenDOFactory.build({
						context: { contextType: ShareTokenContextType.School, contextId: schoolEntity.id },
					});
					const parentName = 'name';

					service.lookupTokenWithParentName.mockResolvedValueOnce({ shareToken, parentName });
					authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
					authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

					return { user, shareToken, school };
				};

				it('should check look up permissions', async () => {
					const { user, shareToken } = setup();

					await uc.lookupShareToken(user.id, shareToken.token);

					expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.COURSE_CREATE]);
				});

				it('should check context read permission', async () => {
					const { user, shareToken } = setup();

					await uc.lookupShareToken(user.id, shareToken.token);

					expect(shareTokenPermissionService.checkContextReadPermission).toHaveBeenCalledWith(
						user.id,
						shareToken.context
					);
				});
			});
		});

		describe('when not restricted to same school', () => {
			const setup = () => {
				const school = schoolEntityFactory.buildWithId();
				const user = userFactory.buildWithId({ school });
				const shareToken = shareTokenDOFactory.build();
				const parentName = 'name';
				service.lookupTokenWithParentName.mockResolvedValueOnce({ shareToken, parentName });
				return { user, school, shareToken };
			};

			it('should not check context read permission', async () => {
				const { user, shareToken } = setup();

				await uc.lookupShareToken(user.id, shareToken.token);

				expect(authorizationService.checkPermission).not.toHaveBeenCalled();
			});
		});
	});
});
