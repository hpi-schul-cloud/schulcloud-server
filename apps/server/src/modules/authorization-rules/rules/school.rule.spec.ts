import {
	AUTHORIZATION_CONFIG_TOKEN,
	AuthorizationContext,
	AuthorizationContextBuilder,
	AuthorizationHelper,
	AuthorizationInjectionService,
} from '@modules/authorization';
import { schoolEntityFactory } from '@modules/school/testing';
import { schoolFactory } from '@modules/school/testing/school.factory';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface/permission.enum';
import { setupEntities } from '@testing/database';
import { SchoolRule } from './school.rule';

const TEST_PERMISSION = 'TEST_PERMISSION' as Permission;

describe('SchoolRule', () => {
	let rule: SchoolRule;
	let injectionService: AuthorizationInjectionService;
	let module: TestingModule;

	beforeAll(async () => {
		await setupEntities([User]);

		module = await Test.createTestingModule({
			providers: [
				SchoolRule,
				AuthorizationHelper,
				AuthorizationInjectionService,
				{ provide: AUTHORIZATION_CONFIG_TOKEN, useValue: {} },
			],
		}).compile();

		rule = await module.get(SchoolRule);
		injectionService = await module.get(AuthorizationInjectionService);
	});

	afterEach(() => {
		jest.clearAllMocks();
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
		describe('when object is instance of School', () => {
			const setup = () => {
				const school = schoolFactory.build();
				const schoolEntity = schoolEntityFactory.buildWithId(undefined, school.id);
				const user = userFactory.buildWithId({ school: schoolEntity });

				return { user, school };
			};

			it('should return true', () => {
				const { user, school } = setup();

				const result = rule.isApplicable(user, school);

				expect(result).toBe(true);
			});
		});

		describe('when object is not instance of School', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const someRandomObject = { foo: 'bar' };

				return { user, someRandomObject };
			};

			it('should return false', () => {
				const { user, someRandomObject } = setup();

				const result = rule.isApplicable(user, someRandomObject);

				expect(result).toBe(false);
			});
		});
	});

	describe('hasPermission', () => {
		describe('Given a invalid operation is requested', () => {
			const setup = () => {
				const school = schoolFactory.build();
				const schoolEntity = schoolEntityFactory.buildWithId(undefined, school.id);
				const user = userFactory.withPermissionsInRole([Permission.SCHOOL_VIEW]).buildWithId({ school: schoolEntity });

				const context = {
					action: 'test',
					requiredPermissions: [],
				} as unknown as AuthorizationContext;

				return { user, school, context };
			};

			it('should throw not implemented', () => {
				const { user, school, context } = setup();

				expect(() => rule.hasPermission(user, school, context)).toThrowError(new NotImplementedException());
			});
		});

		describe('Given a read operation is requested', () => {
			const createParamsFromUserAndContextPermissions = (
				userPermissions: Permission[],
				additionalContextPermissions: Permission[] = []
			) => {
				const context = AuthorizationContextBuilder.read(additionalContextPermissions);
				const school = schoolFactory.build();
				const schoolEntity = schoolEntityFactory.buildWithId(undefined, school.id);
				const user = userFactory.withPermissionsInRole(userPermissions).buildWithId({ school: schoolEntity });

				return { user, school, context };
			};

			describe('when user has CAN_EXECUTE_INSTANCE_OPERATIONS and SCHOOL_VIEW', () => {
				const setup = () =>
					createParamsFromUserAndContextPermissions([
						Permission.SCHOOL_VIEW,
						Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
					]);

				it('should be return true', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toBe(true);
				});
			});

			describe('when user has CAN_EXECUTE_INSTANCE_OPERATIONS and SCHOOL_EDIT', () => {
				const setup = () =>
					createParamsFromUserAndContextPermissions([
						Permission.SCHOOL_EDIT,
						Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
					]);

				it('should be return false', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toBe(false);
				});
			});

			describe('when user has SCHOOL_VIEW', () => {
				const setup = () => createParamsFromUserAndContextPermissions([Permission.SCHOOL_VIEW]);

				it('should be return true', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toBe(true);
				});
			});

			describe('when user has SCHOOL_EDIT', () => {
				const setup = () => createParamsFromUserAndContextPermissions([Permission.SCHOOL_EDIT]);

				it('should be return false', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toBe(false);
				});
			});

			describe('when user has no required permission', () => {
				const setup = () => createParamsFromUserAndContextPermissions([]);

				it('should be return false', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toBe(false);
				});
			});

			describe('when school is user school', () => {
				const setup = () => createParamsFromUserAndContextPermissions([Permission.SCHOOL_VIEW]);

				it('should be return true', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toBe(true);
				});
			});

			describe('when school is not the user school', () => {
				const setup = () => {
					const context = AuthorizationContextBuilder.read([]);
					const school = schoolFactory.build();
					const otherSchoolEntity = schoolEntityFactory.buildWithId();
					const user = userFactory
						.withPermissionsInRole([Permission.SCHOOL_VIEW])
						.buildWithId({ school: otherSchoolEntity });

					return { user, school, context };
				};

				it('should be return false', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toBe(false);
				});
			});

			describe('when school is user school and has CAN_EXECUTE_INSTANCE_OPERATIONS', () => {
				const setup = () =>
					createParamsFromUserAndContextPermissions([
						Permission.SCHOOL_VIEW,
						Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
					]);

				it('should be return true', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toBe(true);
				});
			});

			describe('when school is not the user school and user has CAN_EXECUTE_INSTANCE_OPERATIONS', () => {
				const setup = () => {
					const context = AuthorizationContextBuilder.read([]);
					const school = schoolFactory.build();
					const otherSchoolEntity = schoolEntityFactory.buildWithId();
					const user = userFactory
						.withPermissionsInRole([Permission.SCHOOL_VIEW, Permission.CAN_EXECUTE_INSTANCE_OPERATIONS])
						.buildWithId({ school: otherSchoolEntity });

					return { user, school, context };
				};

				it('should be return true', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toBe(true);
				});
			});

			describe('when additional required permission is passed and user with CAN_EXECUTE_INSTANCE_OPERATIONS has it.', () => {
				const setup = () =>
					createParamsFromUserAndContextPermissions(
						[Permission.SCHOOL_VIEW, Permission.CAN_EXECUTE_INSTANCE_OPERATIONS, TEST_PERMISSION],
						[TEST_PERMISSION]
					);

				it('should be return true', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toBe(true);
				});
			});

			describe('when additional required permission is passed but user with CAN_EXECUTE_INSTANCE_OPERATIONS do not have it.', () => {
				const setup = () =>
					createParamsFromUserAndContextPermissions(
						[Permission.SCHOOL_VIEW, Permission.CAN_EXECUTE_INSTANCE_OPERATIONS],
						[TEST_PERMISSION]
					);

				it('should be return false', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toBe(false);
				});
			});

			describe('when additional required permission is passed and user has it.', () => {
				const setup = () =>
					createParamsFromUserAndContextPermissions([Permission.SCHOOL_VIEW, TEST_PERMISSION], [TEST_PERMISSION]);

				it('should be return true', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toBe(true);
				});
			});

			describe('when additional required permission is passed but user do not have it.', () => {
				const setup = () => createParamsFromUserAndContextPermissions([Permission.SCHOOL_VIEW], [TEST_PERMISSION]);

				it('should be return false', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

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
				const school = schoolFactory.build();
				const schoolEntity = schoolEntityFactory.buildWithId(undefined, school.id);
				const user = userFactory.withPermissionsInRole(userPermissions).buildWithId({ school: schoolEntity });

				return { user, school, context };
			};

			describe('when user has CAN_EXECUTE_INSTANCE_OPERATIONS and SCHOOL_VIEW', () => {
				const setup = () =>
					createParamsFromUserAndContextPermissions([
						Permission.SCHOOL_VIEW,
						Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
					]);

				it('should be return false', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toBe(false);
				});
			});

			describe('when user has CAN_EXECUTE_INSTANCE_OPERATIONS and SCHOOL_EDIT', () => {
				const setup = () =>
					createParamsFromUserAndContextPermissions([
						Permission.SCHOOL_EDIT,
						Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
					]);

				it('should be return true', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toBe(true);
				});
			});

			describe('when user has SCHOOL_VIEW', () => {
				const setup = () => createParamsFromUserAndContextPermissions([Permission.SCHOOL_VIEW]);

				it('should be return false', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toBe(false);
				});
			});

			describe('when user has SCHOOL_EDIT', () => {
				const setup = () => createParamsFromUserAndContextPermissions([Permission.SCHOOL_EDIT]);

				it('should be return true', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toBe(true);
				});
			});

			describe('when user has no required permission', () => {
				const setup = () => createParamsFromUserAndContextPermissions([]);

				it('should be return false', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toBe(false);
				});
			});

			describe('when school is user school', () => {
				const setup = () => createParamsFromUserAndContextPermissions([Permission.SCHOOL_EDIT]);

				it('should be return true', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toBe(true);
				});
			});

			describe('when school is user not school', () => {
				const setup = () => {
					const context = AuthorizationContextBuilder.read([]);
					const school = schoolFactory.build();
					const otherSchoolEntity = schoolEntityFactory.buildWithId();
					const user = userFactory
						.withPermissionsInRole([Permission.SCHOOL_VIEW])
						.buildWithId({ school: otherSchoolEntity });

					return { user, school, context };
				};

				it('should be return false', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toBe(false);
				});
			});

			describe('when additional required permission is passed and user with CAN_EXECUTE_INSTANCE_OPERATIONS has it.', () => {
				const setup = () =>
					createParamsFromUserAndContextPermissions(
						[Permission.SCHOOL_EDIT, Permission.CAN_EXECUTE_INSTANCE_OPERATIONS, TEST_PERMISSION],
						[TEST_PERMISSION]
					);

				it('should be return true', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toBe(true);
				});
			});

			describe('when additional required permission is passed but user with CAN_EXECUTE_INSTANCE_OPERATIONS do not have it.', () => {
				const setup = () =>
					createParamsFromUserAndContextPermissions(
						[Permission.SCHOOL_EDIT, Permission.CAN_EXECUTE_INSTANCE_OPERATIONS],
						[TEST_PERMISSION]
					);

				it('should be return false', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toBe(false);
				});
			});

			describe('when additional required permission is passed and user has it.', () => {
				const setup = () =>
					createParamsFromUserAndContextPermissions([Permission.SCHOOL_EDIT, TEST_PERMISSION], [TEST_PERMISSION]);

				it('should be return true', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toBe(true);
				});
			});

			describe('when additional required permission is passed but user do not have it.', () => {
				const setup = () => createParamsFromUserAndContextPermissions([Permission.SCHOOL_EDIT], [TEST_PERMISSION]);

				it('should be return false', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toBe(false);
				});
			});
		});
	});
});
