import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';

import {
	Action,
	AuthorizableReferenceType,
	AuthorizationContextBuilder,
	AuthorizationReferenceService,
	AuthorizationService,
} from '@modules/authorization';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { CourseCopyService, CourseService } from '@modules/learnroom';
import { LessonCopyService } from '@modules/lesson';
import { TaskCopyService } from '@modules/task';
import { ColumnBoardCopyService } from '@modules/board';
import { BadRequestException, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import { Permission } from '@shared/domain/interface';
import {
	courseFactory,
	columnBoardFactory,
	lessonFactory,
	schoolEntityFactory,
	setupEntities,
	shareTokenFactory,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { ShareTokenContextType, ShareTokenParentType, ShareTokenPayload } from '../domainobject/share-token.do';
import { ShareTokenService } from '../service';
import { ShareTokenUC } from './share-token.uc';

describe('ShareTokenUC', () => {
	let module: TestingModule;
	let uc: ShareTokenUC;
	let service: DeepMocked<ShareTokenService>;
	let courseCopyService: DeepMocked<CourseCopyService>;
	let lessonCopyService: DeepMocked<LessonCopyService>;
	let taskCopyService: DeepMocked<TaskCopyService>;
	let columnBoardCopyService: DeepMocked<ColumnBoardCopyService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let authorizationReferenceService: DeepMocked<AuthorizationReferenceService>;
	let courseService: DeepMocked<CourseService>;

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
					provide: AuthorizationReferenceService,
					useValue: createMock<AuthorizationReferenceService>(),
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
					provide: ColumnBoardCopyService,
					useValue: createMock<ColumnBoardCopyService>(),
				},
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
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
		columnBoardCopyService = module.get(ColumnBoardCopyService);
		authorizationService = module.get(AuthorizationService);
		authorizationReferenceService = module.get(AuthorizationReferenceService);
		courseService = module.get(CourseService);

		await setupEntities();
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
		Configuration.set('FEATURE_COLUMNBOARD_SHARE', true);
	});

	describe('create a sharetoken', () => {
		describe('when parent is a course', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();

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

				expect(authorizationReferenceService.checkPermissionByReferences).toHaveBeenCalledWith(
					user.id,
					AuthorizableReferenceType.Course,
					course.id,
					{
						action: Action.write,
						requiredPermissions: [Permission.COURSE_CREATE],
					}
				);
			});

			it('should not check any other permissions', async () => {
				const { user, course } = setup();

				await uc.createShareToken(user.id, {
					parentId: course.id,
					parentType: ShareTokenParentType.Course,
				});

				expect(authorizationReferenceService.checkPermissionByReferences).toHaveBeenCalledTimes(1);
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

				expect(authorizationReferenceService.checkPermissionByReferences).toHaveBeenCalledWith(
					user.id,
					AuthorizableReferenceType.Lesson,
					lesson.id,
					{
						action: Action.write,
						requiredPermissions: [Permission.TOPIC_CREATE],
					}
				);
			});

			it('should not check any other permissions', async () => {
				const { user, lesson } = setup();

				await uc.createShareToken(user.id, {
					parentId: lesson.id,
					parentType: ShareTokenParentType.Lesson,
				});

				expect(authorizationReferenceService.checkPermissionByReferences).toHaveBeenCalledTimes(1);
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

				expect(authorizationReferenceService.checkPermissionByReferences).toHaveBeenCalledWith(
					user.id,
					AuthorizableReferenceType.Task,
					task.id,
					{
						action: Action.write,
						requiredPermissions: [Permission.HOMEWORK_CREATE],
					}
				);
			});

			it('should not check any other permissions', async () => {
				const { user, task } = setup();

				await uc.createShareToken(user.id, {
					parentId: task.id,
					parentType: ShareTokenParentType.Task,
				});

				expect(authorizationReferenceService.checkPermissionByReferences).toHaveBeenCalledTimes(1);
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

				return { user, columnBoard };
			};
			it('should throw if the feature is not enabled', async () => {
				const { user } = setup();
				Configuration.set('FEATURE_COLUMNBOARD_SHARE', false);

				await expect(
					uc.createShareToken(user.id, {
						parentId: '123',
						parentType: ShareTokenParentType.ColumnBoard,
					})
				).rejects.toThrowError();
			});
			it('should check permission for parent', async () => {
				const { user, columnBoard } = setup();

				await uc.createShareToken(user.id, {
					parentId: columnBoard.id,
					parentType: ShareTokenParentType.ColumnBoard,
				});
				expect(authorizationReferenceService.checkPermissionByReferences).toHaveBeenCalledWith(
					user.id,
					AuthorizableReferenceType.BoardNode,
					columnBoard.id,
					{
						action: Action.write,
						requiredPermissions: [Permission.COURSE_EDIT],
					}
				);
			});
		});

		describe('when restricted to same school', () => {
			it('should check parent write permission', async () => {
				const school = schoolEntityFactory.buildWithId();
				const user = userFactory.buildWithId({ school });
				const course = courseFactory.buildWithId();
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

				expect(authorizationReferenceService.checkPermissionByReferences).toHaveBeenCalledWith(
					user.id,
					AuthorizableReferenceType.Course,
					course.id,
					{
						action: Action.write,
						requiredPermissions: [Permission.COURSE_CREATE],
					}
				);
			});

			it('should check context read permission', async () => {
				const school = schoolEntityFactory.buildWithId();
				const user = userFactory.buildWithId({ school });
				const course = courseFactory.buildWithId();
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

				expect(authorizationReferenceService.checkPermissionByReferences).toHaveBeenCalledWith(
					user.id,
					AuthorizableReferenceType.School,
					school.id,
					{
						action: Action.read,
						requiredPermissions: [],
					}
				);
			});

			it('should call the service', async () => {
				const school = schoolEntityFactory.buildWithId();
				const user = userFactory.buildWithId({ school });
				const course = courseFactory.buildWithId();
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
				const course = courseFactory.buildWithId();
				const payload = {
					parentId: course.id,
					parentType: ShareTokenParentType.Course,
				};

				jest.useFakeTimers();
				jest.setSystemTime(new Date(2022, 10, 4));

				await uc.createShareToken(user.id, payload, { expiresInDays: 7 });

				expect(service.createToken).toHaveBeenCalledWith(payload, { expiresAt: new Date(2022, 10, 11) });

				jest.useRealTimers();
			});
		});

		it('should return service result', async () => {
			const user = userFactory.buildWithId();
			const course = courseFactory.buildWithId();
			const shareToken = shareTokenFactory.build();

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

				const course = courseFactory.buildWithId();
				const payload: ShareTokenPayload = {
					parentType: ShareTokenParentType.Course,
					parentId: course.id,
				};
				const shareToken = shareTokenFactory.build({ payload });
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

				const course = courseFactory.buildWithId();
				const lesson = lessonFactory.buildWithId({ course });
				const payload: ShareTokenPayload = {
					parentType: ShareTokenParentType.Lesson,
					parentId: lesson.id,
				};
				const shareToken = shareTokenFactory.build({ payload });
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

				const course = courseFactory.buildWithId();
				const task = taskFactory.buildWithId({ course });
				const payload: ShareTokenPayload = {
					parentType: ShareTokenParentType.Task,
					parentId: task.id,
				};
				const shareToken = shareTokenFactory.build({ payload });
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

				const course = courseFactory.buildWithId();
				const columnBoard = columnBoardFactory.build();
				const payload: ShareTokenPayload = {
					parentType: ShareTokenParentType.ColumnBoard,
					parentId: columnBoard.id,
				};
				const shareToken = shareTokenFactory.build({ payload });
				service.lookupTokenWithParentName.mockResolvedValueOnce({ shareToken, parentName: columnBoard.title });

				return { user, shareToken, columnBoard, course };
			};

			it('should throw if the feature is not enabled', async () => {
				const { user, shareToken } = setup();
				Configuration.set('FEATURE_COLUMNBOARD_SHARE', false);

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
			const setup = () => {
				const school = schoolEntityFactory.buildWithId();
				const user = userFactory.buildWithId({ school });
				const shareToken = shareTokenFactory.build({
					context: { contextType: ShareTokenContextType.School, contextId: school.id },
				});
				const parentName = 'name';
				service.lookupTokenWithParentName.mockResolvedValueOnce({ shareToken, parentName });
				return { user, school, shareToken };
			};

			it('should check context read permission', async () => {
				const { user, school, shareToken } = setup();

				await uc.lookupShareToken(user.id, shareToken.token);

				expect(authorizationReferenceService.checkPermissionByReferences).toHaveBeenCalledWith(
					user.id,
					AuthorizableReferenceType.School,
					school.id,
					{
						action: Action.read,
						requiredPermissions: [],
					}
				);
			});
		});

		describe('when not restricted to same school', () => {
			const setup = () => {
				const school = schoolEntityFactory.buildWithId();
				const user = userFactory.buildWithId({ school });
				const shareToken = shareTokenFactory.build();
				const parentName = 'name';
				service.lookupTokenWithParentName.mockResolvedValueOnce({ shareToken, parentName });
				return { user, school, shareToken };
			};

			it('should not check context read permission', async () => {
				const { user, shareToken } = setup();

				await uc.lookupShareToken(user.id, shareToken.token);

				expect(authorizationReferenceService.checkPermissionByReferences).not.toHaveBeenCalled();
			});
		});

		describe('when parent type is not allowed', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				const course = courseFactory.buildWithId();
				const payload: ShareTokenPayload = {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					parentType: 'invalid',
					parentId: course.id,
				};
				const shareToken = shareTokenFactory.build({ payload });
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

				const shareToken = shareTokenFactory.build();
				service.lookupToken.mockResolvedValueOnce(shareToken);

				const course = courseFactory.buildWithId();
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
					InternalServerErrorException
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
				const course = courseFactory.buildWithId();
				courseService.findById.mockResolvedValueOnce(course);
				const lesson = lessonFactory.buildWithId({ course });

				const status: CopyStatus = {
					type: CopyElementType.LESSON,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: lesson,
				};
				lessonCopyService.copyLesson.mockResolvedValueOnce(status);

				const payload: ShareTokenPayload = { parentType: ShareTokenParentType.Lesson, parentId: lesson._id.toString() };
				const shareToken = shareTokenFactory.build({ payload });
				service.lookupToken.mockResolvedValueOnce(shareToken);

				return { user, school, shareToken, status, course, lesson };
			};

			it('should throw if the feature is not enabled', async () => {
				const { user, shareToken } = setup();
				Configuration.set('FEATURE_LESSON_SHARE', false);

				await expect(uc.importShareToken(user.id, shareToken.token, 'NewName')).rejects.toThrowError(
					InternalServerErrorException
				);
			});

			it('should throw if the destinationCourseId is not passed', async () => {
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

				expect(authorizationReferenceService.checkPermissionByReferences).toBeCalledWith(
					user.id,
					AuthorizableReferenceType.Course,
					course.id,
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

				const course = courseFactory.buildWithId();
				courseService.findById.mockResolvedValueOnce(course);
				const task = taskFactory.buildWithId({ course });
				const status: CopyStatus = {
					type: CopyElementType.TASK,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: task,
				};
				taskCopyService.copyTask.mockResolvedValueOnce(status);

				const payload: ShareTokenPayload = { parentType: ShareTokenParentType.Task, parentId: task._id.toString() };
				const shareToken = shareTokenFactory.build({ payload });
				service.lookupToken.mockResolvedValueOnce(shareToken);

				return { user, school, shareToken, status, course, task };
			};

			it('should throw if the feature is not enabled', async () => {
				const { user, shareToken } = setupTask();
				Configuration.set('FEATURE_TASK_SHARE', false);

				await expect(uc.importShareToken(user.id, shareToken.token, 'NewName')).rejects.toThrowError(
					InternalServerErrorException
				);
			});

			it('should throw if the destinationCourseId is not passed', async () => {
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

				expect(authorizationReferenceService.checkPermissionByReferences).toBeCalledWith(
					user.id,
					AuthorizableReferenceType.Course,
					course.id,
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
				const course = courseFactory.buildWithId();
				courseService.findById.mockResolvedValueOnce(course);

				const columnBoard = columnBoardFactory.build();
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				const payload: ShareTokenPayload = { parentType: ShareTokenParentType.ColumnBoard, parentId: columnBoard.id };
				const shareToken = shareTokenFactory.build({ payload });
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
				Configuration.set('FEATURE_COLUMNBOARD_SHARE', false);
				await expect(uc.importShareToken(user.id, shareToken.token, 'NewName')).rejects.toThrowError(
					InternalServerErrorException
				);
			});
			it('should check the permission to create the columnboard', async () => {
				const { user, shareToken, course } = setup();
				await uc.importShareToken(user.id, shareToken.token, 'NewName', course.id);
				expect(authorizationReferenceService.checkPermissionByReferences).toHaveBeenCalledWith(
					user.id,
					AuthorizableReferenceType.Course,
					course.id,
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
				expect(columnBoardCopyService.copyColumnBoard).toHaveBeenCalledWith({
					originalColumnBoardId: columnBoard.id,
					destinationExternalReference: { type: BoardExternalReferenceType.Course, id: course.id },
					userId: user.id,
				});
			});
			it('should return the result', async () => {
				const { user, shareToken, columnBoard } = setup();
				const status: CopyStatus = {
					type: CopyElementType.COLUMNBOARD,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: columnBoard,
				};
				columnBoardCopyService.copyColumnBoard.mockResolvedValueOnce(status);
				const newName = 'NewName';

				const result = await uc.importShareToken(user.id, shareToken.token, newName, columnBoard.id);

				expect(result).toEqual(status);
			});
		});

		describe('when parent type is not allowed', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				const course = courseFactory.buildWithId();
				const payload: ShareTokenPayload = {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					parentType: 'invalid',
					parentId: course.id,
				};
				const shareToken = shareTokenFactory.build({ payload });
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
				const school = schoolEntityFactory.buildWithId();

				const user = userFactory.buildWithId({ school });
				authorizationService.getUserWithPermissions.mockResolvedValue(user);

				const course = courseFactory.buildWithId();
				const status: CopyStatus = {
					type: CopyElementType.COURSE,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: course,
				};
				courseCopyService.copyCourse.mockResolvedValueOnce(status);

				const shareToken = shareTokenFactory.build({
					payload: { parentType: ShareTokenParentType.Course, parentId: course.id },
					context: { contextType: ShareTokenContextType.School, contextId: school.id },
				});
				service.lookupToken.mockResolvedValueOnce(shareToken);

				return { user, school, course, shareToken, status };
			};
			it('should check context read permission', async () => {
				const { user, shareToken, school, course } = setup();

				await uc.importShareToken(user.id, shareToken.token, 'NewName', course.id);

				expect(authorizationReferenceService.checkPermissionByReferences).toHaveBeenNthCalledWith(
					1,
					user.id,
					AuthorizableReferenceType.School,
					school.id,
					{
						action: Action.read,
						requiredPermissions: [],
					}
				);
			});
		});

		describe('when not restricted to same school', () => {
			const setup = () => {
				const school = schoolEntityFactory.buildWithId();

				const user = userFactory.buildWithId({ school });
				authorizationService.getUserWithPermissions.mockResolvedValue(user);

				const course = courseFactory.buildWithId();
				const status: CopyStatus = {
					type: CopyElementType.COURSE,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: course,
				};
				courseCopyService.copyCourse.mockResolvedValueOnce(status);

				const shareToken = shareTokenFactory.build({
					payload: { parentType: ShareTokenParentType.Course, parentId: course.id },
				});
				service.lookupToken.mockResolvedValueOnce(shareToken);

				return { user, school, course, shareToken, status };
			};
			it('should not check context read permission', async () => {
				const { user, shareToken } = setup();

				await uc.importShareToken(user.id, shareToken.token, 'NewName');

				expect(authorizationReferenceService.checkPermissionByReferences).not.toHaveBeenCalled();
			});
		});
	});
});
