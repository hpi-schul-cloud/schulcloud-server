import {
	AUTHORIZATION_CONFIG_TOKEN,
	AuthorizationContext,
	AuthorizationContextBuilder,
	AuthorizationHelper,
	AuthorizationInjectionService,
} from '@modules/authorization';
import { instanceFactory } from '@modules/instance/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { InstanceRule } from './instance.rule';

const TEST_PERMISSION = 'TEST_PERMISSION' as Permission;

describe(InstanceRule.name, () => {
	let module: TestingModule;
	let rule: InstanceRule;
	let injectionService: AuthorizationInjectionService;

	beforeAll(async () => {
		await setupEntities([User]);

		module = await Test.createTestingModule({
			providers: [
				InstanceRule,
				AuthorizationHelper,
				AuthorizationInjectionService,
				{ provide: AUTHORIZATION_CONFIG_TOKEN, useValue: {} },
			],
		}).compile();

		rule = module.get(InstanceRule);
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
		describe('when the entity is applicable', () => {
			const setup = () => {
				const user = userFactory.build();
				const instance = instanceFactory.build();

				return {
					user,
					instance,
				};
			};

			it('should return true', () => {
				const { user, instance } = setup();

				const result = rule.isApplicable(user, instance);

				expect(result).toEqual(true);
			});
		});

		describe('when the entity is not applicable', () => {
			const setup = () => {
				const user = userFactory.build();
				const notInstance = userFactory.build();

				return {
					user,
					notInstance,
				};
			};

			it('should return false', () => {
				const { user, notInstance } = setup();

				const result = rule.isApplicable(user, notInstance);

				expect(result).toEqual(false);
			});
		});
	});

	describe('hasPermission', () => {
		describe('Given a invalid operation is requested', () => {
			const setup = () => {
				const user = userFactory.withPermissionsInRole([Permission.INSTANCE_VIEW]).buildWithId();
				const instance = instanceFactory.build();
				const context = {
					action: 'test',
					requiredPermissions: [],
				} as unknown as AuthorizationContext;

				return { user, instance, context };
			};

			it('should throw not implemented', () => {
				const { user, instance, context } = setup();

				expect(() => rule.hasPermission(user, instance, context)).toThrowError(new NotImplementedException());
			});
		});

		describe('Given a read operation is requested', () => {
			const createParamsFromUserAndContextPermissions = (
				userPermissions: Permission[],
				additionalContextPermissions: Permission[] = []
			) => {
				const context = AuthorizationContextBuilder.read(additionalContextPermissions);
				const user = userFactory.withPermissionsInRole(userPermissions).buildWithId();
				const instance = instanceFactory.build();

				return { user, instance, context };
			};

			describe('when user has CAN_EXECUTE_INSTANCE_OPERATIONS and INSTANCE_VIEW', () => {
				const setup = () =>
					createParamsFromUserAndContextPermissions([
						Permission.INSTANCE_VIEW,
						Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
					]);

				it('should be return true', () => {
					const { user, instance, context } = setup();

					const result = rule.hasPermission(user, instance, context);

					expect(result).toBe(true);
				});
			});

			describe('when user has CAN_EXECUTE_INSTANCE_OPERATIONS and INSTANCE_EDIT', () => {
				const setup = () =>
					createParamsFromUserAndContextPermissions([
						Permission.INSTANCE_EDIT,
						Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
					]);

				it('should return false', () => {
					const { user, instance, context } = setup();

					const result = rule.hasPermission(user, instance, context);

					expect(result).toBe(false);
				});
			});

			describe('when user has INSTANCE_VIEW', () => {
				const setup = () => createParamsFromUserAndContextPermissions([Permission.INSTANCE_VIEW]);

				it('should be return false, because it is not implemented', () => {
					const { user, instance, context } = setup();

					const result = rule.hasPermission(user, instance, context);

					expect(result).toBe(false);
				});
			});

			describe('when user has INSTANCE_EDIT', () => {
				const setup = () => createParamsFromUserAndContextPermissions([Permission.INSTANCE_EDIT]);

				it('should be return false', () => {
					const { user, instance, context } = setup();

					const result = rule.hasPermission(user, instance, context);

					expect(result).toBe(false);
				});
			});

			describe('when user has no required permission', () => {
				const setup = () => createParamsFromUserAndContextPermissions([]);

				it('should be return false', () => {
					const { user, instance, context } = setup();

					const result = rule.hasPermission(user, instance, context);

					expect(result).toBe(false);
				});
			});

			describe('when additional required permission is passed and user with CAN_EXECUTE_INSTANCE_OPERATIONS has it.', () => {
				const setup = () =>
					createParamsFromUserAndContextPermissions(
						[Permission.INSTANCE_VIEW, Permission.CAN_EXECUTE_INSTANCE_OPERATIONS, TEST_PERMISSION],
						[TEST_PERMISSION]
					);

				it('should be return true', () => {
					const { user, instance, context } = setup();

					const result = rule.hasPermission(user, instance, context);

					expect(result).toBe(true);
				});
			});

			describe('when additional required permission is passed but user with CAN_EXECUTE_INSTANCE_OPERATIONS do not have it.', () => {
				const setup = () =>
					createParamsFromUserAndContextPermissions(
						[Permission.INSTANCE_VIEW, Permission.CAN_EXECUTE_INSTANCE_OPERATIONS],
						[TEST_PERMISSION]
					);

				it('should be return false', () => {
					const { user, instance, context } = setup();

					const result = rule.hasPermission(user, instance, context);

					expect(result).toBe(false);
				});
			});

			describe('when additional required permission is passed and user has it.', () => {
				const setup = () =>
					createParamsFromUserAndContextPermissions([Permission.INSTANCE_VIEW, TEST_PERMISSION], [TEST_PERMISSION]);

				it('should be return false, because it is not implemented', () => {
					const { user, instance, context } = setup();

					const result = rule.hasPermission(user, instance, context);

					expect(result).toBe(false);
				});
			});

			describe('when additional required permission is passed but user do not have it.', () => {
				const setup = () => createParamsFromUserAndContextPermissions([Permission.INSTANCE_VIEW], [TEST_PERMISSION]);

				it('should be return false', () => {
					const { user, instance, context } = setup();

					const result = rule.hasPermission(user, instance, context);

					expect(result).toBe(false);
				});
			});
		});

		describe('Given a write operation is requested', () => {
			const createParamsFromUserAndContextPermissions = (
				userPermissions: Permission[],
				additionalContextPermissions: Permission[] = []
			) => {
				const context = AuthorizationContextBuilder.write(additionalContextPermissions);
				const user = userFactory.withPermissionsInRole(userPermissions).buildWithId();
				const instance = instanceFactory.build();

				return { user, instance, context };
			};

			describe('when user has CAN_EXECUTE_INSTANCE_OPERATIONS and INSTANCE_VIEW', () => {
				const setup = () =>
					createParamsFromUserAndContextPermissions([
						Permission.INSTANCE_VIEW,
						Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
					]);

				it('should be return false', () => {
					const { user, instance, context } = setup();

					const result = rule.hasPermission(user, instance, context);

					expect(result).toBe(false);
				});
			});

			describe('when user has CAN_EXECUTE_INSTANCE_OPERATIONS and INSTANCE_EDIT', () => {
				const setup = () =>
					createParamsFromUserAndContextPermissions([
						Permission.INSTANCE_EDIT,
						Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
					]);

				it('should be return true', () => {
					const { user, instance, context } = setup();

					const result = rule.hasPermission(user, instance, context);

					expect(result).toBe(true);
				});
			});

			describe('when user has INSTANCE_VIEW', () => {
				const setup = () => createParamsFromUserAndContextPermissions([Permission.INSTANCE_VIEW]);

				it('should be return false, because it is not implemented', () => {
					const { user, instance, context } = setup();

					const result = rule.hasPermission(user, instance, context);

					expect(result).toBe(false);
				});
			});

			describe('when user has INSTANCE_EDIT', () => {
				const setup = () => createParamsFromUserAndContextPermissions([Permission.INSTANCE_EDIT]);

				it('should be return false, because it is not implemented', () => {
					const { user, instance, context } = setup();

					const result = rule.hasPermission(user, instance, context);

					expect(result).toBe(false);
				});
			});

			describe('when user has no required permission', () => {
				const setup = () => createParamsFromUserAndContextPermissions([]);

				it('should be return false', () => {
					const { user, instance, context } = setup();

					const result = rule.hasPermission(user, instance, context);

					expect(result).toBe(false);
				});
			});

			describe('when additional required permission is passed and user with CAN_EXECUTE_INSTANCE_OPERATIONS has it.', () => {
				const setup = () =>
					createParamsFromUserAndContextPermissions(
						[Permission.INSTANCE_EDIT, Permission.CAN_EXECUTE_INSTANCE_OPERATIONS, TEST_PERMISSION],
						[TEST_PERMISSION]
					);

				it('should be return true', () => {
					const { user, instance, context } = setup();

					const result = rule.hasPermission(user, instance, context);

					expect(result).toBe(true);
				});
			});

			describe('when additional required permission is passed but user with CAN_EXECUTE_INSTANCE_OPERATIONS do not have it.', () => {
				const setup = () =>
					createParamsFromUserAndContextPermissions(
						[Permission.INSTANCE_EDIT, Permission.CAN_EXECUTE_INSTANCE_OPERATIONS],
						[TEST_PERMISSION]
					);

				it('should be return false', () => {
					const { user, instance, context } = setup();

					const result = rule.hasPermission(user, instance, context);

					expect(result).toBe(false);
				});
			});

			describe('when additional required permission is passed and user has it.', () => {
				const setup = () =>
					createParamsFromUserAndContextPermissions([Permission.INSTANCE_EDIT, TEST_PERMISSION], [TEST_PERMISSION]);

				it('should be return false, because it is not implemented', () => {
					const { user, instance, context } = setup();

					const result = rule.hasPermission(user, instance, context);

					expect(result).toBe(false);
				});
			});

			describe('when additional required permission is passed but user do not have it.', () => {
				const setup = () => createParamsFromUserAndContextPermissions([Permission.INSTANCE_EDIT], [TEST_PERMISSION]);

				it('should be return false, because it is not implemented', () => {
					const { user, instance, context } = setup();

					const result = rule.hasPermission(user, instance, context);

					expect(result).toBe(false);
				});
			});
		});
	});
});
