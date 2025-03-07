import { LegacyLogger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { BoardExternalReferenceType, BoardNodeAuthorizableService, ColumnBoardService } from '@modules/board';
import { CopyColumnBoardParams } from '@modules/board/service/internal';
import { boardNodeAuthorizableFactory, columnBoardFactory } from '@modules/board/testing';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { CourseService } from '@modules/course';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { StorageLocation } from '@modules/files-storage/interface';
import { CourseCopyService } from '@modules/learnroom';
import { LessonCopyService, LessonService } from '@modules/lesson';
import { LessonEntity } from '@modules/lesson/repository';
import { lessonFactory } from '@modules/lesson/testing';
import { RoomService } from '@modules/room';
import { RoomMembershipService } from '@modules/room-membership';
import { SchoolService } from '@modules/school';
import { schoolEntityFactory, schoolFactory } from '@modules/school/testing';
import { TaskCopyService, TaskService } from '@modules/task';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { BadRequestException, NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { Material, Submission, Task } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { taskFactory } from '@testing/factory/task.factory';
import { ShareTokenContextType, ShareTokenParentType, ShareTokenPayload } from '../domainobject/share-token.do';
import { ShareTokenService } from '../service';
import { shareTokenDOFactory } from '../testing/share-token.do.factory';
import { ShareTokenUC } from './share-token.uc';

describe('ShareTokenUC', () => {
	let module: TestingModule;
	let uc: ShareTokenUC;
	let service: DeepMocked<ShareTokenService>;
	let courseCopyService: DeepMocked<CourseCopyService>;
	let lessonCopyService: DeepMocked<LessonCopyService>;
	let taskCopyService: DeepMocked<TaskCopyService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let courseService: DeepMocked<CourseService>;
	let boardNodeAuthorizableService: DeepMocked<BoardNodeAuthorizableService>;
	let lessonService: DeepMocked<LessonService>;
	let taskService: DeepMocked<TaskService>;
	let columnBoardService: DeepMocked<ColumnBoardService>;
	let schoolService: DeepMocked<SchoolService>;

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
					provide: RoomService,
					useValue: createMock<RoomService>(),
				},
				{
					provide: RoomMembershipService,
					useValue: createMock<RoomMembershipService>(),
				},
				{
					provide: ColumnBoardService,
					useValue: createMock<ColumnBoardService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		uc = module.get(ShareTokenUC);
		service = module.get(ShareTokenService);
		courseCopyService = module.get(CourseCopyService);
		lessonCopyService = module.get(LessonCopyService);
		taskCopyService = module.get(TaskCopyService);
		authorizationService = module.get(AuthorizationService);
		courseService = module.get(CourseService);
		boardNodeAuthorizableService = module.get(BoardNodeAuthorizableService);
		lessonService = module.get(LessonService);
		taskService = module.get(TaskService);
		columnBoardService = module.get(ColumnBoardService);
		schoolService = module.get(SchoolService);

		await setupEntities([User, CourseEntity, CourseGroupEntity, Task, Submission, LessonEntity, Material]);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
		jest.clearAllMocks();
		// configuration sets must be part of the setup functions and part of the describe when ...and feature x is activated
		Configuration.set('FEATURE_COURSE_SHARE', true);
		Configuration.set('FEATURE_LESSON_SHARE', true);
		Configuration.set('FEATURE_TASK_SHARE', true);
		Configuration.set('FEATURE_COLUMN_BOARD_SHARE', true);
	});

	describe('create a sharetoken', () => {
		describe('when parent is a course', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const course = courseEntityFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				courseService.findById.mockResolvedValueOnce(course);

				return { user, course };
			};

			it('should throw if the feature is not enabled', async () => {
				const { user, course } = setup();
				Configuration.set('FEATURE_COURSE_SHARE', false);

				await expect(
					uc.createShareToken(user.id, {
						parentId: course.id,
						parentType: ShareTokenParentType.Course,
					})
				).rejects.toThrowError();
			});

			it('should check parent write permission', async () => {
				const { user, course } = setup();

				await uc.createShareToken(user.id, {
					parentId: course.id,
					parentType: ShareTokenParentType.Course,
				});

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					course,
					AuthorizationContextBuilder.write([Permission.COURSE_CREATE])
				);
			});

			it('should not check any other permissions', async () => {
				const { user, course } = setup();

				await uc.createShareToken(user.id, {
					parentId: course.id,
					parentType: ShareTokenParentType.Course,
				});

				expect(authorizationService.checkPermission).toHaveBeenCalledTimes(1);
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

			it('should throw if the feature is not enabled', async () => {
				const { user, lesson } = setup();
				Configuration.set('FEATURE_LESSON_SHARE', false);

				await expect(
					uc.createShareToken(user.id, {
						parentId: lesson.id,
						parentType: ShareTokenParentType.Lesson,
					})
				).rejects.toThrowError();
			});

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

			it('should not check any other permissions', async () => {
				const { user, lesson } = setup();

				await uc.createShareToken(user.id, {
					parentId: lesson.id,
					parentType: ShareTokenParentType.Lesson,
				});

				expect(authorizationService.checkPermission).toHaveBeenCalledTimes(1);
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
			it('should throw if the feature is not enabled', async () => {
				const { user, task } = setup();
				Configuration.set('FEATURE_TASK_SHARE', false);

				await expect(
					uc.createShareToken(user.id, {
						parentId: task.id,
						parentType: ShareTokenParentType.Task,
					})
				).rejects.toThrowError();
			});

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

			it('should not check any other permissions', async () => {
				const { user, task } = setup();

				await uc.createShareToken(user.id, {
					parentId: task.id,
					parentType: ShareTokenParentType.Task,
				});

				expect(authorizationService.checkPermission).toHaveBeenCalledTimes(1);
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

			it('should throw if the feature is not enabled', async () => {
				const { user } = setup();
				Configuration.set('FEATURE_COLUMN_BOARD_SHARE', false);

				await expect(
					uc.createShareToken(user.id, {
						parentId: '123',
						parentType: ShareTokenParentType.ColumnBoard,
					})
				).rejects.toThrowError();
			});

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
				).rejects.toThrow(new NotImplementedException('Import Feature not implemented'));
			});
		});

		describe('when restricted to same school', () => {
			const setup = () => {
				const schoolEntity = schoolEntityFactory.buildWithId();
				const user = userFactory.buildWithId({ school: schoolEntity });
				const course = courseEntityFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				courseService.findById.mockResolvedValueOnce(course);

				return { user, course };
			};

			it('should check parent write permission', async () => {
				const { user, course } = setup();

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

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					course,
					AuthorizationContextBuilder.write([Permission.COURSE_CREATE])
				);
			});

			it('should call the service', async () => {
				const school = schoolEntityFactory.buildWithId();
				const user = userFactory.buildWithId({ school });
				const course = courseEntityFactory.buildWithId();
				authorizationService.getUserWithPermissions.mockResolvedValue(user);

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
				courseService.findById.mockResolvedValueOnce(course);

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
			courseService.findById.mockResolvedValueOnce(course);

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

			it('should throw if the feature is not enabled', async () => {
				const { user, shareToken } = setup();
				Configuration.set('FEATURE_COURSE_SHARE', false);

				await expect(uc.lookupShareToken(user.id, shareToken.token)).rejects.toThrowError();
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

			it('should throw if the feature is not enabled', async () => {
				const { user, shareToken } = setup();
				Configuration.set('FEATURE_LESSON_SHARE', false);

				await expect(uc.lookupShareToken(user.id, shareToken.token)).rejects.toThrowError();
			});

			it('should load the share token', async () => {
				const { user, shareToken } = setup();

				await uc.lookupShareToken(user.id, shareToken.token);

				expect(service.lookupTokenWithParentName).toBeCalledWith(shareToken.token);
			});

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

			it('should throw if the feature is not enabled', async () => {
				const { user, shareToken } = setup();
				Configuration.set('FEATURE_TASK_SHARE', false);

				await expect(uc.lookupShareToken(user.id, shareToken.token)).rejects.toThrowError();
			});

			it('should load the share token', async () => {
				const { user, shareToken } = setup();

				await uc.lookupShareToken(user.id, shareToken.token);

				expect(service.lookupTokenWithParentName).toBeCalledWith(shareToken.token);
			});

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

			it('should throw if the feature is not enabled', async () => {
				const { user, shareToken } = setup();
				Configuration.set('FEATURE_COLUMN_BOARD_SHARE', false);

				await expect(uc.lookupShareToken(user.id, shareToken.token)).rejects.toThrowError();
			});

			it('should load the share token', async () => {
				const { user, shareToken } = setup();

				await uc.lookupShareToken(user.id, shareToken.token);

				expect(service.lookupTokenWithParentName).toBeCalledWith(shareToken.token);
			});

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

					schoolService.getSchoolById.mockResolvedValueOnce(school);

					return { user, shareToken, school };
				};

				it('should check look up permissions', async () => {
					const { user, shareToken } = setup();

					await uc.lookupShareToken(user.id, shareToken.token);

					expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.COURSE_CREATE]);
				});

				it('should check context read permission', async () => {
					const { user, shareToken, school } = setup();

					await uc.lookupShareToken(user.id, shareToken.token);

					expect(authorizationService.checkPermission).toHaveBeenCalledWith(
						user,
						school,
						AuthorizationContextBuilder.read([])
					);
				});
			});

			describe('when context type is unknown', () => {
				const setup = () => {
					const schoolEntity = schoolEntityFactory.buildWithId();
					const user = userFactory.buildWithId({ school: schoolEntity });
					const shareToken = shareTokenDOFactory.build({
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						context: { contextType: 'unknown', contextId: schoolEntity.id },
					});
					const parentName = 'name';

					service.lookupTokenWithParentName.mockResolvedValueOnce({ shareToken, parentName });
					authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

					return { user, shareToken };
				};

				it('should throw', async () => {
					const { user, shareToken } = setup();

					await expect(uc.lookupShareToken(user.id, shareToken.token)).rejects.toThrow(NotImplementedException);
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

		describe('when parent type is not allowed', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				const course = courseEntityFactory.buildWithId();
				const payload: ShareTokenPayload = {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					parentType: 'invalid',
					parentId: course.id,
				};
				const shareToken = shareTokenDOFactory.build({ payload });
				service.lookupTokenWithParentName.mockResolvedValueOnce({ shareToken, parentName: 'foo' });

				return { user, shareToken };
			};

			it('should throw', async () => {
				const { user, shareToken } = setup();

				await expect(uc.lookupShareToken(user.id, shareToken.token)).rejects.toThrow(NotImplementedException);
			});
		});
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

			it('should throw if the feature is not enabled', async () => {
				const { user, shareToken } = setup();
				Configuration.set('FEATURE_COURSE_SHARE', false);

				await expect(uc.importShareToken(user.id, shareToken.token, 'NewName')).rejects.toThrowError(
					FeatureDisabledLoggableException
				);
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
				courseService.findById.mockResolvedValueOnce(course);
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

			it('should throw if the feature is not enabled', async () => {
				const { user, shareToken } = setup();
				Configuration.set('FEATURE_LESSON_SHARE', false);

				await expect(uc.importShareToken(user.id, shareToken.token, 'NewName')).rejects.toThrowError(
					FeatureDisabledLoggableException
				);
			});

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

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					course,
					AuthorizationContextBuilder.write([Permission.TOPIC_CREATE])
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
				courseService.findById.mockResolvedValueOnce(course);
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

			it('should throw if the feature is not enabled', async () => {
				const { user, shareToken } = setupTask();
				Configuration.set('FEATURE_TASK_SHARE', false);

				await expect(uc.importShareToken(user.id, shareToken.token, 'NewName')).rejects.toThrowError(
					FeatureDisabledLoggableException
				);
			});

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

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					course,
					AuthorizationContextBuilder.write([Permission.HOMEWORK_CREATE])
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
			it('should throw if the FEATURE_COLUMBBOARD_SHARE is not enabled', async () => {
				const { user, shareToken } = setup();
				Configuration.set('FEATURE_COLUMN_BOARD_SHARE', false);
				await expect(uc.importShareToken(user.id, shareToken.token, 'NewName')).rejects.toThrowError(
					FeatureDisabledLoggableException
				);
			});
			it('should check the permission to create the columnboard', async () => {
				const { user, shareToken, course } = setup();

				await uc.importShareToken(user.id, shareToken.token, 'NewName', course.id);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					course,
					AuthorizationContextBuilder.write([Permission.COURSE_EDIT])
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

		describe('when parent type is not allowed', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				const course = courseEntityFactory.buildWithId();
				const payload: ShareTokenPayload = {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					parentType: 'invalid',
					parentId: course.id,
				};
				const shareToken = shareTokenDOFactory.build({ payload });
				service.lookupToken.mockResolvedValueOnce(shareToken);

				return { user, shareToken };
			};

			it('should throw', async () => {
				const { user, shareToken } = setup();

				await expect(uc.importShareToken(user.id, shareToken.token, 'newName')).rejects.toThrow(
					NotImplementedException
				);
			});
		});

		describe('when restricted to same school', () => {
			const setup = () => {
				const schoolEntity = schoolEntityFactory.buildWithId();
				const school = schoolFactory.build();
				const user = userFactory.buildWithId({ school: schoolEntity });

				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);

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
				const { user, shareToken, school, course } = setup();

				await uc.importShareToken(user.id, shareToken.token, 'NewName', course.id);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					school,
					AuthorizationContextBuilder.read([])
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
