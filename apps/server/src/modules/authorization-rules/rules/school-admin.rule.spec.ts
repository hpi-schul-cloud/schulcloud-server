import { DeepMocked } from '@golevelup/ts-jest';
import {
	AuthorizationContextBuilder,
	AuthorizationHelper,
	AuthorizationInjectionService,
} from '@modules/authorization';
import { schoolFactory } from '@modules/school/testing/school.factory';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface/permission.enum';
import { setupEntities } from '@testing/database';
import { SchoolAdminRule } from './school-admin.rule';

describe(SchoolAdminRule.name, () => {
	let rule: SchoolAdminRule;
	let authorizationHelper: DeepMocked<AuthorizationHelper>;
	let injectionService: AuthorizationInjectionService;
	let module: TestingModule;

	beforeAll(async () => {
		await setupEntities([User]);

		module = await Test.createTestingModule({
			providers: [SchoolAdminRule, AuthorizationHelper, AuthorizationInjectionService],
		}).compile();

		rule = await module.get(SchoolAdminRule);
		authorizationHelper = await module.get(AuthorizationHelper);
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
		describe('when object is school of School', () => {
			const setup = () => {
				const user = userFactory.asSuperhero([Permission.INSTANCE_EDIT]).build();
				const school = schoolFactory.build();

				return { user, school };
			};

			it('should return true', () => {
				const { user, school } = setup();

				const result = rule.isApplicable(user, school);

				expect(result).toBe(true);
			});
		});

		describe('when object is not school of School', () => {
			const setup = () => {
				const user = userFactory.asSuperhero([Permission.INSTANCE_EDIT]).build();
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
		describe('when user is a superhero', () => {
			describe('when the user has write permissions', () => {
				const setup = () => {
					const user = userFactory.asSuperhero().build();
					const school = schoolFactory.build();
					const context = AuthorizationContextBuilder.write([Permission.CREATE_SUPPORT_JWT]);

					return {
						user,
						school,
						context,
					};
				};

				it('should call hasAllPermissions with expected props', () => {
					const { user, school, context } = setup();
					const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');

					rule.hasPermission(user, school, context);

					expect(spy).toHaveBeenCalledWith(user, [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS]);
					expect(spy).toHaveBeenCalledWith(user, [Permission.INSTANCE_EDIT, ...context.requiredPermissions]);
				});

				it('should return true', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toEqual(true);
				});
			});

			describe('when the user has read permissions', () => {
				const setup = () => {
					const user = userFactory.asSuperhero().build();
					const school = schoolFactory.build();
					const context = AuthorizationContextBuilder.read([Permission.CREATE_SUPPORT_JWT]);

					return {
						user,
						school,
						context,
					};
				};

				it('should call hasAllPermissions with expected props', () => {
					const { user, school, context } = setup();
					const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');

					rule.hasPermission(user, school, context);

					expect(spy).toHaveBeenCalledWith(user, [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS]);
					expect(spy).toHaveBeenCalledWith(user, [Permission.INSTANCE_VIEW, ...context.requiredPermissions]);
				});

				it('should return true', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toEqual(true);
				});
			});
		});

		describe('when user is a student', () => {
			describe('when the user has no write permission', () => {
				const setup = () => {
					const user = userFactory.asStudent().build();
					const school = schoolFactory.build();
					const context = AuthorizationContextBuilder.write([Permission.FILESTORAGE_VIEW]);
					return {
						user,
						school,
						context,
					};
				};

				it('should return false', () => {
					const { user, school, context } = setup();

					const result = rule.hasPermission(user, school, context);

					expect(result).toEqual(false);
				});
			});
		});
	});
});
