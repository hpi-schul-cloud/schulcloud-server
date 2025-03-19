import { DeepMocked } from '@golevelup/ts-jest';
import {
	AuthorizationContextBuilder,
	AuthorizationHelper,
	AuthorizationInjectionService,
} from '@modules/authorization';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { UserAdminRule } from './user-admin.rule';

describe(UserAdminRule.name, () => {
	let module: TestingModule;
	let rule: UserAdminRule;
	let injectionService: AuthorizationInjectionService;

	let authorizationHelper: DeepMocked<AuthorizationHelper>;

	beforeAll(async () => {
		await setupEntities([User]);

		module = await Test.createTestingModule({
			providers: [UserAdminRule, AuthorizationHelper, AuthorizationInjectionService],
		}).compile();

		rule = module.get(UserAdminRule);
		authorizationHelper = module.get(AuthorizationHelper);
		injectionService = module.get(AuthorizationInjectionService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('constructor', () => {
		it('should inject into AuthorizationInjectionService', () => {
			expect(injectionService.getAuthorizationRules()).toContain(rule);
		});
	});

	describe('isApplicable', () => {
		describe('when the user and object are applicable', () => {
			const setup = () => {
				const user = userFactory.asSuperhero().build();
				const targetUser = userFactory.build();

				return {
					user,
					targetUser,
				};
			};

			it('should return true', () => {
				const { user, targetUser } = setup();

				const result = rule.isApplicable(user, targetUser);

				expect(result).toEqual(true);
			});
		});

		describe('when the entity is not applicable', () => {
			const setup = () => {
				const user = userFactory.asSuperhero().build();
				const notUser = new Object();

				return {
					user,
					notUser,
				};
			};

			it('should return false', () => {
				const { user, notUser } = setup();

				const result = rule.isApplicable(user, notUser as unknown as UserAdminRule);

				expect(result).toEqual(false);
			});
		});
	});

	describe('hasPermission', () => {
		describe('when user is a superhero', () => {
			describe('when the user has write permissions', () => {
				const setup = () => {
					const user = userFactory.asSuperhero().build();
					const targetUser = userFactory.build();
					const context = AuthorizationContextBuilder.write([Permission.CREATE_SUPPORT_JWT]);

					return {
						user,
						targetUser,
						context,
					};
				};

				it('should call hasAllPermissions with expected props', () => {
					const { user, targetUser, context } = setup();
					const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');

					rule.hasPermission(user, targetUser, context);

					expect(spy).toHaveBeenCalledWith(user, [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS]);
					expect(spy).toHaveBeenCalledWith(user, [Permission.INSTANCE_EDIT, ...context.requiredPermissions]);
				});

				it('should return true', () => {
					const { user, targetUser, context } = setup();

					const result = rule.hasPermission(user, targetUser, context);

					expect(result).toEqual(true);
				});
			});

			describe('when the user has read permissions', () => {
				const setup = () => {
					const user = userFactory.asSuperhero().build();
					const targetUser = userFactory.build();
					const context = AuthorizationContextBuilder.read([Permission.CREATE_SUPPORT_JWT]);

					return {
						user,
						targetUser,
						context,
					};
				};

				it('should call hasAllPermissions with expected props', () => {
					const { user, targetUser, context } = setup();
					const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');

					rule.hasPermission(user, targetUser, context);

					expect(spy).toHaveBeenCalledWith(user, [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS]);
					expect(spy).toHaveBeenCalledWith(user, [Permission.INSTANCE_VIEW, ...context.requiredPermissions]);
				});

				it('should return true', () => {
					const { user, targetUser, context } = setup();

					const result = rule.hasPermission(user, targetUser, context);

					expect(result).toEqual(true);
				});
			});
		});

		describe('when user is a student', () => {
			describe('when the user has no write permission', () => {
				const setup = () => {
					const user = userFactory.asStudent().build();
					const targetUser = userFactory.build();
					const context = AuthorizationContextBuilder.write([Permission.FILESTORAGE_VIEW]);
					return {
						user,
						targetUser,
						context,
					};
				};

				it('should return false', () => {
					const { user, targetUser, context } = setup();

					const result = rule.hasPermission(user, targetUser, context);

					expect(result).toEqual(false);
				});
			});
		});
	});
});
