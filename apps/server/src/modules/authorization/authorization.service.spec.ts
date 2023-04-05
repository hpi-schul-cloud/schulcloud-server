import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { ForbiddenException, NotFoundException, NotImplementedException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BaseEntity, Permission } from '@shared/domain';
import {
	courseFactory,
	courseGroupFactory,
	lessonFactory,
	roleFactory,
	schoolFactory,
	setupEntities,
	submissionFactory,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { teamFactory } from '@shared/testing/factory/team.factory';
import { AuthorizationContextBuilder } from './authorization-context.builder';
import { AuthorizationHelper } from './authorization.helper';
import { AuthorizationService } from './authorization.service';
import { ReferenceLoader } from './reference.loader';
import { RuleManager } from './rule-manager';
import { ALL_RULES } from './rules';

class TestEntity extends BaseEntity {}

describe('AuthorizationService', () => {
	let service: AuthorizationService;
	let ruleManager: DeepMocked<RuleManager>;
	let loader: DeepMocked<ReferenceLoader>;
	let authorizationHelper: DeepMocked<AuthorizationHelper>;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthorizationService,
				...ALL_RULES,
				{
					provide: RuleManager,
					useValue: createMock<RuleManager>(),
				},
				{
					provide: ReferenceLoader,
					useValue: createMock<ReferenceLoader>(),
				},
				{
					provide: AuthorizationHelper,
					useValue: createMock<AuthorizationHelper>,
				},
			],
		}).compile();

		service = await module.get(AuthorizationService);
		ruleManager = await module.get(RuleManager);
		loader = await module.get(ReferenceLoader);
		authorizationHelper = await module.get(AuthorizationHelper);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('checkPermission', () => {
		describe('when ruleManager.hasPermission returns false', () => {
			const setup = () => {
				const context = AuthorizationContextBuilder.read([]);
				const user = userFactory.build();
				ruleManager.hasPermission.mockReturnValueOnce(false);

				return { context, user };
			};

			it('should throw ForbiddenException', () => {
				const { context, user } = setup();

				expect(() => service.checkPermission(user, user, context)).toThrow(ForbiddenException);
			});
		});

		describe('when ruleManager.hasPermission returns true', () => {
			const setup = () => {
				const context = AuthorizationContextBuilder.read([]);
				const user = userFactory.build();
				ruleManager.hasPermission.mockReturnValueOnce(true);

				return { context, user };
			};

			it('should not throw', () => {
				const { context, user } = setup();

				expect(() => service.checkPermission(user, user, context)).not.toThrow();
			});
		});
	});

	describe('hasPermission', () => {
		describe('when ruleManager.hasPermission returns false', () => {
			const setup = () => {
				const context = AuthorizationContextBuilder.read([]);
				const user = userFactory.build();
				ruleManager.hasPermission.mockReturnValueOnce(false);

				return { context, user };
			};

			it('should return false', () => {
				const { context, user } = setup();

				const result = service.hasPermission(user, user, context);

				expect(result).toBe(false);
			});
		});

		describe('when ruleManager.hasPermission returns true', () => {
			const setup = () => {
				const context = AuthorizationContextBuilder.read([]);
				const user = userFactory.build();
				ruleManager.hasPermission.mockReturnValueOnce(true);

				return { context, user };
			};

			it('should return true', () => {
				const { context, user } = setup();

				const result = service.hasPermission(user, user, context);

				expect(result).toBe(true);
			});
		});
	});

	// describe('hasPermissionByReferences', () => {
	// 	describe('when ReferenceLoader.loadEntity throw an error', () => {
	// 		const setup = () => {
	// 			const context = AuthorizationContextBuilder.read([]);
	// 			const userId = new ObjectId().toHexString();
	// 			const entityName = AllowedAuthorizationEntityType.Course;
	// 			const entityId = new ObjectId().toHexString();

	// 			loader.loadEntity.mockRejectedValueOnce(new NotFoundException());
	// 			const spyGetUserWithPermissions = jest
	// 				.spyOn(service, 'getUserWithPermissions')
	// 				.mockRejectedValueOnce(new NotFoundException());

	// 			return { context, userId, entityName, entityId, spyGetUserWithPermissions };
	// 		};

	// 		it('should throw ForbiddenException', async () => {
	// 			const { context, userId, entityName, entityId, spyGetUserWithPermissions } = setup();

	// 			await expect(service.hasPermissionByReferences(userId, entityName, entityId, context)).rejects.toThrowError(
	// 				ForbiddenException
	// 			);

	// 			spyGetUserWithPermissions.mockRestore();
	// 		});
	// 	});

	// 	describe('when data successfully', () => {
	// 		const setup = () => {
	// 			const context = AuthorizationContextBuilder.read([]);
	// 			const user = userFactory.buildWithId();
	// 			const course = courseFactory.buildWithId();
	// 			const entityName = AllowedAuthorizationEntityType.Course;
	// 			const entityId = course.id;
	// 			const spyGetUserWithPermissions = jest.spyOn(service, 'getUserWithPermissions').mockResolvedValueOnce(user);
	// 			const spyHasPermission = jest.spyOn(service, 'hasPermission').mockReturnValue(true);
	// 			loader.loadEntity.mockResolvedValueOnce(course);

	// 			return { context, course, user, entityName, entityId, spyGetUserWithPermissions, spyHasPermission };
	// 		};

	// 		it('should call AuthorizationService.getUserWithPermissions with specific arguments', async () => {
	// 			const { context, user, entityName, entityId, spyGetUserWithPermissions } = setup();

	// 			await service.hasPermissionByReferences(user.id, entityName, entityId, context);

	// 			expect(spyGetUserWithPermissions).toBeCalledWith(user.id);

	// 			spyGetUserWithPermissions.mockRestore();
	// 		});

	// 		it('should call ReferenceLoader.loadEntity with specific arguments', async () => {
	// 			const { context, user, entityName, entityId, spyHasPermission } = setup();

	// 			await service.hasPermissionByReferences(user.id, entityName, entityId, context);

	// 			expect(loader.loadEntity).toBeCalledWith(entityName, entityId);

	// 			spyHasPermission.mockRestore();
	// 		});

	// 		it('should call AuthorizationService.hasPermission with specific arguments', async () => {
	// 			const { context, user, entityName, course, entityId, spyHasPermission } = setup();

	// 			await service.hasPermissionByReferences(user.id, entityName, entityId, context);

	// 			expect(spyHasPermission).toBeCalledWith(user, course, context);

	// 			spyHasPermission.mockRestore();
	// 		});

	// 		it('should return true', async () => {
	// 			const { context, user, entityName, entityId } = setup();

	// 			const result = await service.hasPermissionByReferences(user.id, entityName, entityId, context);

	// 			expect(result).toStrictEqual(true);
	// 		});
	// 	});
	// });

	// describe('checkPermissionByReferences', () => {
	// 	describe('when hasPermissionByReferences return false', () => {
	// 		const setup = () => {
	// 			const context = AuthorizationContextBuilder.read([]);
	// 			const userId = new ObjectId().toHexString();
	// 			const entityName = AllowedAuthorizationEntityType.Course;
	// 			const entityId = new ObjectId().toHexString();
	// 			const spyHasPermissionByReferences = jest
	// 				.spyOn(service, 'hasPermissionByReferences')
	// 				.mockResolvedValueOnce(false);

	// 			return { context, userId, entityName, entityId, spyHasPermissionByReferences };
	// 		};

	// 		it('should throw ForbiddenException', async () => {
	// 			const { context, userId, entityName, entityId, spyHasPermissionByReferences } = setup();

	// 			await expect(() =>
	// 				service.checkPermissionByReferences(userId, entityName, entityId, context)
	// 			).rejects.toThrowError(ForbiddenException);

	// 			spyHasPermissionByReferences.mockRestore();
	// 		});
	// 	});
	// });

	// describe('getUserWithPermissions', () => {
	// 	describe('when user successfully', () => {
	// 		const setup = () => {
	// 			const user = userFactory.buildWithId();
	// 			loader.getUserWithPermissions.mockResolvedValueOnce(user);

	// 			return {
	// 				user,
	// 			};
	// 		};

	// 		it('should call ReferenceLoader.getUserWithPermissions with specific arguments', async () => {
	// 			const { user } = setup();

	// 			await service.getUserWithPermissions(user.id);

	// 			expect(loader.getUserWithPermissions).toBeCalledWith(user.id);
	// 		});

	// 		it('should return user', async () => {
	// 			const { user } = setup();

	// 			const res = await service.getUserWithPermissions(user.id);

	// 			expect(res).toStrictEqual(user);
	// 		});
	// 	});

	// 	describe('when user can not be found', () => {
	// 		const setup = () => {
	// 			const userId = new ObjectId().toHexString();
	// 			const error = new NotFoundException();

	// 			loader.getUserWithPermissions.mockRejectedValue(error);

	// 			return {
	// 				userId,
	// 				error,
	// 			};
	// 		};
	// 		it('should throw NotFoundException', async () => {
	// 			const { userId, error } = setup();
	// 			await expect(service.getUserWithPermissions(userId)).rejects.toThrowError(error);
	// 		});
	// 	});
	// });
});
