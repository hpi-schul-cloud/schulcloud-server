import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Action, AuthorizationHelper, AuthorizationInjectionService } from '@modules/authorization';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { externalToolFactory } from '@modules/tool/external-tool/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { ExternalToolRule } from './external-tool.rule';

describe(ExternalToolRule.name, () => {
	let module: TestingModule;
	let rule: ExternalToolRule;

	let authorizationHelper: DeepMocked<AuthorizationHelper>;
	let injectionService: DeepMocked<AuthorizationInjectionService>;

	beforeAll(async () => {
		await setupEntities([User]);

		module = await Test.createTestingModule({
			providers: [
				ExternalToolRule,
				{
					provide: AuthorizationHelper,
					useValue: createMock<AuthorizationHelper>(),
				},
				AuthorizationInjectionService,
			],
		}).compile();

		rule = module.get(ExternalToolRule);
		authorizationHelper = module.get(AuthorizationHelper);
		injectionService = module.get(AuthorizationInjectionService);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('constructor', () => {
		it('should inject itself into the AuthorizationInjectionService', () => {
			expect(injectionService.getAuthorizationRules()).toContain(rule);
		});
	});

	describe('isApplicable', () => {
		describe('when the object is an external tool', () => {
			const setup = () => {
				const user: User = userFactory.build();
				const object: ExternalTool = externalToolFactory.build();

				return {
					object,
					user,
				};
			};

			it('should return true', () => {
				const { user, object } = setup();

				const result = rule.isApplicable(user, object);

				expect(result).toEqual(true);
			});
		});

		describe('when the object is not an external tool', () => {
			it('should return false', () => {
				const user: User = userFactory.build();

				const result = rule.isApplicable(user, user);

				expect(result).toEqual(false);
			});
		});
	});

	describe('hasPermission', () => {
		describe('when the user has the permission', () => {
			const setup = () => {
				const user: User = userFactory.build();
				const object: ExternalTool = externalToolFactory.build();

				authorizationHelper.hasAllPermissions.mockReturnValueOnce(true);

				return {
					object,
					user,
				};
			};

			it('should check all permissions', () => {
				const { user, object } = setup();

				rule.hasPermission(user, object, {
					action: Action.read,
					requiredPermissions: [Permission.TOOL_ADMIN],
				});

				expect(authorizationHelper.hasAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_ADMIN]);
			});

			it('should return true', () => {
				const { user, object } = setup();

				const result = rule.hasPermission(user, object, {
					action: Action.read,
					requiredPermissions: [Permission.TOOL_ADMIN],
				});

				expect(result).toEqual(true);
			});
		});

		describe('when the user does not have the permission', () => {
			const setup = () => {
				const user: User = userFactory.build();
				const object: ExternalTool = externalToolFactory.build();

				authorizationHelper.hasAllPermissions.mockReturnValueOnce(false);

				return {
					object,
					user,
				};
			};

			it('should check all permissions', () => {
				const { user, object } = setup();

				rule.hasPermission(user, object, {
					action: Action.read,
					requiredPermissions: [Permission.TOOL_ADMIN],
				});

				expect(authorizationHelper.hasAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_ADMIN]);
			});

			it('should return false', () => {
				const { user, object } = setup();

				const result = rule.hasPermission(user, object, {
					action: Action.read,
					requiredPermissions: [Permission.TOOL_ADMIN],
				});

				expect(result).toEqual(false);
			});
		});
	});
});
