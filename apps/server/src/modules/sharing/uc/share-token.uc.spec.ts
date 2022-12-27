import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
	Actions,
	CopyElementType,
	CopyStatus,
	CopyStatusEnum,
	LearnroomMetadata,
	LearnroomTypes,
	Permission,
} from '@shared/domain';

import { courseFactory, schoolFactory, setupEntities, shareTokenFactory, userFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';
import { CourseCopyService } from '@src/modules/learnroom';
import { MetadataLoader } from '@src/modules/learnroom/service/metadata-loader.service';
import { ShareTokenContextType, ShareTokenDO, ShareTokenParentType } from '../domainobject/share-token.do';
import { ShareTokenService } from '../service';
import { ShareTokenUC } from './share-token.uc';

describe('ShareTokenUC', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let uc: ShareTokenUC;
	let service: DeepMocked<ShareTokenService>;
	let metadataLoader: DeepMocked<MetadataLoader>;
	let courseCopyService: DeepMocked<CourseCopyService>;
	let authorization: DeepMocked<AuthorizationService>;

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
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		uc = module.get(ShareTokenUC);
		service = module.get(ShareTokenService);
		metadataLoader = module.get(MetadataLoader);
		courseCopyService = module.get(CourseCopyService);
		authorization = module.get(AuthorizationService);
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
		Configuration.set('FEATURE_COURSE_SHARE_NEW', true);
	});

	describe('create a sharetoken', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const course = courseFactory.buildWithId();

			return { user, course };
		};

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

		describe('when parent is a course', () => {
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
			const shareToken: ShareTokenDO = shareTokenFactory.build();

			service.createToken.mockResolvedValue(shareToken);

			const result = await uc.createShareToken(user.id, {
				parentId: course.id,
				parentType: ShareTokenParentType.Course,
			});

			expect(result).toEqual(shareToken);
		});
	});

	describe('lookup a sharetoken', () => {
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

	describe('import share token', () => {
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

			await expect(uc.importShareToken(user.id, shareToken.token, 'NewName')).rejects.toThrowError();
		});

		it('should load the share token', async () => {
			const { user, shareToken } = setup();

			await uc.importShareToken(user.id, shareToken.token, 'NewName');

			expect(service.lookupToken).toBeCalledWith(shareToken.token);
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
});
