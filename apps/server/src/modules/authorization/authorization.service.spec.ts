import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ForbiddenException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain';
import { setupEntities, userFactory } from '@shared/testing';
import { AuthorizationContextBuilder } from './authorization-context.builder';
import { AuthorizationHelper } from './authorization.helper';
import { AuthorizationService } from './authorization.service';
import { ReferenceLoader } from './reference.loader';
import { RuleManager } from './rule-manager';
import { ALL_RULES } from './rules';
import { AllowedAuthorizationEntityType } from './types';

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
					useValue: createMock<AuthorizationHelper>(),
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

	describe('checkIfAuthorized', () => {
		describe('when isAuthorized of RuleManager returns false', () => {
			const setup = () => {
				const context = AuthorizationContextBuilder.read([]);
				const user = userFactory.build();
				ruleManager.isAuthorized.mockReturnValueOnce(false);

				return { context, user };
			};

			it('should throw ForbiddenException', () => {
				const { context, user } = setup();

				expect(() => service.checkIfAuthorized(user, user, context)).toThrow(ForbiddenException);
			});
		});

		describe('when isAuthorized of RuleManager returns true', () => {
			const setup = () => {
				const context = AuthorizationContextBuilder.read([]);
				const user = userFactory.build();
				ruleManager.isAuthorized.mockReturnValueOnce(true);

				return { context, user };
			};

			it('should not throw', () => {
				const { context, user } = setup();

				expect(() => service.checkIfAuthorized(user, user, context)).not.toThrow();
			});
		});
	});

	describe('isAuthorized', () => {
		describe('when isAuthorized of RuleManager returns false', () => {
			const setup = () => {
				const context = AuthorizationContextBuilder.read([]);
				const user = userFactory.build();
				ruleManager.isAuthorized.mockReturnValueOnce(false);

				return { context, user };
			};

			it('should return false', () => {
				const { context, user } = setup();

				const result = service.isAuthorized(user, user, context);

				expect(result).toBe(false);
			});
		});

		describe('when isAuthorized of RuleManager returns true', () => {
			const setup = () => {
				const context = AuthorizationContextBuilder.read([]);
				const user = userFactory.build();
				ruleManager.isAuthorized.mockReturnValueOnce(true);

				return { context, user };
			};

			it('should return true', () => {
				const { context, user } = setup();

				const result = service.isAuthorized(user, user, context);

				expect(result).toBe(true);
			});
		});
	});

	describe('checkIfAuthorizedByReferences', () => {
		describe('when isAuthorizedByReferences returns false', () => {
			const setup = () => {
				const context = AuthorizationContextBuilder.read([]);
				const userId = 'test';
				const entityId = 'test';
				const entityName = AllowedAuthorizationEntityType.Course;

				jest.spyOn(service, 'isAuthorizedByReferences').mockResolvedValueOnce(false);

				return { context, userId, entityId, entityName };
			};

			it('should reject with ForbiddenException', async () => {
				const { context, userId, entityId, entityName } = setup();

				await expect(service.checkIfAuthorizedByReferences(userId, entityName, entityId, context)).rejects.toThrow(
					ForbiddenException
				);
			});
		});

		describe('when isAuthorizedByReferences returns true', () => {
			const setup = () => {
				const context = AuthorizationContextBuilder.read([]);
				const userId = 'test';
				const entityId = 'test';
				const entityName = AllowedAuthorizationEntityType.Course;

				const spy = jest.spyOn(service, 'isAuthorizedByReferences').mockResolvedValueOnce(true);

				return { context, userId, entityId, entityName, spy };
			};

			it('should resolve', async () => {
				const { context, userId, entityId, entityName, spy } = setup();

				await expect(
					service.checkIfAuthorizedByReferences(userId, entityName, entityId, context)
				).resolves.not.toThrow();

				spy.mockRestore();
			});
		});
	});

	describe('isAuthorizedByReferences', () => {
		describe('when referenceLoader throws an error', () => {
			const setup = () => {
				const context = AuthorizationContextBuilder.read([]);
				const userId = 'test';
				const entityId = 'test';
				const entityName = AllowedAuthorizationEntityType.Course;

				loader.loadEntity.mockRejectedValueOnce(InternalServerErrorException);

				return { context, userId, entityId, entityName };
			};

			it('should reject with ForbiddenException', async () => {
				const { context, userId, entityId, entityName } = setup();

				await expect(service.isAuthorizedByReferences(userId, entityName, entityId, context)).rejects.toThrow(
					ForbiddenException
				);
			});
		});

		describe('when isAuthorized of RuleManager returns true', () => {
			const setup = () => {
				const context = AuthorizationContextBuilder.read([]);
				const userId = 'test';
				const entityId = 'test';
				const entityName = AllowedAuthorizationEntityType.Course;

				ruleManager.isAuthorized.mockReturnValueOnce(true);

				return { context, userId, entityId, entityName };
			};

			it('should resolve to true', async () => {
				const { context, userId, entityId, entityName } = setup();

				const result = await service.isAuthorizedByReferences(userId, entityName, entityId, context);

				expect(result).toBe(true);
			});
		});

		describe('when isAuthorized of RuleManager returns false', () => {
			const setup = () => {
				const context = AuthorizationContextBuilder.read([]);
				const userId = 'test';
				const entityId = 'test';
				const entityName = AllowedAuthorizationEntityType.Course;

				ruleManager.isAuthorized.mockReturnValueOnce(false);

				return { context, userId, entityId, entityName };
			};

			it('should resolve to false', async () => {
				const { context, userId, entityId, entityName } = setup();

				const result = await service.isAuthorizedByReferences(userId, entityName, entityId, context);

				expect(result).toBe(false);
			});
		});
	});

	describe('checkAllPermissions', () => {
		describe('when hasAllPermissions of AuthorizationHelper returns false', () => {
			const setup = () => {
				const user = userFactory.build();
				const requiredPermissions = [Permission.ACCOUNT_CREATE];

				authorizationHelper.hasAllPermissions.mockReturnValueOnce(false);

				return { user, requiredPermissions };
			};

			it('should throw UnauthorizedException', () => {
				const { user, requiredPermissions } = setup();

				expect(() => service.checkAllPermissions(user, requiredPermissions)).toThrow(UnauthorizedException);
			});
		});

		describe('when hasAllPermissions of AuthorizationHelper returns true', () => {
			const setup = () => {
				const user = userFactory.build();
				const requiredPermissions = [Permission.ACCOUNT_CREATE];

				authorizationHelper.hasAllPermissions.mockReturnValueOnce(true);

				return { user, requiredPermissions };
			};

			it('should not throw', () => {
				const { user, requiredPermissions } = setup();

				expect(() => service.checkAllPermissions(user, requiredPermissions)).not.toThrow();
			});
		});
	});

	describe('hasAllPermissions', () => {
		describe('when hasAllPermissions of AuthorizationHelper returns false', () => {
			const setup = () => {
				const user = userFactory.build();
				const requiredPermissions = [Permission.ACCOUNT_CREATE];

				authorizationHelper.hasAllPermissions.mockReturnValueOnce(false);

				return { user, requiredPermissions };
			};

			it('should return false', () => {
				const { user, requiredPermissions } = setup();

				const result = service.hasAllPermissions(user, requiredPermissions);

				expect(result).toBe(false);
			});
		});

		describe('when hasAllPermissions of AuthorizationHelper returns true', () => {
			const setup = () => {
				const user = userFactory.build();
				const requiredPermissions = [Permission.ACCOUNT_CREATE];

				authorizationHelper.hasAllPermissions.mockReturnValueOnce(true);

				return { user, requiredPermissions };
			};

			it('should return true', () => {
				const { user, requiredPermissions } = setup();

				const result = service.hasAllPermissions(user, requiredPermissions);

				expect(result).toBe(true);
			});
		});
	});

	describe('checkOneOfPermissions', () => {
		describe('when hasOneOfPermissions of AuthorizationHelper returns false', () => {
			const setup = () => {
				const user = userFactory.build();
				const requiredPermissions = [Permission.ACCOUNT_CREATE];

				authorizationHelper.hasOneOfPermissions.mockReturnValueOnce(false);

				return { user, requiredPermissions };
			};

			it('should throw UnauthorizedException', () => {
				const { user, requiredPermissions } = setup();

				expect(() => service.checkOneOfPermissions(user, requiredPermissions)).toThrow(UnauthorizedException);
			});
		});

		describe('when hasOneOfPermissions of AuthorizationHelper returns true', () => {
			const setup = () => {
				const user = userFactory.build();
				const requiredPermissions = [Permission.ACCOUNT_CREATE];

				authorizationHelper.hasOneOfPermissions.mockReturnValueOnce(true);

				return { user, requiredPermissions };
			};

			it('should not throw', () => {
				const { user, requiredPermissions } = setup();

				expect(() => service.checkOneOfPermissions(user, requiredPermissions)).not.toThrow();
			});
		});
	});

	describe('hasOneOfPermissions', () => {
		describe('when hasOneOfPermissions of AuthorizationHelper returns false', () => {
			const setup = () => {
				const user = userFactory.build();
				const requiredPermissions = [Permission.ACCOUNT_CREATE];

				authorizationHelper.hasOneOfPermissions.mockReturnValueOnce(false);

				return { user, requiredPermissions };
			};

			it('should return false', () => {
				const { user, requiredPermissions } = setup();

				const result = service.hasOneOfPermissions(user, requiredPermissions);

				expect(result).toBe(false);
			});
		});

		describe('when hasOneOfPermissions of AuthorizationHelper returns true', () => {
			const setup = () => {
				const user = userFactory.build();
				const requiredPermissions = [Permission.ACCOUNT_CREATE];

				authorizationHelper.hasOneOfPermissions.mockReturnValueOnce(true);

				return { user, requiredPermissions };
			};

			it('should return true', () => {
				const { user, requiredPermissions } = setup();

				const result = service.hasOneOfPermissions(user, requiredPermissions);

				expect(result).toBe(true);
			});
		});
	});

	describe('getUserWithPermissions', () => {
		it('should return user received from AuthorizationHelper', async () => {
			const userId = 'test';
			const user = userFactory.build();
			loader.getUserWithPermissions.mockResolvedValueOnce(user);

			const result = await service.getUserWithPermissions(userId);

			expect(result).toEqual(user);
		});
	});
});
