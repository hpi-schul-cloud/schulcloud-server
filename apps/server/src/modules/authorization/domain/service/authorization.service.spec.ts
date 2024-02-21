import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { UserRepo } from '@shared/repo';
import { setupEntities, userFactory } from '@shared/testing';
import { ForbiddenLoggableException } from '../error';
import { AuthorizationContextBuilder } from '../mapper';
import { Rule } from '../type';
import { AuthorizationHelper } from './authorization.helper';
import { AuthorizationService } from './authorization.service';
import { ReferenceLoader } from './reference.loader';
import { RuleManager } from './rule-manager';

class TestRule implements Rule {
	constructor(private returnValueOfhasPermission: boolean) {}

	isApplicable(): boolean {
		return true;
	}

	hasPermission(): boolean {
		return this.returnValueOfhasPermission;
	}
}

describe('AuthorizationService', () => {
	let service: AuthorizationService;
	let ruleManager: DeepMocked<RuleManager>;
	let authorizationHelper: DeepMocked<AuthorizationHelper>;
	let userRepo: DeepMocked<UserRepo>;

	const testPermission = 'CAN_TEST' as Permission;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthorizationService,
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
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
			],
		}).compile();

		service = await module.get(AuthorizationService);
		ruleManager = await module.get(RuleManager);
		authorizationHelper = await module.get(AuthorizationHelper);
		userRepo = await module.get(UserRepo);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('checkPermission', () => {
		describe('when hasPermission returns false', () => {
			const setup = () => {
				const context = AuthorizationContextBuilder.read([]);
				const user = userFactory.buildWithId();

				const spy = jest.spyOn(service, 'hasPermission').mockReturnValueOnce(false);

				return { context, user, spy };
			};

			it('should throw ForbiddenLoggableException', () => {
				const { context, user, spy } = setup();

				expect(() => service.checkPermission(user, user, context)).toThrow(ForbiddenLoggableException);

				spy.mockRestore();
			});
		});

		describe('when hasPermission returns true', () => {
			const setup = () => {
				const context = AuthorizationContextBuilder.read([]);
				const user = userFactory.buildWithId();

				const spy = jest.spyOn(service, 'hasPermission').mockReturnValueOnce(true);

				return { context, user, spy };
			};

			it('should not throw', () => {
				const { context, user, spy } = setup();

				expect(() => service.checkPermission(user, user, context)).not.toThrow();

				spy.mockRestore();
			});
		});
	});

	describe('hasPermission', () => {
		describe('when the selected rule returns false', () => {
			const setup = () => {
				const context = AuthorizationContextBuilder.read([]);
				const user = userFactory.buildWithId();
				const testRule = new TestRule(false);

				ruleManager.selectRule.mockReturnValueOnce(testRule);

				return { context, user };
			};

			it('should return false', () => {
				const { context, user } = setup();

				const result = service.hasPermission(user, user, context);

				expect(result).toBe(false);
			});
		});

		describe('when the selected rule returns true', () => {
			const setup = () => {
				const context = AuthorizationContextBuilder.read([]);
				const user = userFactory.buildWithId();
				const testRule = new TestRule(true);

				ruleManager.selectRule.mockReturnValueOnce(testRule);

				return { context, user };
			};

			it('should return true', () => {
				const { context, user } = setup();

				const result = service.hasPermission(user, user, context);

				expect(result).toBe(true);
			});
		});
	});

	describe('checkAllPermissions', () => {
		describe('when helper method returns false', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const requiredPermissions = [testPermission];

				authorizationHelper.hasAllPermissions.mockReturnValueOnce(false);

				return { user, requiredPermissions };
			};

			it('should throw UnauthorizedException', () => {
				const { user, requiredPermissions } = setup();

				expect(() => service.checkAllPermissions(user, requiredPermissions)).toThrow(UnauthorizedException);
			});
		});

		describe('when helper method returns true', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const requiredPermissions = [testPermission];

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
		describe('when helper method returns false', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const requiredPermissions = [testPermission];

				authorizationHelper.hasAllPermissions.mockReturnValueOnce(false);

				return { user, requiredPermissions };
			};

			it('should return false', () => {
				const { user, requiredPermissions } = setup();

				const result = service.hasAllPermissions(user, requiredPermissions);

				expect(result).toBe(false);
			});
		});

		describe('when helper method returns true', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const requiredPermissions = [testPermission];

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
		describe('when helper method returns false', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const requiredPermissions = [testPermission];

				authorizationHelper.hasOneOfPermissions.mockReturnValueOnce(false);

				return { user, requiredPermissions };
			};

			it('should throw UnauthorizedException', () => {
				const { user, requiredPermissions } = setup();

				expect(() => service.checkOneOfPermissions(user, requiredPermissions)).toThrow(UnauthorizedException);
			});
		});

		describe('when helper method returns true', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const requiredPermissions = [testPermission];

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
		describe('when helper method returns false', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const requiredPermissions = [testPermission];

				authorizationHelper.hasOneOfPermissions.mockReturnValueOnce(false);

				return { user, requiredPermissions };
			};

			it('should return false', () => {
				const { user, requiredPermissions } = setup();

				const result = service.hasOneOfPermissions(user, requiredPermissions);

				expect(result).toBe(false);
			});
		});

		describe('when helper method returns true', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const requiredPermissions = [testPermission];

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
		const setup = () => {
			const user = userFactory.buildWithId();

			userRepo.findById.mockResolvedValueOnce(user);

			return { user };
		};

		it('should return user received from loader', async () => {
			const { user } = setup();

			const result = await service.getUserWithPermissions(user.id);

			expect(result).toEqual(user);
		});
	});
});
