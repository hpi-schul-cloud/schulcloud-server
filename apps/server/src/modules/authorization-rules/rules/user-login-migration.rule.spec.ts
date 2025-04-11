import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
} from '@modules/authorization';
import { schoolEntityFactory } from '@modules/school/testing';
import { userLoginMigrationDOFactory } from '@modules/user-login-migration/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { UserLoginMigrationRule } from './user-login-migration.rule';

describe('UserLoginMigrationRule', () => {
	let module: TestingModule;
	let rule: UserLoginMigrationRule;
	let injectionService: AuthorizationInjectionService;

	let authorizationHelper: DeepMocked<AuthorizationHelper>;

	beforeAll(async () => {
		await setupEntities([User]);

		module = await Test.createTestingModule({
			providers: [
				UserLoginMigrationRule,
				{
					provide: AuthorizationHelper,
					useValue: createMock<AuthorizationHelper>(),
				},
				AuthorizationInjectionService,
			],
		}).compile();

		rule = module.get(UserLoginMigrationRule);
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
		describe('when the entity is applicable', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId();

				return {
					user,
					userLoginMigration,
				};
			};

			it('should return true', () => {
				const { user, userLoginMigration } = setup();

				const result = rule.isApplicable(user, userLoginMigration);

				expect(result).toEqual(true);
			});
		});

		describe('when the entity is not applicable', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const notUserLoginMigration = userFactory.buildWithId();

				return {
					user,
					notUserLoginMigration,
				};
			};

			it('should return false', () => {
				const { user, notUserLoginMigration } = setup();

				const result = rule.isApplicable(user, notUserLoginMigration);

				expect(result).toEqual(false);
			});
		});
	});

	describe('hasPermission', () => {
		describe('when the user has all permissions and is at the school', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const user = userFactory.buildWithId({
					school: schoolEntityFactory.buildWithId(undefined, schoolId),
				});
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId({ schoolId });
				const context: AuthorizationContext = {
					action: Action.write,
					requiredPermissions: [Permission.USER_LOGIN_MIGRATION_ADMIN],
				};

				authorizationHelper.hasAllPermissions.mockReturnValue(true);

				return {
					user,
					userLoginMigration,
					context,
				};
			};

			it('should check all permissions', () => {
				const { user, userLoginMigration, context } = setup();

				rule.hasPermission(user, userLoginMigration, context);

				expect(authorizationHelper.hasAllPermissions).toHaveBeenCalledWith(user, context.requiredPermissions);
			});

			it('should return true', () => {
				const { user, userLoginMigration, context } = setup();

				const result = rule.hasPermission(user, userLoginMigration, context);

				expect(result).toEqual(true);
			});
		});

		describe('when the user has all permissions, but is at a different school', () => {
			const setup = () => {
				const user = userFactory.buildWithId({
					school: schoolEntityFactory.buildWithId(undefined, new ObjectId().toHexString()),
				});
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId({ schoolId: new ObjectId().toHexString() });
				const context: AuthorizationContext = {
					action: Action.write,
					requiredPermissions: [Permission.USER_LOGIN_MIGRATION_ADMIN],
				};

				authorizationHelper.hasAllPermissions.mockReturnValue(true);

				return {
					user,
					userLoginMigration,
					context,
				};
			};

			it('should return false', () => {
				const { user, userLoginMigration, context } = setup();

				const result = rule.hasPermission(user, userLoginMigration, context);

				expect(result).toEqual(false);
			});
		});

		describe('when the user has no permission', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const user = userFactory.buildWithId({
					school: schoolEntityFactory.buildWithId(undefined, schoolId),
				});
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId({ schoolId });
				const context: AuthorizationContext = {
					action: Action.write,
					requiredPermissions: [Permission.USER_LOGIN_MIGRATION_ADMIN],
				};

				authorizationHelper.hasAllPermissions.mockReturnValue(false);

				return {
					user,
					userLoginMigration,
					context,
				};
			};

			it('should return false', () => {
				const { user, userLoginMigration, context } = setup();

				const result = rule.hasPermission(user, userLoginMigration, context);

				expect(result).toEqual(false);
			});
		});
	});
});
