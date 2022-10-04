import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Actions, Permission, ShareTokenContextType, ShareTokenParentType } from '@shared/domain';
import { courseFactory, schoolFactory, setupEntities, shareTokenFactory, userFactory } from '@shared/testing';
import { AuthorizationService } from '@src/modules/authorization';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';
import { ShareTokenService } from '../share-token.service';
import { ShareTokenUC } from './share-token.uc';

describe('ShareTokenUC', () => {
	let orm: MikroORM;
	let uc: ShareTokenUC;
	let service: DeepMocked<ShareTokenService>;
	let authService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
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
			],
		}).compile();

		uc = await module.get(ShareTokenUC);
		service = await module.get(ShareTokenService);
		authService = await module.get(AuthorizationService);
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('create a sharetoken', () => {
		describe('when parent is a course', () => {
			it('should check parent write permission', async () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();

				await uc.createShareToken(user.id, {
					parentId: course.id,
					parentType: ShareTokenParentType.Course,
				});

				expect(authService.checkPermissionByReferences).toHaveBeenCalledWith(
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
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();

				await uc.createShareToken(user.id, {
					parentId: course.id,
					parentType: ShareTokenParentType.Course,
				});

				expect(authService.checkPermissionByReferences).toHaveBeenCalledTimes(1);
			});

			it('should call the service', async () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();

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
				authService.getUserWithPermissions.mockResolvedValue(user);

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

				expect(authService.checkPermissionByReferences).toHaveBeenCalledWith(
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
				authService.getUserWithPermissions.mockResolvedValue(user);

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

				expect(authService.checkPermissionByReferences).toHaveBeenCalledWith(
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
				authService.getUserWithPermissions.mockResolvedValue(user);

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

		describe('when an expiration date is given', () => {
			it.only('should pass the expiration date to the service', async () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
				const payload = {
					parentId: course.id,
					parentType: ShareTokenParentType.Course,
				};

				jest.useFakeTimers('modern');
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

	describe('look up a sharetoken', () => {
		it('should throw NotImplemented for now', async () => {
			const user = userFactory.buildWithId();
			const shareToken = shareTokenFactory.build();
			service.lookupToken.mockResolvedValue(shareToken);
			await expect(uc.lookupShareToken(user.id, shareToken.token)).rejects.toThrow(NotImplementedException);
		});
	});
});
