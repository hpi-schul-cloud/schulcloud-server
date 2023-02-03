import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { MikroORM } from '@mikro-orm/core';
import { BadRequestException, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Actions, LearnroomMetadata, LearnroomTypes, Permission } from '@shared/domain';
import { CourseRepo, LessonRepo } from '@shared/repo';

import {
	courseFactory,
	lessonFactory,
	schoolFactory,
	setupEntities,
	shareTokenFactory,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { Logger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@src/modules/copy-helper';
import { CourseCopyService } from '@src/modules/learnroom';
import { MetadataLoader } from '@src/modules/learnroom/service/metadata-loader.service';
import { LessonCopyService } from '@src/modules/lesson/service';
import { ShareTokenContextType, ShareTokenParentType, ShareTokenPayload } from '../domainobject/share-token.do';
import { ShareTokenService } from '../service';
import { ShareTokenUC } from './share-token.uc';

describe('ShareTokenUC', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let uc: ShareTokenUC;
	let service: DeepMocked<ShareTokenService>;
	let metadataLoader: DeepMocked<MetadataLoader>;
	let courseCopyService: DeepMocked<CourseCopyService>;
	let lessonCopyService: DeepMocked<LessonCopyService>;
	let authorization: DeepMocked<AuthorizationService>;
	let courseRepo: DeepMocked<CourseRepo>;
	let lessonRepo: DeepMocked<LessonRepo>;

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
					provide: MetadataLoader,
					useValue: createMock<MetadataLoader>(),
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
					provide: LessonRepo,
					useValue: createMock<LessonRepo>(),
				},
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		uc = module.get(ShareTokenUC);
		service = module.get(ShareTokenService);
		metadataLoader = module.get(MetadataLoader);
		courseCopyService = module.get(CourseCopyService);
		lessonCopyService = module.get(LessonCopyService);
		authorization = module.get(AuthorizationService);
		courseRepo = module.get(CourseRepo);
		lessonRepo = module.get(LessonRepo);
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
		jest.clearAllMocks();
		Configuration.set('FEATURE_COURSE_SHARE_NEW', true);
		Configuration.set('FEATURE_LESSON_SHARE_NEW', true);
	});

	describe('create a sharetoken', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const course = courseFactory.buildWithId();
			const lesson = lessonFactory.buildWithId();

			return { user, course, lesson };
		};

		describe('when parent is a course', () => {
			it('should throw if the feature is not enabled', async () => {
				const { user, course } = setup();
				Configuration.set('FEATURE_COURSE_SHARE_NEW', false);

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

				expect(authorization.checkPermissionByReferences).toHaveBeenCalledWith(
					user.id,
					AllowedAuthorizationEntityType.Course,
					course.id,
					{
						action: Actions.write,
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

				expect(authorization.checkPermissionByReferences).toHaveBeenCalledTimes(1);
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
			it('should throw if the feature is not enabled', async () => {
				const { user, lesson } = setup();
				Configuration.set('FEATURE_LESSON_SHARE_NEW', false);

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

				expect(authorization.checkPermissionByReferences).toHaveBeenCalledWith(
					user.id,
					AllowedAuthorizationEntityType.Lesson,
					lesson.id,
					{
						action: Actions.write,
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

				expect(authorization.checkPermissionByReferences).toHaveBeenCalledTimes(1);
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

		describe('when restricted to same school', () => {
			it('should check parent write permission', async () => {
				const school = schoolFactory.buildWithId();
				const user = userFactory.buildWithId({ school });
				const course = courseFactory.buildWithId();
				authorization.getUserWithPermissions.mockResolvedValue(user);

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

				expect(authorization.checkPermissionByReferences).toHaveBeenCalledWith(
					user.id,
					AllowedAuthorizationEntityType.Course,
					course.id,
					{
						action: Actions.write,
						requiredPermissions: [Permission.COURSE_CREATE],
					}
				);
			});

			it('should check context read permission', async () => {
				const school = schoolFactory.buildWithId();
				const user = userFactory.buildWithId({ school });
				const course = courseFactory.buildWithId();
				authorization.getUserWithPermissions.mockResolvedValue(user);

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

				expect(authorization.checkPermissionByReferences).toHaveBeenCalledWith(
					user.id,
					AllowedAuthorizationEntityType.School,
					school.id,
					{
						action: Actions.read,
						requiredPermissions: [],
					}
				);
			});

			it('should call the service', async () => {
				const school = schoolFactory.buildWithId();
				const user = userFactory.buildWithId({ school });
				const course = courseFactory.buildWithId();
				authorization.getUserWithPermissions.mockResolvedValue(user);

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

			service.createToken.mockResolvedValue(shareToken);

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
				const school = schoolFactory.buildWithId();

				const user = userFactory.buildWithId({ school });
				authorization.getUserWithPermissions.mockResolvedValue(user);

				const shareToken = shareTokenFactory.build();
				service.lookupToken.mockResolvedValue(shareToken);

				const metadata: LearnroomMetadata = {
					id: '634d78fc28c2e527f9255119',
					type: LearnroomTypes.Course,
					title: 'course #1',
					shortTitle: 'c1',
					displayColor: '#ffffff',
				};
				metadataLoader.loadMetadata.mockResolvedValue(metadata);

				return { user, school, shareToken, metadata };
			};

			it('should throw if the feature is not enabled', async () => {
				const { user, shareToken } = setup();
				Configuration.set('FEATURE_COURSE_SHARE_NEW', false);

				await expect(uc.lookupShareToken(user.id, shareToken.token)).rejects.toThrowError();
			});

			it('should load the share token', async () => {
				const { user, shareToken } = setup();

				await uc.lookupShareToken(user.id, shareToken.token);

				expect(service.lookupToken).toBeCalledWith(shareToken.token);
			});

			it('should load payload metadata', async () => {
				const { user, shareToken } = setup();

				await uc.lookupShareToken(user.id, shareToken.token);

				expect(metadataLoader.loadMetadata).toBeCalledWith({
					type: LearnroomTypes.Course,
					id: shareToken.payload.parentId,
				});
			});

			it('should return the result', async () => {
				const { user, shareToken, metadata } = setup();

				const result = await uc.lookupShareToken(user.id, shareToken.token);

				expect(result).toEqual({
					token: shareToken.token,
					parentType: ShareTokenParentType.Course,
					parentName: metadata.title,
				});
			});

			describe('when restricted to same school', () => {
				it('should check context read permission', async () => {
					const { user, school } = setup();
					const shareToken = shareTokenFactory.build({
						context: { contextType: ShareTokenContextType.School, contextId: school.id },
					});
					service.lookupToken.mockResolvedValue(shareToken);

					await uc.lookupShareToken(user.id, shareToken.token);

					expect(authorization.checkPermissionByReferences).toHaveBeenCalledWith(
						user.id,
						AllowedAuthorizationEntityType.School,
						school.id,
						{
							action: Actions.read,
							requiredPermissions: [],
						}
					);
				});
			});

			describe('when not restricted to same school', () => {
				it('should not check context read permission', async () => {
					const { user } = setup();
					const shareToken = shareTokenFactory.build();
					service.lookupToken.mockResolvedValue(shareToken);

					await uc.lookupShareToken(user.id, shareToken.token);

					expect(authorization.checkPermissionByReferences).not.toHaveBeenCalled();
				});
			});
		});

		describe('when parent is a lesson', () => {
			const setup = () => {
				const school = schoolFactory.buildWithId();

				const user = userFactory.buildWithId({ school });
				authorization.getUserWithPermissions.mockResolvedValue(user);

				const lesson = lessonFactory.buildWithId();
				const payload: ShareTokenPayload = {
					parentType: ShareTokenParentType.Lesson,
					parentId: lesson._id.toHexString(),
				};
				const shareToken = shareTokenFactory.build({ payload });
				service.lookupToken.mockResolvedValue(shareToken);

				const metadata: BaseMetadata = {
					id: lesson._id.toHexString(),
					type: LearnroomTypes.Lesson,
					title: 'Lesson #1',
				};
				metadataLoader.loadMetadata.mockResolvedValue(metadata);

				return { user, school, shareToken, metadata };
			};

			it('should throw if the feature is not enabled', async () => {
				const { user, shareToken } = setup();
				Configuration.set('FEATURE_LESSON_SHARE_NEW', false);

				await expect(uc.lookupShareToken(user.id, shareToken.token)).rejects.toThrowError();
			});

			it('should load the share token', async () => {
				const { user, shareToken } = setup();

				await uc.lookupShareToken(user.id, shareToken.token);

				expect(service.lookupToken).toBeCalledWith(shareToken.token);
			});

			it('should load payload metadata', async () => {
				const { user, shareToken } = setup();

				await uc.lookupShareToken(user.id, shareToken.token);

				expect(metadataLoader.loadMetadata).toBeCalledWith({
					type: LearnroomTypes.Lesson,
					id: shareToken.payload.parentId,
				});
			});

			it('should return the result', async () => {
				const { user, shareToken, metadata } = setup();

				const result = await uc.lookupShareToken(user.id, shareToken.token);

				expect(result).toEqual({
					token: shareToken.token,
					parentType: ShareTokenParentType.Lesson,
					parentName: metadata.title,
				});
			});

			describe('when restricted to same school', () => {
				it('should check context read permission', async () => {
					const { user, school } = setup();
					const shareToken = shareTokenFactory.build({
						context: { contextType: ShareTokenContextType.School, contextId: school.id },
					});
					service.lookupToken.mockResolvedValue(shareToken);

					await uc.lookupShareToken(user.id, shareToken.token);

					expect(authorization.checkPermissionByReferences).toHaveBeenCalledWith(
						user.id,
						AllowedAuthorizationEntityType.School,
						school.id,
						{
							action: Actions.read,
							requiredPermissions: [],
						}
					);
				});
			});

			describe('when not restricted to same school', () => {
				it('should not check context read permission', async () => {
					const { user } = setup();
					const shareToken = shareTokenFactory.build();
					service.lookupToken.mockResolvedValue(shareToken);

					await uc.lookupShareToken(user.id, shareToken.token);

					expect(authorization.checkPermissionByReferences).not.toHaveBeenCalled();
				});
			});
		});
	});

	describe('import share token', () => {
		describe('when parent is a course', () => {
			const setup = () => {
				const school = schoolFactory.buildWithId();

				const user = userFactory.buildWithId({ school });
				authorization.getUserWithPermissions.mockResolvedValue(user);

				const shareToken = shareTokenFactory.build();
				service.lookupToken.mockResolvedValue(shareToken);

				const course = courseFactory.buildWithId();
				const status: CopyStatus = {
					type: CopyElementType.COURSE,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: course,
				};
				courseCopyService.copyCourse.mockResolvedValue(status);

				return { user, school, shareToken, status };
			};

			it('should throw if the feature is not enabled', async () => {
				const { user, shareToken } = setup();
				Configuration.set('FEATURE_COURSE_SHARE_NEW', false);

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

				expect(authorization.checkAllPermissions).toBeCalledWith(user, [Permission.COURSE_CREATE]);
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

			describe('when restricted to same school', () => {
				it('should check context read permission', async () => {
					const { user, school } = setup();
					const shareToken = shareTokenFactory.build({
						context: { contextType: ShareTokenContextType.School, contextId: school.id },
					});
					service.lookupToken.mockResolvedValue(shareToken);

					await uc.importShareToken(user.id, shareToken.token, 'NewName');

					expect(authorization.checkPermissionByReferences).toHaveBeenCalledWith(
						user.id,
						AllowedAuthorizationEntityType.School,
						school.id,
						{
							action: Actions.read,
							requiredPermissions: [],
						}
					);
				});
			});

			describe('when not restricted to same school', () => {
				it('should not check context read permission', async () => {
					const { user } = setup();
					const shareToken = shareTokenFactory.build();
					service.lookupToken.mockResolvedValue(shareToken);

					await uc.importShareToken(user.id, shareToken.token, 'NewName');

					expect(authorization.checkPermissionByReferences).not.toHaveBeenCalled();
				});
			});
		});

		describe('when parent is a lesson', () => {
			const setup = () => {
				const school = schoolFactory.buildWithId();

				const user = userFactory.buildWithId({ school });
				authorization.getUserWithPermissions.mockResolvedValue(user);
				const course = courseFactory.buildWithId();
				courseRepo.findById.mockResolvedValue(course);
				const lesson = lessonFactory.buildWithId({ course });
				lessonRepo.findById.mockResolvedValue(lesson);

				const status: CopyStatus = {
					type: CopyElementType.LESSON,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: lesson,
				};
				lessonCopyService.copyLesson.mockResolvedValue(status);

				const payload: ShareTokenPayload = { parentType: ShareTokenParentType.Lesson, parentId: lesson._id.toString() };
				const shareToken = shareTokenFactory.build({ payload });
				service.lookupToken.mockResolvedValue(shareToken);

				return { user, school, shareToken, status, course, lesson };
			};

			it('should throw if the feature is not enabled', async () => {
				const { user, shareToken } = setup();
				Configuration.set('FEATURE_LESSON_SHARE_NEW', false);

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

			it('should check the permission to create the topic', async () => {
				const { user, shareToken, course } = setup();

				await uc.importShareToken(user.id, shareToken.token, 'NewName', course._id.toHexString());

				expect(authorization.checkAllPermissions).toBeCalledWith(user, [Permission.TOPIC_CREATE]);
			});

			it('should use the service to copy the lesson', async () => {
				const { user, shareToken, course, lesson } = setup();
				const copyName = 'NewName';

				await uc.importShareToken(user.id, shareToken.token, copyName, course._id.toHexString());

				expect(lessonCopyService.copyLesson).toBeCalledWith({
					copyName,
					destinationCourse: course,
					originalLesson: lesson,
					user,
				});
			});

			it('should return the result', async () => {
				const { user, shareToken, status, course } = setup();
				const newName = 'NewName';

				const result = await uc.importShareToken(user.id, shareToken.token, newName, course._id.toHexString());

				expect(result).toEqual(status);
			});

			describe('when restricted to same school', () => {
				it('should check context read permission', async () => {
					const { user, school } = setup();
					const shareToken = shareTokenFactory.build({
						context: { contextType: ShareTokenContextType.School, contextId: school.id },
					});
					service.lookupToken.mockResolvedValue(shareToken);

					await uc.importShareToken(user.id, shareToken.token, 'NewName');

					expect(authorization.checkPermissionByReferences).toHaveBeenCalledWith(
						user.id,
						AllowedAuthorizationEntityType.School,
						school.id,
						{
							action: Actions.read,
							requiredPermissions: [],
						}
					);
				});
			});

			describe('when not restricted to same school', () => {
				it('should not check context read permission', async () => {
					const { user } = setup();
					const shareToken = shareTokenFactory.build();
					service.lookupToken.mockResolvedValue(shareToken);

					await uc.importShareToken(user.id, shareToken.token, 'NewName');

					expect(authorization.checkPermissionByReferences).not.toHaveBeenCalled();
				});
			});
		});

		describe('when parent is a task', () => {
			const setupTask = () => {
				const school = schoolFactory.buildWithId();

				const user = userFactory.buildWithId({ school });
				authorization.getUserWithPermissions.mockResolvedValue(user);

				const task = taskFactory.buildWithId();
				const status: CopyStatus = {
					type: CopyElementType.LESSON,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: task,
				};
				lessonCopyService.copyLesson.mockResolvedValue(status);

				const payload: ShareTokenPayload = { parentType: ShareTokenParentType.Task, parentId: task._id.toString() };
				const shareToken = shareTokenFactory.build({ payload });
				service.lookupToken.mockResolvedValue(shareToken);

				return { user, school, shareToken, status };
			};

			it('should throw as importing is not implemented', async () => {
				const { user, shareToken } = setupTask();

				await expect(uc.importShareToken(user.id, shareToken.token, 'NewName', '')).rejects.toThrowError(
					NotImplementedException
				);
			});

			it('should throw for copy task', async () => {
				const { user, shareToken } = setupTask();

				jest.spyOn(ShareTokenUC.prototype as any, 'checkFeatureEnabled').mockImplementationOnce(() => {});
				jest.spyOn(ShareTokenUC.prototype as any, 'checkCreatePermission').mockImplementationOnce(async () => {});

				await expect(uc.importShareToken(user.id, shareToken.token, 'NewName', '')).rejects.toThrowError(
					'Copy not implemented'
				);
			});
		});
	});
});
